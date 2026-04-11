import { useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown } from "lucide-react-native";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";

export default function MoviesScreen() {
    const { movies, moviesLoading, moviesError, fetchMovies } = useAppStore();

    useEffect(() => {
        if (movies.length === 0) {
            fetchMovies();
        }
    }, []);

    // Derive sections from API movies
    const popularMovies = movies.filter((_, i) => [0, 2, 4, 6, 8, 10, 12, 14].includes(i));
    const actionMovies = movies.filter(m => m.genre === 'Action');
    const dramaMovies = movies.filter(m => m.genre === 'Drama');
    const sciFiMovies = movies.filter(m => m.genre === 'Sci-Fi');
    const thrillerMovies = movies.filter(m => m.genre === 'Thriller' || m.genre === 'Horror');
    const romanceMovies = movies.filter(m => m.genre === 'Romance' || m.genre === 'Animation');
    const criticallyAcclaimed = movies.filter((_, i) => [10, 11, 13, 22, 14, 7].includes(i));
    const featuredMovie = movies[9] || movies[0];

    const renderMovieRow = (title: string, rowMovies: Movie[]) => {
        if (rowMovies.length === 0) return null;
        return (
            <View style={styles.rowContainer}>
                <Text style={styles.rowTitle}>{title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {rowMovies.map((movie) => (
                        <Link key={movie.id} href={`/player/${movie.id}`} asChild>
                            <TouchableOpacity style={styles.movieCard}>
                                <Image
                                    source={{ uri: movie.thumbnailUrl }}
                                    style={styles.movieThumbnail}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        </Link>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Loading state
    if (moviesLoading && movies.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Loading movies...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (moviesError && movies.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Failed to load movies</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchMovies()}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!featuredMovie) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>No movies available</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Movies</Text>
                <View style={styles.filterButtons}>
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterText}>Categories</Text>
                        <ChevronDown color="#fff" size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton}>
                        <Text style={styles.filterText}>All Genres</Text>
                        <ChevronDown color="#fff" size={16} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Featured Banner */}
                <View style={styles.featuredContainer}>
                    <Image
                        source={{ uri: featuredMovie.heroUrl }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                    />
                    <View style={styles.featuredOverlay}>
                        <View style={styles.top10Badge}>
                            <Text style={styles.top10Text}>TOP 10</Text>
                        </View>
                        <Text style={styles.featuredTitle}>{featuredMovie.title}</Text>
                        <View style={styles.featuredButtons}>
                            <Link href={`/player/${featuredMovie.id}`} asChild>
                                <TouchableOpacity style={styles.playBtn}>
                                    <Text style={styles.playBtnText}>▶ Play</Text>
                                </TouchableOpacity>
                            </Link>
                            <TouchableOpacity style={styles.listBtn}>
                                <Text style={styles.listBtnText}>+ My List</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Movie Rows */}
                {renderMovieRow("Popular on CineSwipe", popularMovies)}
                {renderMovieRow("Action & Adventure", actionMovies)}
                {renderMovieRow("Drama", dramaMovies)}
                {renderMovieRow("Sci-Fi & Fantasy", sciFiMovies)}
                {renderMovieRow("Thrillers & Horror", thrillerMovies)}
                {renderMovieRow("Romance & Family", romanceMovies)}
                {renderMovieRow("Critically Acclaimed", criticallyAcclaimed)}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#808080',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    filterText: {
        color: '#fff',
        fontSize: 12,
    },
    featuredContainer: {
        height: 200,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        padding: 16,
    },
    top10Badge: {
        backgroundColor: '#E50914',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    top10Text: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    featuredTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    featuredButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    playBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 4,
    },
    playBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
    },
    listBtn: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 4,
    },
    listBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    rowContainer: {
        marginBottom: 24,
    },
    rowTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    movieCard: {
        marginLeft: 16,
    },
    movieThumbnail: {
        width: 110,
        height: 160,
        borderRadius: 6,
        backgroundColor: '#333',
    },
});
