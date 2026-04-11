import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import {
    createRazorpaySubscription,
    cancelRazorpaySubscription,
    verifyRazorpaySignature,
    verifyWebhookSignature,
    isPremiumStatus,
    FREE_CLIP_LIMIT,
    SUBSCRIPTION_AMOUNT,
} from '../lib/razorpay';

const router = Router();

// ============== GET /subscription/status ==============
// Returns the user's subscription status + whether they're premium
router.get('/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        let subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        // Auto-create FREE subscription record if none exists
        if (!subscription) {
            subscription = await prisma.subscription.create({
                data: { userId, status: 'FREE' },
            });
        }

        // Check if past-due or cancelled subscription has expired
        const isPremium = isPremiumStatus(subscription.status, subscription.currentPeriodEnd);

        // Auto-expire if status says active but period has ended
        if ((subscription.status === 'CANCELLED' || subscription.status === 'PAST_DUE') && !isPremium) {
            subscription = await prisma.subscription.update({
                where: { userId },
                data: { status: 'EXPIRED' },
            });
        }

        res.json({
            status: subscription.status,
            isPremium,
            currentPeriodEnd: subscription.currentPeriodEnd,
            freeClipLimit: FREE_CLIP_LIMIT,
        });
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});

// ============== POST /subscription/create ==============
// Creates a Razorpay subscription and returns checkout options
router.post('/create', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const planId = process.env.RAZORPAY_PLAN_ID;

        if (!planId) {
            res.status(500).json({ error: 'Payment gateway not configured' });
            return;
        }

        // Check if already active
        const existing = await prisma.subscription.findUnique({ where: { userId } });
        if (existing && isPremiumStatus(existing.status, existing.currentPeriodEnd)) {
            res.status(400).json({ error: 'You already have an active subscription' });
            return;
        }

        // Create Razorpay subscription
        const razorpaySub = await createRazorpaySubscription(planId);

        // Upsert subscription record
        await prisma.subscription.upsert({
            where: { userId },
            update: {
                razorpaySubId: razorpaySub.id,
                razorpayPlanId: planId,
                status: 'FREE', // Still free until payment verified
            },
            create: {
                userId,
                razorpaySubId: razorpaySub.id,
                razorpayPlanId: planId,
                status: 'FREE',
            },
        });

        res.json({
            subscriptionId: razorpaySub.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            amount: SUBSCRIPTION_AMOUNT,
            currency: 'INR',
            name: 'CineSwipe Premium',
            description: '₹50/month — Unlimited movies',
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// ============== POST /subscription/verify ==============
// Verifies payment signature after Razorpay checkout
router.post('/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
        } = req.body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            res.status(400).json({ error: 'Missing payment verification data' });
            return;
        }

        // Verify cryptographic signature
        const isValid = verifyRazorpaySignature(
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
        );

        if (!isValid) {
            res.status(400).json({ error: 'Invalid payment signature' });
            return;
        }

        // Calculate period end (30 days from now)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        // Activate subscription
        const subscription = await prisma.subscription.update({
            where: { userId },
            data: {
                status: 'ACTIVE',
                razorpaySubId: razorpay_subscription_id,
                currentPeriodEnd,
            },
        });

        // Record payment (idempotent — unique on razorpayPaymentId)
        await prisma.payment.upsert({
            where: { razorpayPaymentId: razorpay_payment_id },
            update: { status: 'PAID' },
            create: {
                userId,
                razorpayPaymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_subscription_id,
                amount: SUBSCRIPTION_AMOUNT,
                status: 'PAID',
            },
        });

        console.log(`✅ Subscription activated for user ${userId}`);

        res.json({
            status: 'ACTIVE',
            isPremium: true,
            currentPeriodEnd: subscription.currentPeriodEnd,
        });
    } catch (error) {
        console.error('Verify subscription error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// ============== POST /subscription/webhook ==============
// Razorpay webhook handler — no auth middleware (verified by signature)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        // IMPORTANT: req.rawBody is populated by the verify callback in express.json()
        // If rawBody is not available, fall back to JSON.stringify (may differ from original)
        const rawBody = (req as any).rawBody || JSON.stringify(req.body);

        if (!signature || !verifyWebhookSignature(rawBody, signature)) {
            console.warn('⚠️ Invalid webhook signature');
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
        }

        const event = req.body.event as string;
        const payload = req.body.payload;

        console.log(`📩 Razorpay webhook: ${event}`);

        switch (event) {
            case 'subscription.activated':
            case 'subscription.charged': {
                // Recurring payment succeeded
                const subId = payload.subscription?.entity?.id;
                const paymentId = payload.payment?.entity?.id;
                const amount = payload.payment?.entity?.amount || SUBSCRIPTION_AMOUNT;

                if (!subId) break;

                const subscription = await prisma.subscription.findUnique({
                    where: { razorpaySubId: subId },
                });

                if (!subscription) {
                    console.warn(`⚠️ No subscription found for razorpaySubId: ${subId}`);
                    break;
                }

                const periodEnd = new Date();
                periodEnd.setDate(periodEnd.getDate() + 30);

                await prisma.subscription.update({
                    where: { razorpaySubId: subId },
                    data: {
                        status: 'ACTIVE',
                        currentPeriodEnd: periodEnd,
                    },
                });

                // Record payment (idempotent)
                if (paymentId) {
                    const existingPayment = await prisma.payment.findUnique({
                        where: { razorpayPaymentId: paymentId },
                    });

                    if (!existingPayment) {
                        await prisma.payment.create({
                            data: {
                                userId: subscription.userId,
                                razorpayPaymentId: paymentId,
                                razorpayOrderId: subId,
                                amount,
                                status: 'PAID',
                            },
                        });
                    }
                }

                console.log(`✅ Subscription renewed for user ${subscription.userId}`);
                break;
            }

            case 'subscription.halted':
            case 'subscription.pending': {
                // Payment failed — enter grace period
                const subId = payload.subscription?.entity?.id;
                if (!subId) break;

                await prisma.subscription.updateMany({
                    where: { razorpaySubId: subId },
                    data: { status: 'PAST_DUE' },
                });

                console.log(`⚠️ Subscription halted: ${subId}`);
                break;
            }

            case 'subscription.cancelled': {
                // User or admin cancelled
                const subId = payload.subscription?.entity?.id;
                if (!subId) break;

                await prisma.subscription.updateMany({
                    where: { razorpaySubId: subId },
                    data: { status: 'CANCELLED' },
                });

                console.log(`🚫 Subscription cancelled: ${subId}`);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled webhook event: ${event}`);
        }

        // Always respond 200 to Razorpay (even for unhandled events)
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        // Still respond 200 to prevent Razorpay retries for processing errors
        res.status(200).json({ received: true });
    }
});

// ============== POST /subscription/cancel-pending ==============
// User backed out of the paywall — cleans up pending Razorpay subscription
router.post('/cancel-pending', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        // Only cancel if they have a pending (FREE) subscription with a Razorpay ID
        if (subscription && subscription.status === 'FREE' && subscription.razorpaySubId) {
            try {
                // Cancel it immediately on Razorpay
                await cancelRazorpaySubscription(subscription.razorpaySubId);
            } catch (err) {
                console.warn('Razorpay cancel API error (may already be cancelled or incomplete):', err);
            }

            // Remove the Razorpay ID so we can generate a new one next time
            await prisma.subscription.update({
                where: { userId },
                data: { razorpaySubId: null, razorpayPlanId: null },
            });

            console.log(`🚫 User ${userId} cancelled pending subscription ${subscription.razorpaySubId}`);
        }

        res.json({ message: 'Pending subscription cancelled successfully' });
    } catch (error) {
        console.error('Cancel pending subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel pending subscription' });
    }
});

// ============== POST /subscription/cancel ==============
// User cancels their own subscription
router.post('/cancel', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const subscription = await prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            res.status(400).json({ error: 'No active subscription to cancel' });
            return;
        }

        // Cancel on Razorpay (at period end)
        if (subscription.razorpaySubId) {
            try {
                await cancelRazorpaySubscription(subscription.razorpaySubId);
            } catch (err) {
                console.warn('Razorpay cancel API error (may already be cancelled):', err);
            }
        }

        // Mark as cancelled — user keeps access until currentPeriodEnd
        await prisma.subscription.update({
            where: { userId },
            data: { status: 'CANCELLED' },
        });

        console.log(`🚫 User ${userId} cancelled subscription`);

        res.json({
            status: 'CANCELLED',
            isPremium: true, // Still premium until period ends
            currentPeriodEnd: subscription.currentPeriodEnd,
            message: 'Subscription cancelled. You will retain access until the end of your billing period.',
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

export default router;
