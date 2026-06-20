import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { useAppStore } from "../src/lib/store";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";

export default function SignUpScreen() {
    const router = useRouter();
    const { register, isAuthenticated } = useAppStore();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    // If already authenticated, redirect to home
    if (isAuthenticated) {
        router.replace("/(tabs)/home");
        return null;
    }

    const handleSignUp = async () => {
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);

        if (result.success) {
            Alert.alert("Success", result.message);
            router.replace("/(tabs)/home");
        } else {
            Alert.alert("Registration Failed", result.message);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <Text style={styles.logo}>CINESWIPE</Text>

                    {/* Sign Up Form Card */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Create Account</Text>
                        <Text style={styles.formSubtitle}>Join CineSwipe and discover movies you'll love</Text>

                        {/* Name Input */}
                        <View style={[styles.inputContainer, nameFocused && styles.inputFocused]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#8c8c8c"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                onFocus={() => setNameFocused(true)}
                                onBlur={() => setNameFocused(false)}
                            />
                        </View>

                        {/* Email Input */}
                        <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                placeholderTextColor="#8c8c8c"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={[styles.inputContainer, passwordFocused && styles.inputFocused]}>
                            <TextInput
                                style={styles.inputWithIcon}
                                placeholder="Password (min 6 characters)"
                                placeholderTextColor="#8c8c8c"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff color="#8c8c8c" size={20} />
                                ) : (
                                    <Eye color="#8c8c8c" size={20} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={[styles.inputContainer, confirmFocused && styles.inputFocused]}>
                            <TextInput
                                style={styles.inputWithIcon}
                                placeholder="Confirm Password"
                                placeholderTextColor="#8c8c8c"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                onFocus={() => setConfirmFocused(true)}
                                onBlur={() => setConfirmFocused(false)}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff color="#8c8c8c" size={20} />
                                ) : (
                                    <Eye color="#8c8c8c" size={20} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.signUpButtonText}>
                                {loading ? "Creating Account..." : "Sign Up"}
                            </Text>
                        </TouchableOpacity>

                        {/* Terms Text */}
                        <Text style={styles.termsText}>
                            By signing up, you agree to our{" "}
                            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                            <Text style={styles.termsLink}>Privacy Policy</Text>.
                        </Text>
                    </View>

                    {/* Sign In Link */}
                    <View style={styles.signInContainer}>
                        <Text style={styles.signInText}>Already have an account? </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signInLink}>Sign in.</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    logo: {
        color: '#E50914',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 4,
        textAlign: 'center',
        marginBottom: 30,
    },
    formCard: {
        backgroundColor: 'rgba(0,0,0,0.75)',
        borderRadius: 4,
        padding: 24,
        paddingTop: 32,
        paddingBottom: 32,
    },
    formTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    formSubtitle: {
        color: '#8c8c8c',
        fontSize: 14,
        marginBottom: 24,
    },
    inputContainer: {
        backgroundColor: '#333',
        borderRadius: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputFocused: {
        borderColor: '#fff',
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 50,
    },
    inputWithIcon: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        height: 50,
    },
    eyeIcon: {
        padding: 14,
    },
    signUpButton: {
        backgroundColor: '#E50914',
        borderRadius: 4,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    signUpButtonDisabled: {
        backgroundColor: '#8b0000',
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    termsText: {
        color: '#737373',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#fff',
    },
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
    },
    signInText: {
        color: '#737373',
        fontSize: 16,
    },
    signInLink: {
        color: '#fff',
        fontSize: 16,
    },
});
