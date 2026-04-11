import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAppStore } from "../src/lib/store";

export default function Layout() {
    const [isInitialized, setIsInitialized] = useState(false);
    const { checkAuth, fetchMovies, authLoading } = useAppStore();

    // Initialize app on mount - restore auth session and fetch movies
    useEffect(() => {
        const initialize = async () => {
            console.log('🚀 Initializing app...');
            try {
                // Check if user has a valid session from previous login
                await checkAuth();
                // Fetch movies for the app
                await fetchMovies();
                console.log('✅ App initialized');
            } catch (error) {
                console.error('❌ Initialization error:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        initialize();
    }, []);

    // Show loading screen while initializing
    if (!isInitialized || authLoading) {
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

