import { Tabs, Redirect } from "expo-router";
import { Home, User, Film, Sparkles, Search } from "lucide-react-native";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useAppStore } from "../../src/lib/store";

export default function TabsLayout() {
    const { isAuthenticated, authLoading, isPremium } = useAppStore();

    // While waiting for initial auth check to resolve, don't render the layout
    // The global _layout.tsx handles the actual loading spinner.
    if (authLoading) return null;

    // If the user hits a deep link into the tabs but is not authenticated,
    // redirect them instantly to the login screen.
    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: isPremium ? "#D4AF37" : "#fff",
                tabBarInactiveTintColor: "#808080",
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <Home color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color }) => <Search color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="new-popular"
                options={{
                    title: "New & Hot",
                    tabBarIcon: ({ color }) => <Sparkles color={color} size={22} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => <User color={color} size={22} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "rgba(20,20,20,0.85)",
        borderTopColor: 'transparent',
        height: 70,
        paddingBottom: 16,
        paddingTop: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        elevation: 0,
    },
    tabBarLabel: {
        fontSize: 10,
    },
});
