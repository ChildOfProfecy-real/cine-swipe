import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react-native";
import { useState } from "react";
import { forgotPasswordAPI } from "../src/lib/api";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await forgotPasswordAPI(email.trim());
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {sent ? (
                    <View style={styles.successContainer}>
                        <CheckCircle color="#4CAF50" size={64} />
                        <Text style={styles.title}>Check Your Email</Text>
                        <Text style={styles.subtitle}>
                            If an account exists for {email}, you'll receive a password reset link shortly.
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
                            <Text style={styles.buttonText}>Back to Login</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Mail color="#E50914" size={48} />
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Email address"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Reset Link</Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    backButton: { padding: 16 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    successContainer: { alignItems: 'center', gap: 16 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    subtitle: { color: '#999', fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },
    input: {
        width: '100%', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1,
        borderColor: '#333', marginBottom: 16,
    },
    errorText: { color: '#E50914', fontSize: 13, marginBottom: 12 },
    button: {
        backgroundColor: '#E50914', width: '100%', paddingVertical: 16,
        borderRadius: 12, alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
