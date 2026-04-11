import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Share2, Play, Info, Plus, Check } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";

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
    const top10Movies = movies.slice(0, 10);

    const tabs = [
        { id: 0, label: "Coming Soon", emoji: "🎬" },
        { id: 1, label: "Everyone's Watching", emoji: "🔥" },
        { id: 2, label: "Top 10 Movies", emoji: "🏆" },
    ];

    // Get movies based on active tab
    const getMoviesForTab = () => {
        switch (activeTab) {
            case 0: return comingSoonMovies;
            case 1: return everyonesWatchingMovies;
            case 2: return top10Movies;
            default: return comingSoonMovies;
        }
    };

    const handleRemindMe = (movieId: string, title: string) => {
        if (reminders.includes(movieId)) {
            setReminders(reminders.filter(id => id !== movieId));
            if (Platform.OS === 'web') {
                window.alert(`Reminder removed for "${title}"`);
            }
        } else {
            setReminders([...reminders, movieId]);
            if (Platform.OS === 'web') {
                window.alert(`We'll remind you when "${title}" is available!`);
            }
        }
    };

    const handleShare = (title: string) => {
        if (Platform.OS === 'web') {
            window.alert(`Share "${title}" with your friends!\n\nLink copied to clipboard.`);
        }
    };

    const handleAddToList = (movieId: string, title: string) => {
        toggleWatchLater(movieId);
        const wasInList = isInWatchLater(movieId);
        if (Platform.OS === 'web') {
            window.alert(wasInList ? `"${title}" added to My List!` : `"${title}" removed from My List`);
        }
    };

    const currentMovies = getMoviesForTab();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>New & Hot</Text>
                <Text style={styles.headerSubtitle}>Discover what's trending</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                        onPress={() => setActiveTab(tab.id)}
                    >
                        <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                        <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {moviesLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Loading movies...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {currentMovies.map((movie, index) => {
                        const isReminded = reminders.includes(movie.id);
                        const inList = isInWatchLater(movie.id);

                        return (
                            <View key={movie.id} style={styles.card}>
                                {/* Movie Image with Play Button */}
                                <Link href={`/player/${movie.id}`} asChild>
                                    <TouchableOpacity style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: movie.heroUrl || movie.thumbnailUrl }}
                                            style={styles.cardImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.playButton}>
                                            <Play fill="#fff" color="#fff" size={24} />
                                        </View>
                                        {activeTab === 2 && (
                                            <View style={styles.rankBadge}>
                                                <Text style={styles.rankText}>{index + 1}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </Link>

                                {/* Movie Info */}
                                <View style={styles.cardInfo}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.cardTitle}>{movie.title}</Text>
                                        <View style={styles.genreBadge}>
                                            <Text style={styles.genreText}>{movie.genre}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.cardDesc} numberOfLines={2}>
                                        {movie.description}
                                    </Text>

                                    {/* Action Buttons */}
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, isReminded && styles.actionButtonActive]}
                                            onPress={() => handleRemindMe(movie.id, movie.title)}
                                        >
                                            <Bell
                                                color={isReminded ? "#000" : "#fff"}
                                                fill={isReminded ? "#000" : "transparent"}
                                                size={18}
                                            />
                                            <Text style={[styles.actionButtonText, isReminded && styles.actionButtonTextActive]}>
                                                {isReminded ? "Reminder Set" : "Remind Me"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, inList && styles.actionButtonActive]}
                                            onPress={() => handleAddToList(movie.id, movie.title)}
                                        >
                                            {inList ? (
                                                <Check color="#000" size={18} />
                                            ) : (
                                                <Plus color="#fff" size={18} />
                                            )}
                                            <Text style={[styles.actionButtonText, inList && styles.actionButtonTextActive]}>
                                                {inList ? "In My List" : "My List"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleShare(movie.title)}
                                        >
                                            <Share2 color="#fff" size={18} />
                                            <Text style={styles.actionButtonText}>Share</Text>
                                        </TouchableOpacity>

                                        <Link href={`/player/${movie.id}`} asChild>
                                            <TouchableOpacity style={styles.actionButton}>
                                                <Info color="#fff" size={18} />
                                                <Text style={styles.actionButtonText}>Info</Text>
                                            </TouchableOpacity>
                                        </Link>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
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
    headerSubtitle: {
        color: '#808080',
        fontSize: 14,
        marginTop: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    tabActive: {
        backgroundColor: '#E50914',
        borderColor: '#E50914',
    },
    tabEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    tabText: {
        color: '#a0a0a0',
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#141414',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#333',
    },
    playButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -28 }, { translateY: -28 }],
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(229, 9, 20, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadge: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: '#E50914',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardInfo: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    genreBadge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    genreText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    cardDesc: {
        color: '#a0a0a0',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    actionButtonActive: {
        backgroundColor: '#fff',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    actionButtonTextActive: {
        color: '#000',
    },
});
