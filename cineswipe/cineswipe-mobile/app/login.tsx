import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground } from "react-native";
import { useRouter, Link } from "expo-router";
import { useAppStore } from "../src/lib/store";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
    const router = useRouter();
    const { login, isAuthenticated, authError, clearAuthError } = useAppStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Redirect to home if already authenticated (e.g. after successful login)
    useEffect(() => {
        if (isAuthenticated) {
            router.replace("/(tabs)/home");
        }
    }, [isAuthenticated]);

    const handleLogin = async () => {
        if (!email || !password) {
            setLoginError('Please enter both email and password');
            return;
        }

        setLoginError(null);
        clearAuthError();
        setLoading(true);
        const success = await login(email, password);
        setLoading(false);

        if (!success) {
            // Show the actual API error instead of a generic message
            const errorMsg = useAppStore.getState().authError || 'Login failed. Please check your credentials or try again later.';
            setLoginError(errorMsg);
        }
        // If success, the useEffect above handles navigation
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background gradient overlay */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                {/* Logo */}
                <Text style={styles.logo}>CINESWIPE</Text>

                {/* Login Form Card */}
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Sign In</Text>

                    <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email or phone number"
                            placeholderTextColor="#8c8c8c"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                    </View>

                    <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#8c8c8c"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.signInButtonText}>
                            {loading ? "Signing In..." : "Sign In"}
                        </Text>
                    </TouchableOpacity>

                    {/* Inline error message (works on all platforms including web) */}
                    {loginError && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{loginError}</Text>
                        </View>
                    )}

                    <View style={styles.optionsRow}>
                        <View style={styles.rememberMe}>
                            <View style={styles.checkbox} />
                            <Text style={styles.rememberText}>Remember me</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                            <Text style={styles.helpText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>New to CineSwipe? </Text>
                    <Link href="/signup" asChild>
                        <TouchableOpacity>
                            <Text style={styles.signUpLink}>Sign up now.</Text>
                        </TouchableOpacity>
                    </Link>
                </View>

                {/* Recaptcha notice */}
                <Text style={styles.captchaText}>
                    This page is protected by Google reCAPTCHA to ensure you're not a bot.
                </Text>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logo: {
        color: '#E50914',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 40,
    },
    formCard: {
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 4,
        padding: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    formTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    inputContainer: {
        backgroundColor: '#333',
        borderRadius: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    inputFocused: {
        borderColor: '#fff',
    },
    input: {
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 50,
    },
    signInButton: {
        backgroundColor: '#E50914',
        borderRadius: 4,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    signInButtonDisabled: {
        backgroundColor: '#8b0000',
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: '#737373',
        borderRadius: 2,
        marginRight: 8,
    },
    rememberText: {
        color: '#b3b3b3',
        fontSize: 13,
    },
    helpText: {
        color: '#b3b3b3',
        fontSize: 13,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 80,
    },
    signUpText: {
        color: '#737373',
        fontSize: 16,
    },
    signUpLink: {
        color: '#fff',
        fontSize: 16,
    },
    captchaText: {
        color: '#737373',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 20,
    },
    errorBanner: {
        backgroundColor: '#E50914',
        borderRadius: 4,
        padding: 12,
        marginTop: 12,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
});
