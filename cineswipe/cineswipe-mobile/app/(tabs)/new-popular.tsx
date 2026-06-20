import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ImageBackground, Alert } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Share2, Play, Info, Plus, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useState, useEffect } from "react";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";

// Deterministic countdown helper based on movie ID
const getReleaseCountdown = (movieId: string) => {
    let hash = 0;
    for (let i = 0; i < movieId.length; i++) {
        hash = movieId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const days = Math.abs(hash % 7) + 1; // 1 to 7 days
    const hours = Math.abs(hash % 24);
    return `Releasing in ${days}d ${hours}h`;
};

export default function NewPopularScreen() {
    const { movies, moviesLoading, fetchMovies, toggleWatchLater, isInWatchLater } = useAppStore();
    const [activeTab, setActiveTab] = useState(0);
    const [reminders, setReminders] = useState<string[]>([]);

    // Fetch movies if not loaded yet
    useEffect(() => {
        if (movies.length === 0) {
            fetchMovies();
        }
    }, []);

    // Derive different movie sets from API data
    const comingSoonMovies = movies.filter((_, i) => i % 5 === 0).slice(0, 5);
    const everyonesWatchingMovies = movies.filter((_, i) => i % 4 === 0).slice(0, 6);

    const handleRemindMe = (movieId: string, title: string) => {
        if (reminders.includes(movieId)) {
            setReminders(reminders.filter(id => id !== movieId));
            Alert.alert("Reminder Removed", `Reminder removed for "${title}"`);
        } else {
            setReminders([...reminders, movieId]);
            Alert.alert("Reminder Added", `We'll remind you when "${title}" is available!`);
        }
    };

    const handleShare = (title: string) => {
        Alert.alert("Share", `Share "${title}" with your friends!\n\nLink copied to clipboard.`);
    };

    const handleAddToList = (movieId: string, title: string) => {
        toggleWatchLater(movieId);
        const wasInList = isInWatchLater(movieId);
        Alert.alert("My List", wasInList ? `"${title}" added to My List!` : `"${title}" removed from My List`);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>New & Hot</Text>
            </View>

            {moviesLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Loading movies...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Coming Soon Section */}
                    {comingSoonMovies.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeaderTitle}>Coming Soon</Text>
                            {comingSoonMovies.map((movie) => {
                                const isReminded = reminders.includes(movie.id);
                                return (
                                    <View key={`soon-${movie.id}`} style={styles.immersiveCard}>
                                        <ImageBackground
                                            source={{ uri: movie.heroUrl || movie.thumbnailUrl }}
                                            style={styles.immersiveImage}
                                            resizeMode="cover"
                                        >
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                                style={styles.immersiveOverlay}
                                            >
                                                <View style={styles.immersiveInfo}>
                                                    <Text style={styles.immersiveTitle}>{movie.title}</Text>
                                                    <Text style={styles.countdownText}>{getReleaseCountdown(movie.id)}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.immersiveAction}
                                                    onPress={() => handleRemindMe(movie.id, movie.title)}
                                                >
                                                    <Bell color={isReminded ? "#E50914" : "#fff"} size={24} />
                                                </TouchableOpacity>
                                            </LinearGradient>
                                        </ImageBackground>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Everyone's Watching Section */}
                    {everyonesWatchingMovies.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeaderTitle}>Everyone's Watching</Text>
                            {everyonesWatchingMovies.map((movie) => {
                                const inList = isInWatchLater(movie.id);
                                return (
                                    <View key={`watching-${movie.id}`} style={styles.immersiveCard}>
                                        <ImageBackground
                                            source={{ uri: movie.heroUrl || movie.thumbnailUrl }}
                                            style={styles.immersiveImage}
                                            resizeMode="cover"
                                        >
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                                style={styles.immersiveOverlay}
                                            >
                                                <View style={styles.immersiveInfo}>
                                                    <Text style={styles.immersiveTitle}>{movie.title}</Text>
                                                    <Text style={styles.immersiveGenre}>{movie.genre}</Text>
                                                </View>
                                                
                                                <View style={styles.immersiveActionsRight}>
                                                    <TouchableOpacity
                                                        style={styles.immersiveSmallAction}
                                                        onPress={() => handleAddToList(movie.id, movie.title)}
                                                    >
                                                        {inList ? <Check color="#fff" size={20} /> : <Plus color="#fff" size={20} />}
                                                    </TouchableOpacity>
                                                    
                                                    <Link href={`/player/${movie.id}`} asChild>
                                                        <TouchableOpacity style={styles.immersivePlayBtn}>
                                                            <Play fill="#fff" color="#fff" size={20} style={{marginLeft: 2}} />
                                                        </TouchableOpacity>
                                                    </Link>
                                                </View>
                                            </LinearGradient>
                                        </ImageBackground>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 16,
        fontSize: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeaderTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    immersiveCard: {
        width: '100%',
        height: 250,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#1a1a1a',
    },
    immersiveImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    immersiveOverlay: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 40, // Space for gradient to fade in
    },
    immersiveInfo: {
        flex: 1,
        paddingRight: 16,
    },
    immersiveTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    countdownText: {
        color: '#E50914',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    immersiveGenre: {
        color: '#ccc',
        fontSize: 14,
    },
    immersiveAction: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    immersiveActionsRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    immersiveSmallAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    immersivePlayBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E50914',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
