import { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Dimensions, ImageBackground, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search as SearchIcon, X, TrendingUp, ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "../../src/lib/store";
import { Movie } from "../../src/types";
import { Link } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function SearchScreen() {
    const { movies, moviesLoading, fetchMovies, recentSearches, addRecentSearch } = useAppStore();
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    const genres = ["Action", "Sci-Fi", "Drama", "Comedy", "Thriller", "Romance", "Animation", "Horror"];

    // Fetch movies if not loaded yet
    useEffect(() => {
        if (movies.length === 0) {
            fetchMovies();
        }
    }, []);

    const filteredMovies = movies.filter(m => {
        const matchesQuery = query.length === 0 || 
            m.title.toLowerCase().includes(query.toLowerCase()) ||
            m.genre.toLowerCase().includes(query.toLowerCase()) ||
            m.description.toLowerCase().includes(query.toLowerCase());
            
        const matchesGenre = !selectedGenre || m.genre === selectedGenre;
        
        return matchesQuery && matchesGenre;
    });

    const isSearching = query.length > 0 || selectedGenre !== null;

    const clearSearch = () => {
        setQuery("");
        setSelectedGenre(null);
    };

    const renderSearchResult = ({ item }: { item: Movie }) => (
        <Link href={`/player/${item.id}`} asChild>
            <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
                <Image
                    source={{ uri: item.thumbnailUrl }}
                    style={styles.gridThumbnail}
                    resizeMode="cover"
                />
                <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
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
                        placeholder="Search short clips..."
                        placeholderTextColor="#808080"
                        value={query}
                        onChangeText={setQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={() => {
                            if (query.trim().length > 0) {
                                addRecentSearch(query);
                            }
                        }}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X color="#808080" size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Dynamic Genre Filters Removed in favor of Trending Genres Below */}

            {isSearching ? (
                // Search Results
                <View style={styles.resultsContainer}>
                    <View style={styles.resultsHeader}>
                        <TouchableOpacity onPress={clearSearch} style={styles.backButton}>
                            <ArrowLeft color="#fff" size={24} />
                        </TouchableOpacity>
                        <Text style={styles.resultsTitle}>
                            {filteredMovies.length > 0
                                ? `Results for ${selectedGenre ? selectedGenre : ''} ${query ? `"${query}"` : ''}`.trim()
                                : `No results found`}
                        </Text>
                    </View>
                    {filteredMovies.length > 0 ? (
                        <FlatList
                            data={filteredMovies}
                            renderItem={renderSearchResult}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={styles.columnWrapper}
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
                    {/* Recently Searched */}
                    {recentSearches.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitleSmall}>Recently Searched</Text>
                            <View style={styles.recentSearchesContainer}>
                                {recentSearches.map(term => (
                                    <TouchableOpacity key={term} style={styles.recentChip} onPress={() => setQuery(term)}>
                                        <Text style={styles.recentChipText}>{term}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Trending Genres */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <TrendingUp color="#C8AA64" size={20} />
                            <Text style={styles.sectionTitle}>Trending Genres</Text>
                        </View>
                        
                        <View style={styles.trendingGenresContainer}>
                            {genres.map((genre, idx) => (
                                <TouchableOpacity 
                                    key={genre}
                                    style={styles.largeGenreCard}
                                    onPress={() => setSelectedGenre(genre)}
                                    activeOpacity={0.9}
                                >
                                    <ImageBackground
                                        source={{ uri: movies.find(m => m.genre === genre)?.heroUrl || movies.find(m => m.genre === genre)?.thumbnailUrl || movies[idx % movies.length]?.thumbnailUrl }}
                                        style={styles.largeGenreImage}
                                        imageStyle={{ borderRadius: 12 }}
                                    >
                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                            style={styles.largeGenreOverlay}
                                        >
                                            <Text style={styles.largeGenreTitle}>{genre}</Text>
                                        </LinearGradient>
                                    </ImageBackground>
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
        borderColor: 'rgba(200,170,100,0.5)',
    },
    searchBarFocused: {
        borderColor: '#C8AA64',
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
        paddingTop: 8,
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    resultsTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridCard: {
        width: CARD_WIDTH,
    },
    gridThumbnail: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.5, // Maintain aspect ratio for movie posters
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
    },
    gridTitle: {
        color: '#fff',
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
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
    trendingGenresContainer: {
        gap: 16,
    },
    largeGenreCard: {
        width: '100%',
        height: 140,
        borderRadius: 12,
    },
    largeGenreImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    largeGenreOverlay: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.3)', // Added dark tint to read text better
    },
    largeGenreTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    sectionTitleSmall: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    recentSearchesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    recentChip: {
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    recentChipText: {
        color: '#a0a0a0',
        fontSize: 14,
    },
});
