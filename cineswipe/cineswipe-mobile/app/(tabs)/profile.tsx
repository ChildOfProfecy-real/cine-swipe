import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../src/lib/store";
import { Link, useRouter } from "expo-router";
import { Heart, Clock, ChevronRight, LogOut, User, Settings, Bell, Download } from "lucide-react-native";
import { useState } from "react";

export default function ProfileScreen() {
    const router = useRouter();
    const { getLikedMovies, getWatchLaterMovies, currentUser, isAuthenticated, logout, isPremium } = useAppStore();
    const likedMovies = getLikedMovies();
    const watchLaterMovies = getWatchLaterMovies();
    const [showConfirm, setShowConfirm] = useState(false);

    const handlePremiumPress = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Do you want to subscribe to premium for unlimited access?");
            if (confirmed) {
                router.push('/paywall');
            }
        } else {
            import('react-native').then(({ Alert }) => {
                Alert.alert(
                    'Subscribe to Premium',
                    'Do you want to unlock unlimited clips and remove limits?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Yes', onPress: () => router.push('/paywall') }
                    ]
                );
            });
        }
    };

    const handleLogout = () => {
        // On web, Alert.alert doesn't work, so we use a simple confirm or direct logout
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to sign out?");
            if (confirmed) {
                performLogout();
            }
        } else {
            setShowConfirm(true);
        }
    };

    const performLogout = async () => {
        await logout();
        router.replace("/login");
    };

    const renderMovie = ({ item }: { item: any }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.movieCard}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.movieThumbnail}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        </Link>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Confirmation Modal for Native */}
            {showConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Sign Out</Text>
                        <Text style={styles.modalText}>Are you sure you want to sign out?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowConfirm(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={performLogout}
                            >
                                <Text style={styles.confirmButtonText}>Sign Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with User Info */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Netflix</Text>
                    {isAuthenticated && currentUser && (
                        <View style={styles.userBadge}>
                            <User color="#fff" size={14} />
                            <Text style={styles.userName}>{currentUser.name}</Text>
                        </View>
                    )}
                </View>

                {/* User Profile Card - Only shown when logged in */}
                {isAuthenticated && currentUser && (
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <User color="#fff" size={32} />
                            </View>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{currentUser.name}</Text>
                            <Text style={styles.profileEmail}>{currentUser.email}</Text>
                            {currentUser.isAdmin && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Premium Banner */}
                {isAuthenticated && !isPremium && (
                    <TouchableOpacity
                        style={styles.premiumBanner}
                        onPress={handlePremiumPress}
                        activeOpacity={0.8}
                    >
                        <View style={styles.premiumContent}>
                            <Text style={styles.premiumTitle}>Go Premium</Text>
                            <Text style={styles.premiumDesc}>Unlock unlimited clips and remove limits</Text>
                        </View>
                        <ChevronRight color="#fff" size={24} />
                    </TouchableOpacity>
                )}

                {/* Liked Movies Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Heart color="#E50914" size={20} />
                        <Text style={styles.sectionTitle}>Liked Videos</Text>
                        <Text style={styles.sectionCount}>({likedMovies.length})</Text>
                    </View>
                    {likedMovies.length > 0 ? (
                        <FlatList
                            horizontal
                            data={likedMovies}
                            renderItem={renderMovie}
                            keyExtractor={(item) => `liked-${item.id}`}
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.emptyText}>No liked videos yet. Tap the heart icon while watching!</Text>
                    )}
                </View>

                {/* Watch Later Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Clock color="#fff" size={20} />
                        <Text style={styles.sectionTitle}>My List</Text>
                        <Text style={styles.sectionCount}>({watchLaterMovies.length})</Text>
                    </View>
                    {watchLaterMovies.length > 0 ? (
                        <FlatList
                            horizontal
                            data={watchLaterMovies}
                            renderItem={renderMovie}
                            keyExtractor={(item) => `watch-${item.id}`}
                            showsHorizontalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.emptyText}>Your list is empty. Tap the + icon to add movies!</Text>
                    )}
                </View>

                {/* Settings Links */}
                <View style={styles.settingsSection}>
                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsLeft}>
                            <Download color="#808080" size={20} />
                            <Text style={styles.settingsText}>Downloads</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingsItem}>
                        <View style={styles.settingsLeft}>
                            <Settings color="#808080" size={20} />
                            <Text style={styles.settingsText}>App Settings</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>

                    {/* Sign Out Button - Below App Settings */}
                    <TouchableOpacity
                        style={styles.signOutItem}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsLeft}>
                            <LogOut color="#E50914" size={20} />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Version Info */}
                <Text style={styles.versionText}>CineSwipe v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingHorizontal: 16,
    },
    adminButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: '#1a1a1a',
        marginBottom: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E50914', // Red border to denote admin action
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    modalCard: {
        backgroundColor: '#1a1a1a',
        padding: 24,
        borderRadius: 8,
        width: '80%',
        maxWidth: 320,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    modalText: {
        color: '#a0a0a0',
        fontSize: 14,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 4,
        backgroundColor: '#E50914',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    userName: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 6,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        color: '#808080',
        fontSize: 14,
    },
    adminBadge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    adminBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    sectionCount: {
        color: '#808080',
        fontSize: 14,
        marginLeft: 6,
    },
    movieCard: {
        marginRight: 12,
    },
    movieThumbnail: {
        width: 110,
        height: 160,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    emptyText: {
        color: '#808080',
        fontSize: 13,
        fontStyle: 'italic',
    },
    settingsSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    settingsLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingsText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E50914',
        paddingVertical: 14,
        borderRadius: 4,
        marginTop: 24,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    signOutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    signOutText: {
        color: '#E50914',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    versionText: {
        color: '#555',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    premiumBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'linear-gradient(90deg, #E50914, #B20710)', // Fallback to solid red if gradient unsupported
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ff4d4d',
        shadowColor: '#E50914',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    premiumContent: {
        flex: 1,
    },
    premiumTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    premiumDesc: {
        color: '#ffd0d0',
        fontSize: 14,
    },
});
