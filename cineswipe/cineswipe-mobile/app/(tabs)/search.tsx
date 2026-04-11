import { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search as SearchIcon, X, TrendingUp } from "lucide-react-native";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";
import { Link } from "expo-router";

export default function SearchScreen() {
    const { movies, moviesLoading, fetchMovies } = useAppStore();
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Fetch movies if not loaded yet
    useEffect(() => {
        if (movies.length === 0) {
            fetchMovies();
        }
    }, []);

    const filteredMovies = query.length > 0
        ? movies.filter(m =>
            m.title.toLowerCase().includes(query.toLowerCase()) ||
            m.genre.toLowerCase().includes(query.toLowerCase()) ||
            m.description.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    const clearSearch = () => {
        setQuery("");
    };

    const renderSearchResult = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.resultItem}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.resultImage}
                    resizeMode="cover"
                />
                <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultGenre}>{item.genre}</Text>
                    <Text style={styles.resultDesc} numberOfLines={2}>{item.description}</Text>
                </View>
            </TouchableOpacity>
        </Link>
    );

    const renderTrendingItem = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.trendingItem}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.trendingImage}
                    resizeMode="cover"
                />
            </TouchableOpacity>
        </Link>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
                    <SearchIcon color="#808080" size={20} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search movies, genres..."
                        placeholderTextColor="#808080"
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X color="#808080" size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {query.length > 0 ? (
                // Search Results
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>
                        {filteredMovies.length > 0
                            ? `Results for "${query}"`
                            : `No results for "${query}"`}
                    </Text>
                    {filteredMovies.length > 0 ? (
                        <FlatList
                            data={filteredMovies}
                            renderItem={renderSearchResult}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <Text style={styles.noResults}>
                            Try searching for a different movie or genre.
                        </Text>
                    )}
                </View>
            ) : moviesLoading ? (
                // Loading State
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Loading movies...</Text>
                </View>
            ) : (
                // Default: Trending Searches
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <TrendingUp color="#E50914" size={20} />
                            <Text style={styles.sectionTitle}>Top Searches</Text>
                        </View>

                        {movies.map((movie) => (
                            <Link key={movie.id} href={`/player/${movie.id}`} asChild>
                                <TouchableOpacity style={styles.topSearchItem}>
                                    <Image
                                        source={{ uri: movie.thumbnailUrl }}
                                        style={styles.topSearchImage}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.topSearchTitle}>{movie.title}</Text>
                                    <View style={styles.playIcon}>
                                        <Text style={styles.playText}>▶</Text>
                                    </View>
                                </TouchableOpacity>
                            </Link>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Browse by Genre</Text>
                        <View style={styles.genreGrid}>
                            {["Action", "Sci-Fi", "Drama", "Comedy", "Thriller", "Romance"].map((genre) => (
                                <TouchableOpacity key={genre} style={styles.genreChip}>
                                    <Text style={styles.genreText}>{genre}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )}
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
    searchBarContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#333',
    },
    searchBarFocused: {
        borderColor: '#E50914',
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    resultsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    resultItem: {
        flexDirection: 'row',
        marginBottom: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        overflow: 'hidden',
    },
    resultImage: {
        width: 100,
        height: 140,
        backgroundColor: '#333',
    },
    resultInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    resultTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    resultGenre: {
        color: '#E50914',
        fontSize: 12,
        marginBottom: 8,
    },
    resultDesc: {
        color: '#a0a0a0',
        fontSize: 12,
        lineHeight: 18,
    },
    noResults: {
        color: '#808080',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 40,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    topSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    topSearchImage: {
        width: 120,
        height: 70,
        backgroundColor: '#333',
    },
    topSearchTitle: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        paddingHorizontal: 16,
    },
    playIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    playText: {
        color: '#fff',
        fontSize: 12,
    },
    trendingItem: {
        marginRight: 12,
    },
    trendingImage: {
        width: 110,
        height: 160,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    genreGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
    },
    genreChip: {
        backgroundColor: '#333',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    genreText: {
        color: '#fff',
        fontSize: 14,
    },
});
