import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ExternalLink } from "lucide-react-native";

export default function AboutScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.appName}>CineSwipe</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
                <Text style={styles.description}>
                    CineSwipe is a short-form movie streaming app that lets you discover
                    and watch movies one clip at a time. Swipe through clips, save your
                    favorites, and unlock unlimited content with Premium.
                </Text>

                <View style={styles.links}>
                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => Linking.openURL('https://cineswipe.com/privacy')}
                    >
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <ExternalLink color="#888" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => Linking.openURL('https://cineswipe.com/terms')}
                    >
                        <Text style={styles.linkText}>Terms of Service</Text>
                        <ExternalLink color="#888" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkItem}
                        onPress={() => Linking.openURL('mailto:support@cineswipe.com')}
                    >
                        <Text style={styles.linkText}>Contact Support</Text>
                        <ExternalLink color="#888" size={16} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.copyright}>© 2026 CineSwipe. All rights reserved.</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222',
    },
    backButton: { padding: 4 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
    appName: { color: '#E50914', fontSize: 32, fontWeight: '800', marginBottom: 4 },
    version: { color: '#888', fontSize: 14, marginBottom: 24 },
    description: { color: '#ccc', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    links: { width: '100%', gap: 1 },
    linkItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222',
    },
    linkText: { color: '#fff', fontSize: 16 },
    copyright: { color: '#555', fontSize: 12, marginTop: 40 },
});
