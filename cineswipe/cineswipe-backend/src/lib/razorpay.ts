import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Grace period for failed renewals (3 days in ms)
export const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

// Free clip limit per movie
export const FREE_CLIP_LIMIT = 7;

// Subscription amount in paise (₹50 = 5000 paise)
export const SUBSCRIPTION_AMOUNT = 5000;

/**
 * Create a Razorpay subscription for a user.
 */
export async function createRazorpaySubscription(planId: string) {
    const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 12, // Max 12 billing cycles (1 year), auto-renews
        customer_notify: 1.0 as any, // Razorpay notifies the customer
    });
    return subscription;
}

/**
 * Cancel a Razorpay subscription (at end of billing period).
 */
export async function cancelRazorpaySubscription(subscriptionId: string) {
    const result = await razorpay.subscriptions.cancel(subscriptionId, false); // false = cancel at period end
    return result;
}

/**
 * Verify Razorpay payment signature (for subscription authentication).
 */
export function verifyRazorpaySignature(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string,
): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = razorpayPaymentId + '|' + razorpaySubscriptionId;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === razorpaySignature;
}

/**
 * Verify Razorpay webhook signature.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return expectedSignature === signature;
}

/**
 * Check if a subscription is currently premium (active or within grace period).
 */
export function isPremiumStatus(status: string, currentPeriodEnd: Date | null): boolean {
    if (status === 'ACTIVE') return true;

    if (status === 'PAST_DUE' && currentPeriodEnd) {
        const graceEnd = new Date(currentPeriodEnd.getTime() + GRACE_PERIOD_MS);
        return new Date() < graceEnd;
    }

    if (status === 'CANCELLED' && currentPeriodEnd) {
        return new Date() < currentPeriodEnd;
    }

    return false;
}

export default razorpay;
