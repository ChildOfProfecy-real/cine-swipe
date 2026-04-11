import { Tabs } from "expo-router";
import { Home, User, Film, Sparkles, Search } from "lucide-react-native";
import { StyleSheet } from "react-native";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: "#fff",
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
                name="movies"
                options={{
                    title: "Movies",
                    tabBarIcon: ({ color }) => <Film color={color} size={22} />,
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
                    title: "My Netflix",
                    tabBarIcon: ({ color }) => <User color={color} size={22} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "#141414",
        borderTopColor: 'transparent',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabBarLabel: {
        fontSize: 10,
    },
});
