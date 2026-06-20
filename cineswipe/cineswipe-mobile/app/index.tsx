import { Redirect } from "expo-router";
import { useAppStore } from "../src/lib/store";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
    const { isAuthenticated, authLoading } = useAppStore();

    // While checking auth status (e.g. restoring session), show nothing
    // The root _layout.tsx handles the initial loading spinner
    if (authLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    // If not authenticated, go to login
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // If authenticated, go to home
    return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
