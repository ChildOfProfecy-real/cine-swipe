import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAppStore } from "../src/lib/store";

export default function Layout() {
    const [isInitialized, setIsInitialized] = useState(false);
    const { checkAuth, fetchMovies, isAuthenticated, authLoading } = useAppStore();
    const router = useRouter();
    const segments = useSegments();
    const rootSegment = segments[0];

    // Initialize app on mount - restore auth session and fetch movies
    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 Initializing app...');
            try {
                // Check if user has a valid session from previous login
                await checkAuth();
                // Fetch movies for the app (don't block on failure)
                fetchMovies().catch(err => console.warn('Movie fetch failed:', err));
                console.log('✅ App initialized');
            } catch (error) {
                console.error('❌ Initialization error:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        initialize();
    }, []);

    // Global Auth Guard: Protect ALL routes and prevent bypassing login
    useEffect(() => {
        // Wait until initial auth check has completed
        if (!isInitialized || authLoading) return;

        const inAuthGroup = rootSegment === 'login' || rootSegment === 'signup';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if unauthenticated user tries to access ANY protected route
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to home if authenticated user tries to access login/signup
            router.replace('/(tabs)/home');
        }
    }, [isAuthenticated, isInitialized, rootSegment, authLoading]);

    // Show loading screen ONLY during initial boot — never during login/logout
    if (!isInitialized) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

