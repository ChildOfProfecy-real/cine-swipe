import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Crown, ArrowLeft, Star } from "lucide-react-native";
import { useAppStore } from "../src/lib/store";
import { createSubscription, verifySubscription, cancelPendingSubscription } from "../src/lib/api";
import { useState } from "react";
import RazorpayCheckout from 'react-native-razorpay';

export default function PaywallScreen() {
    const { movieId, movieTitle, clipIndex, thumbnailUrl } = useLocalSearchParams<{
        movieId: string;
        movieTitle: string;
        clipIndex: string;
        thumbnailUrl: string;
    }>();
    const router = useRouter();
    const { fetchSubscriptionStatus, currentUser } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExit = async () => {
        setLoading(true);
        try {
            await cancelPendingSubscription();
        } catch (e) {
            console.warn('Silent cleanup error:', e);
        } finally {
            router.replace('/(tabs)/home');
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (Platform.OS !== 'web') {
                resolve(true); return;
            }
            if (typeof window !== 'undefined' && (window as any).Razorpay) {
                resolve(true); return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubscribe = async () => {
        setLoading(true);
        setError('');
        try {
            if (Platform.OS === 'web') {
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) throw new Error("Could not load payment gateway. Check your internet connection.");
            }

            // Step 1: Create subscription on backend
            const subData = await createSubscription();

            // Step 2: Open Razorpay checkout
            const options = {
                description: subData.description,
                currency: subData.currency,
                key: subData.razorpayKeyId,
                amount: subData.amount,
                name: subData.name,
                subscription_id: subData.subscriptionId,
                prefill: {
                    email: currentUser?.email || '',
                    name: currentUser?.name || '',
                },
                theme: { color: '#E50914' },
            };

            let paymentData: any;
            if (Platform.OS === 'web') {
                paymentData = await new Promise((resolve, reject) => {
                    const rzp = new (window as any).Razorpay({
                        ...options,
                        handler: function (response: any) {
                            resolve(response);
                        }
                    });
                    rzp.on('payment.failed', function (response: any) {
                        reject(new Error(response.error?.description || 'Payment Failed'));
                    });
                    rzp.open();
                });
            } else if (RazorpayCheckout) {
                paymentData = await RazorpayCheckout.open(options);
            } else {
                throw new Error("Razorpay native module is missing. Please run 'npx expo prebuild' and build a dev client, or test on the web.");
            }

            // Step 3: Verify payment
            await verifySubscription({
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_subscription_id: paymentData.razorpay_subscription_id,
                razorpay_signature: paymentData.razorpay_signature,
            });

            // Step 4: Refresh subscription status in store
            await fetchSubscriptionStatus();

            // Step 5: Navigate back to player at the clip they were blocked on
            const resumeIndex = clipIndex ? parseInt(clipIndex, 10) : 7;
            router.replace(`/player/${movieId}?clipIndex=${resumeIndex}`);
        } catch (err) {
            console.error('Payment Error:', err);
            // Route user back to home explicitly on any payment cancellation or failure
            handleExit();
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background */}
            {thumbnailUrl && (
                <Image
                    source={{ uri: thumbnailUrl as string }}
                    style={styles.backgroundImage}
                    blurRadius={20}
                />
            )}
            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={styles.overlay}
            />

            {/* Back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleExit}
                disabled={loading}
            >
                <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
                {/* Crown icon */}
                <View style={styles.crownContainer}>
                    <Crown color="#FFD700" size={48} fill="#FFD700" />
                </View>

                <Text style={styles.title}>Go Premium</Text>
                <Text style={styles.subtitle}>
                    Watch the full movie
                </Text>
                {movieTitle && (
                    <Text style={styles.movieName}>"{movieTitle}"</Text>
                )}

                <Text style={styles.description}>
                    You've watched the preview clips. Unlock unlimited access to the full movie and all content on CineSwipe.
                </Text>

                {/* Features */}
                <View style={styles.features}>
                    {[
                        'Watch all clips of every movie',
                        'Unlimited streaming, no restrictions',
                        'Cancel anytime, no commitments',
                    ].map((feature, i) => (
                        <View key={i} style={styles.featureRow}>
                            <Star color="#FFD700" size={16} fill="#FFD700" />
                            <Text style={styles.featureText}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* Price */}
                <View style={styles.priceCard}>
                    <Text style={styles.priceAmount}>₹50</Text>
                    <Text style={styles.pricePeriod}>/month</Text>
                    <Text style={styles.priceNote}>UPI Autopay · Cancel anytime</Text>
                </View>

                {/* Error */}
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                {/* Subscribe button */}
                <TouchableOpacity
                    style={[styles.subscribeButton, loading && styles.buttonDisabled]}
                    onPress={handleSubscribe}
                    disabled={loading}
                >
                    <Crown color="white" size={20} />
                    <Text style={styles.subscribeText}>
                        {loading ? 'Processing...' : 'Go Premium — ₹50/mo'}
                    </Text>
                </TouchableOpacity>

                {/* Not now */}
                <TouchableOpacity
                    style={styles.notNowButton}
                    onPress={handleExit}
                    disabled={loading}
                >
                    <Text style={styles.notNowText}>Not now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    backgroundImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.3,
    },
    overlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 10,
        borderRadius: 25,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    crownContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFD700',
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 4,
    },
    movieName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    description: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    features: {
        alignSelf: 'stretch',
        marginBottom: 24,
        gap: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        color: '#ddd',
        fontSize: 14,
    },
    priceCard: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginBottom: 20,
    },
    priceAmount: {
        color: '#FFD700',
        fontSize: 40,
        fontWeight: '800',
    },
    pricePeriod: {
        color: '#ccc',
        fontSize: 16,
        marginTop: -4,
    },
    priceNote: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
    errorText: {
        color: '#E50914',
        fontSize: 13,
        marginBottom: 10,
        textAlign: 'center',
    },
    subscribeButton: {
        backgroundColor: '#E50914',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        marginBottom: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    subscribeText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    notNowButton: {
        padding: 12,
    },
    notNowText: {
        color: '#666',
        fontSize: 14,
    },
});
