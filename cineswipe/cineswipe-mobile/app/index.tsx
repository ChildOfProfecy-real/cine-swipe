import { Redirect } from "expo-router";
import { useAppStore } from "../src/lib/store";

export default function Index() {
    const { isAuthenticated } = useAppStore();

    // If not authenticated, go to login
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    // If authenticated, go to home
    return <Redirect href="/(tabs)/home" />;
}
