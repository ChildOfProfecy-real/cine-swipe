import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Play, Plus, Check } from "lucide-react-native";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";
import { getContinueWatching, MovieWithProgress } from "../../src/lib/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
    const { movies, moviesLoading, moviesError, fetchMovies, isAuthenticated, toggleWatchLater, isInWatchLater } = useAppStore();
    const router = useRouter();
    const [continueWatching, setContinueWatching] = useState<MovieWithProgress[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchMovies();
            if (isAuthenticated) {
                const data = await getContinueWatching();
                setContinueWatching(data);
            }
        } catch (err) {
            console.error('Refresh error:', err);
        } finally {
            setRefreshing(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchMovies();
    }, []);

    // Fetch continue watching data when screen is focused (to refresh after player)
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                console.log('Home screen focused - refreshing Continue Watching');
                getContinueWatching()
                    .then(data => {
                        console.log('Continue Watching data:', data.length, 'movies');
                        setContinueWatching(data);
                    })
                    .catch(console.error);
            }
        }, [isAuthenticated])
    );

    // Derive sections from API movies
    const trendingMovies = movies.filter((_, i) => [0, 3, 6, 9, 12, 15, 18, 21].includes(i));
    const top10Movies = movies.slice(0, 10);
    const actionMovies = movies.filter(m => m.genre === 'Action');
    const sciFiMovies = movies.filter(m => m.genre === 'Sci-Fi');
    const featuredMovie = movies[0];
    const inWatchLater = featuredMovie ? isInWatchLater(featuredMovie.id) : false;

    const handleWatchLater = () => {
        if (!featuredMovie) return;
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please log in to add movies to your list.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/login') },
            ]);
            return;
        }
        toggleWatchLater(featuredMovie.id);
    };

    const renderMovie = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.recommendedCard}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.recommendedImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.recommendedOverlay}
                >
                    <Text style={styles.recommendedTitle}>{item.title}</Text>
                    <Text style={styles.recommendedGenre}>{item.genre}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Link>
    );

    const renderTop10Movie = ({ item, index }: { item: Movie; index: number }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.top10Card}>
                <Text style={styles.top10Number}>{index + 1}</Text>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.top10Thumbnail}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        </Link>
    );

    const renderRecommendedMovie = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.recommendedCard}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.recommendedImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.recommendedOverlay}
                >
                    <Text style={styles.recommendedTitle}>{item.title}</Text>
                    <Text style={styles.recommendedGenre}>{item.genre}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Link>
    );

    // Loading state — skeleton placeholders
    if (moviesLoading && movies.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView>
                    {/* Hero skeleton */}
                    <View style={[styles.heroSection, { backgroundColor: '#1a1a1a' }]}>
                        <View style={{
                            position: 'absolute', bottom: 20, left: 16, right: 16,
                        }}>
                            <View style={{
                                width: 200, height: 28, backgroundColor: '#333',
                                borderRadius: 4, alignSelf: 'center', marginBottom: 8,
                            }} />
                            <View style={{
                                width: 100, height: 14, backgroundColor: '#2a2a2a',
                                borderRadius: 4, alignSelf: 'center', marginBottom: 20,
                            }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                                <View style={{
                                    width: 100, height: 36, backgroundColor: '#444',
                                    borderRadius: 4,
                                }} />
                                <View style={{
                                    width: 100, height: 36, backgroundColor: '#333',
                                    borderRadius: 4,
                                }} />
                            </View>
                        </View>
                    </View>

                    {/* Row skeleton — Trending */}
                    <View style={styles.rowContainer}>
                        <View style={{
                            width: 140, height: 18, backgroundColor: '#333',
                            borderRadius: 4, marginBottom: 12,
                        }} />
                        <View style={{ flexDirection: 'row' }}>
                            {[1, 2, 3, 4].map(i => (
                                <View key={i} style={{
                                    width: 110, height: 160, backgroundColor: '#1a1a1a',
                                    borderRadius: 6, marginRight: 12,
                                }} />
                            ))}
                        </View>
                    </View>

                    {/* Row skeleton — Top 10 */}
                    <View style={styles.rowContainer}>
                        <View style={{
                            width: 180, height: 18, backgroundColor: '#333',
                            borderRadius: 4, marginBottom: 12,
                        }} />
                        <View style={{ flexDirection: 'row' }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={{
                                    width: 90, height: 140, backgroundColor: '#1a1a1a',
                                    borderRadius: 6, marginRight: 12, marginLeft: 30,
                                }} />
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // Error state
    if (moviesError && movies.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>Failed to load movies</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => fetchMovies()}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // No movies yet
    if (!featuredMovie) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No movies available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#E50914"
                        colors={['#E50914']}
                    />
                }
            >
                {/* Header Overlay */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headerLogo}>CineSwipe</Text>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: featuredMovie.heroUrl }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroButtonsColumn}>
                            <Link href={`/player/${featuredMovie.id}`} asChild>
                                <TouchableOpacity activeOpacity={0.8} style={styles.playButtonCircular}>
                                    <View style={styles.playIconContainer}>
                                        <Play fill="white" size={28} color="white" style={{marginLeft: 4}} />
                                    </View>
                                </TouchableOpacity>
                            </Link>

                            <TouchableOpacity activeOpacity={0.8} onPress={handleWatchLater} style={styles.listButtonTextOnly}>
                                {inWatchLater ? <Check size={16} color="white" /> : <Plus size={16} color="white" />}
                                <Text style={styles.listButtonText}>My List</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Trending Now Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.rowTitle}>Trending Now</Text>
                    <FlatList
                        horizontal
                        data={trendingMovies}
                        renderItem={renderMovie}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Continue Watching Row - Right after Trending */}
                {continueWatching.length > 0 && (
                    <View style={styles.rowContainer}>
                        <Text style={styles.rowTitle}>Continue Watching</Text>
                        <FlatList
                            horizontal
                            data={continueWatching}
                            renderItem={({ item }) => (
                                <Link href={`/player/${item.id}?clipIndex=${Math.floor(item.watchProgress.timestamp)}`} asChild>
                                    <TouchableOpacity style={styles.recommendedCard}>
                                        <Image
                                            source={{ uri: item.thumbnailUrl }}
                                            style={styles.recommendedImage}
                                            resizeMode="cover"
                                        />
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.9)']}
                                            style={styles.recommendedOverlay}
                                        >
                                            <Text style={styles.recommendedTitle}>{item.title}</Text>
                                            <Text style={styles.recommendedGenre}>{item.genre}</Text>
                                        </LinearGradient>
                                        <View style={[styles.progressBar, { position: 'absolute', bottom: 0, left: 0, right: 0, marginTop: 0, borderRadius: 0, height: 4 }]}>
                                            <View style={[styles.progressFill, { width: '50%', borderRadius: 0 }]} />
                                        </View>
                                    </TouchableOpacity>
                                </Link>
                            )}
                            keyExtractor={(item) => `continue-${item.id}`}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* Top 10 Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.rowTitle}>Top 10 Clips in Your Country</Text>
                    <FlatList
                        horizontal
                        data={top10Movies}
                        renderItem={renderTop10Movie}
                        keyExtractor={(item) => `top10-${item.id}`}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Recommended for You Row */}
                <View style={styles.rowContainer}>
                    <Text style={styles.rowTitle}>Recommended for You</Text>
                    <FlatList
                        horizontal
                        data={movies.slice(5, 15)}
                        renderItem={renderRecommendedMovie}
                        keyExtractor={(item) => `recommended-${item.id}`}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Action Movies Row */}
                {actionMovies.length > 0 && (
                    <View style={styles.rowContainer}>
                        <Text style={styles.rowTitle}>Action Blockbusters</Text>
                        <FlatList
                            horizontal
                            data={actionMovies}
                            renderItem={renderMovie}
                            keyExtractor={(item) => `action-${item.id}`}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

                {/* Sci-Fi Row */}
                {sciFiMovies.length > 0 && (
                    <View style={styles.rowContainer}>
                        <Text style={styles.rowTitle}>Sci-Fi Adventures</Text>
                        <FlatList
                            horizontal
                            data={sciFiMovies}
                            renderItem={renderMovie}
                            keyExtractor={(item) => `scifi-${item.id}`}
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#888',
        marginTop: 16,
        fontSize: 16,
    },
    errorText: {
        color: '#E50914',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    heroSection: {
        height: SCREEN_HEIGHT * 0.65,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
        paddingTop: 50, // Safe area approx
    },
    headerLogo: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 280,
        justifyContent: 'flex-end',
        paddingBottom: 30,
        paddingHorizontal: 16,
    },
    heroButtonsColumn: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
    },
    playButtonCircular: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listButtonTextOnly: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    listButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 12,
    },
    rowContainer: {
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 8,
    },
    rowTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    movieCard: {
        marginRight: 16,
        width: 120,
    },
    movieThumbnail: {
        width: 120,
        height: 175,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
    },
    movieTitle: {
        color: '#fff',
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
    },
    top10Card: {
        marginRight: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    top10Number: {
        color: '#ffffff',
        fontSize: 120,
        fontWeight: '900',
        fontStyle: 'italic',
        marginRight: -25,
        zIndex: 1,
        letterSpacing: -5,
        textShadowColor: 'rgba(200, 170, 100, 0.8)',
        textShadowOffset: { width: -4, height: 4 },
        textShadowRadius: 1,
    },
    top10Thumbnail: {
        width: 90,
        height: 140,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    continueCard: {
        marginRight: 16,
        width: 120,
    },
    progressBar: {
        height: 3,
        backgroundColor: '#555',
        marginTop: 4,
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#E50914',
        borderRadius: 2,
    },
    recommendedCard: {
        marginRight: 16,
        width: 150,
        height: 220,
        borderRadius: 8,
        overflow: 'hidden',
    },
    recommendedImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
    },
    recommendedOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingTop: 30,
    },
    recommendedTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    recommendedGenre: {
        color: '#aaa',
        fontSize: 11,
    },
});
