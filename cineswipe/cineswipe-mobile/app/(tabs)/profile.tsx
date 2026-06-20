import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ScrollView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../src/lib/store";
import { Link, useRouter } from "expo-router";
import { Heart, Clock, ChevronRight, LogOut, User, Settings, Bell, Download, Sparkles } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getContinueWatching } from "../../src/lib/api";

export default function ProfileScreen() {
    const router = useRouter();
    const { movies, getLikedMovies, getWatchLaterMovies, currentUser, isAuthenticated, isPremium } = useAppStore();
    const likedMovies = getLikedMovies();
    const watchLaterMovies = getWatchLaterMovies();
    const [continueWatchingCount, setContinueWatchingCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                getContinueWatching()
                    .then(data => {
                        setContinueWatchingCount(data.length);
                    })
                    .catch(console.error);
            } else {
                setContinueWatchingCount(0);
            }
        }, [isAuthenticated])
    );

    const handlePremiumPress = () => {
        Alert.alert(
            'Subscribe to Premium',
            'Do you want to unlock unlimited clips and remove limits?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => router.push('/paywall') }
            ]
        );
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

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Centered Avatar Header */}
                <View style={styles.profileHeaderCentered}>
                    
                    <View style={[
                        styles.largeAvatar, 
                        isPremium && { borderColor: '#D4AF37', shadowColor: '#D4AF37', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.6, shadowRadius: 8, elevation: 8 }
                    ]}>
                        <User color="#000" size={40} />
                    </View>
                    
                    {isAuthenticated && currentUser ? (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.profileNameLarge, isPremium && { color: '#D4AF37' }]}>{currentUser.name}</Text>
                                {isPremium && (
                                    <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#D4AF37' }}>
                                        <Text style={{ color: '#D4AF37', fontSize: 10, fontWeight: 'bold' }}>👑 PREMIUM</Text>
                                    </View>
                                )}
                            </View>
                            {currentUser.isAdmin && (
                                <View style={styles.adminBadge}>
                                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <Text style={styles.profileNameLarge}>Guest</Text>
                    )}
                </View>

                {/* Stats Row */}
                {isAuthenticated && (
                    <View style={styles.statsRow}>
                        <View style={styles.statColumn}>
                            <Text style={styles.statValue}>{continueWatchingCount}</Text>
                            <Text style={styles.statLabel}>Watching</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statColumn}>
                            <Text style={styles.statValue}>{likedMovies.length}</Text>
                            <Text style={styles.statLabel}>Saved</Text>
                        </View>
                    </View>
                )}

                {/* Premium Banner */}
                {isAuthenticated && !isPremium && (
                    <TouchableOpacity
                        style={styles.premiumBannerGold}
                        onPress={handlePremiumPress}
                        activeOpacity={0.8}
                    >
                        <View style={styles.premiumContent}>
                            <Text style={styles.premiumTitleGold}>👑 CineSwipe Premium</Text>
                            <Text style={styles.premiumDescGold}>Unlock exclusive content. Upgrade Now.</Text>
                        </View>
                        <ChevronRight color="#C8AA64" size={24} />
                    </TouchableOpacity>
                )}

                {/* Saved Grid Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitleGrid}>Saved Movies</Text>
                        <Text style={styles.sectionCount}>({likedMovies.length})</Text>
                    </View>
                    {likedMovies.length > 0 ? (
                        <View style={styles.gridContainer}>
                            {likedMovies.map((movie) => (
                                <Link key={`saved-${movie.id}`} href={`/player/${movie.id}`} asChild>
                                    <TouchableOpacity style={styles.gridMovieCard}>
                                        <Image
                                            source={{ uri: movie.thumbnailUrl }}
                                            style={styles.gridMovieThumbnail}
                                            resizeMode="cover"
                                        />
                                        <Text style={styles.gridMovieTitle} numberOfLines={1}>{movie.title}</Text>
                                        <Text style={styles.gridMovieGenre}>{movie.genre}</Text>
                                    </TouchableOpacity>
                                </Link>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>You haven't saved any movies yet. Tap the heart icon to save them!</Text>
                    )}
                </View>

                {/* Settings Links */}
                <View style={styles.settingsSection}>
                    <TouchableOpacity 
                        style={styles.settingsItem}
                        onPress={() => router.push('/settings')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsLeft}>
                            <Settings color="#808080" size={20} />
                            <Text style={styles.settingsText}>App Settings</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.settingsItem}
                        onPress={() => router.push('/settings/app-icon')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.settingsLeft}>
                            <Sparkles color="#808080" size={20} />
                            <Text style={styles.settingsText}>App Icon</Text>
                        </View>
                        <ChevronRight color="#808080" size={20} />
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
    profileHeaderCentered: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
        position: 'relative',
    },
    settingsIconTopRight: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 8,
    },
    largeAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#333',
    },
    profileNameLarge: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 32,
    },
    statColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: '#808080',
        fontSize: 12,
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
    sectionTitleGrid: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionCount: {
        color: '#808080',
        fontSize: 14,
        marginLeft: 6,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gridMovieCard: {
        width: '48%',
        marginBottom: 20,
    },
    gridMovieThumbnail: {
        width: '100%',
        aspectRatio: 2/3,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 8,
    },
    gridMovieTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    gridMovieGenre: {
        color: '#808080',
        fontSize: 12,
        marginTop: 2,
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
    premiumBannerGold: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(40,30,10,0.8)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(200,170,100,0.5)',
    },
    premiumTitleGold: {
        color: '#C8AA64',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    premiumDescGold: {
        color: '#a08b50',
        fontSize: 13,
    },
});
