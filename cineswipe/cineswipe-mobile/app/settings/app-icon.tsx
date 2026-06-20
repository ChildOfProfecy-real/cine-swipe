import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../src/lib/store";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, Sparkles } from "lucide-react-native";

export default function AppIconScreen() {
    const router = useRouter();
    const { isPremium, appIcon, setAppIcon } = useAppStore();

    const icons = [
        { id: 'red', name: 'Classic Red', color: '#E50914', premiumOnly: false },
        { id: 'black', name: 'Stealth Black', color: '#1A1A1A', premiumOnly: true },
        { id: 'gold', name: 'Gold Edition', color: '#D4AF37', premiumOnly: true },
    ];

    const handleSelectIcon = (icon: typeof icons[0]) => {
        if (icon.premiumOnly && !isPremium) {
            Alert.alert(
                'Premium Feature',
                'This app icon is exclusively for Premium members. Upgrade to unlock this and many other features!',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => router.push('/paywall') }
                ]
            );
            return;
        }

        setAppIcon(icon.id);
        Alert.alert(
            'Icon Updated',
            'Your app icon preference has been saved! (Note: Dynamic icon changes on the home screen require native setup outside of Expo Go).'
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>App Icon</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Customize how CineSwipe looks on your home screen.
                </Text>

                <View style={styles.iconList}>
                    {icons.map((icon) => {
                        const isSelected = appIcon === icon.id;
                        return (
                            <TouchableOpacity
                                key={icon.id}
                                style={[
                                    styles.iconRow,
                                    isSelected && styles.iconRowSelected
                                ]}
                                onPress={() => handleSelectIcon(icon)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.iconPreviewContainer}>
                                    <View style={[styles.iconBox, { backgroundColor: icon.color }]}>
                                        <Sparkles color={icon.id === 'black' ? '#E50914' : '#fff'} size={24} />
                                    </View>
                                </View>
                                <View style={styles.iconInfo}>
                                    <Text style={styles.iconName}>{icon.name}</Text>
                                    {icon.premiumOnly && (
                                        <View style={styles.premiumBadge}>
                                            <Text style={styles.premiumText}>PREMIUM</Text>
                                        </View>
                                    )}
                                </View>
                                {isSelected && (
                                    <Check color="#D4AF37" size={24} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    description: {
        color: '#808080',
        fontSize: 15,
        marginBottom: 32,
        lineHeight: 22,
    },
    iconList: {
        gap: 16,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222',
    },
    iconRowSelected: {
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.05)',
    },
    iconPreviewContainer: {
        marginRight: 16,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconInfo: {
        flex: 1,
    },
    iconName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    premiumBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    premiumText: {
        color: '#D4AF37',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
