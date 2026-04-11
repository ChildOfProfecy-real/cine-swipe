import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { Link } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Plus } from "lucide-react-native";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";
import { getContinueWatching, MovieWithProgress } from "../../src/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
    const { movies, moviesLoading, moviesError, fetchMovies, isAuthenticated } = useAppStore();
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

    const renderMovie = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.movieCard}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.movieThumbnail}
                    resizeMode="cover"
                />
                <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
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
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Image
                        source={{ uri: featuredMovie.heroUrl }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
                        style={styles.heroGradient}
                    >
                        <Text style={styles.heroTitle}>{featuredMovie.title}</Text>
                        <Text style={styles.heroGenre}>{featuredMovie.genre}</Text>

                        <View style={styles.heroButtons}>
                            <Link href={`/player/${featuredMovie.id}`} asChild>
                                <TouchableOpacity style={styles.playButton}>
                                    <Play fill="black" size={20} color="black" />
                                    <Text style={styles.playButtonText}>Play</Text>
                                </TouchableOpacity>
                            </Link>

                            <TouchableOpacity style={styles.listButton}>
                                <Plus size={20} color="white" />
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
                                    <TouchableOpacity style={styles.continueCard}>
                                        <Image
                                            source={{ uri: item.thumbnailUrl }}
                                            style={styles.movieThumbnail}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.progressBar}>
                                            <View style={[styles.progressFill, { width: '50%' }]} />
                                        </View>
                                        <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
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
                    <Text style={styles.rowTitle}>Top 10 in Your Country</Text>
                    <FlatList
                        horizontal
                        data={top10Movies}
                        renderItem={renderTop10Movie}
                        keyExtractor={(item) => `top10-${item.id}`}
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
        height: 450,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 220,
        justifyContent: 'flex-end',
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroGenre: {
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
    },
    heroButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    playButton: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 4,
    },
    playButtonText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    listButton: {
        backgroundColor: '#555',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 4,
    },
    listButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
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
    },
    movieCard: {
        marginRight: 12,
        width: 110,
    },
    movieThumbnail: {
        width: 110,
        height: 160,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    movieTitle: {
        color: '#fff',
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
    },
    top10Card: {
        marginRight: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    top10Number: {
        color: '#141414',
        fontSize: 100,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textShadowColor: '#fff',
        textShadowOffset: { width: 2, height: 0 },
        textShadowRadius: 0,
        marginRight: -20,
        zIndex: 1,
    },
    top10Thumbnail: {
        width: 90,
        height: 140,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    continueCard: {
        marginRight: 12,
        width: 110,
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
});
