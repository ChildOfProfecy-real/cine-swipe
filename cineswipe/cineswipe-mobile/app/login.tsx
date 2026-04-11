import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground } from "react-native";
import { useRouter, Link } from "expo-router";
import { useAppStore } from "../src/lib/store";
import { StatusBar } from "expo-status-bar";

export default function LoginScreen() {
    const router = useRouter();
    const { login, isAuthenticated } = useAppStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        router.replace("/(tabs)/home");
        return null;
    }

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        setLoading(true);
        const success = await login(email, password);
        setLoading(false);

        if (success) {
            router.replace("/(tabs)/home");
        } else {
            Alert.alert("Login Failed", "Invalid email or password.");
        }
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

                    <View style={styles.optionsRow}>
                        <View style={styles.rememberMe}>
                            <View style={styles.checkbox} />
                            <Text style={styles.rememberText}>Remember me</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.helpText}>Need help?</Text>
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
});
