import { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Platform, Share, useWindowDimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { ResizeMode, Video, AVPlaybackStatus } from "expo-av";
import { ArrowLeft, Heart, Plus, Check, Share2 } from "lucide-react-native";
import { useAppStore } from "../../src/lib/store";
import { getMovie, saveWatchProgress, FREE_CLIP_LIMIT } from "../../src/lib/api";
import { Movie, Clip } from "../../src/types";
import { ActivityIndicator } from "react-native";

// Get initial screen dimensions (will be updated dynamically in component)
const initialDimensions = Dimensions.get('screen');

// Separate ClipPlayer component with its own video ref
const ClipPlayer = ({
    clip,
    index,
    isActive,
    onFinished,
    movie,
    liked,
    inWatchLater,
    onLike,
    onWatchLater,
    onBack,
    onShare,
    totalClips,
    screenWidth,
    screenHeight,
    isPremium
}: {
    clip: Clip;
    index: number;
    isActive: boolean;
    onFinished: () => void;
    movie: Movie;
    liked: boolean;
    inWatchLater: boolean;
    onLike: (e?: any) => void;
    onWatchLater: (e?: any) => void;
    onBack: (e?: any) => void;
    onShare: (e?: any) => void;
    totalClips: number;
    screenWidth: number;
    screenHeight: number;
    isPremium: boolean;
}) => {
    const videoRef = useRef<Video>(null);

    // Control playback based on isActive prop
    useEffect(() => {
        const controlVideo = async () => {
            if (!videoRef.current) return;

            try {
                if (isActive) {
                    await videoRef.current.setPositionAsync(0);
                    await videoRef.current.playAsync();
                } else {
                    await videoRef.current.pauseAsync();
                }
            } catch (e) {
                console.log('Video control error:', e);
            }
        };

        controlVideo();
    }, [isActive]);

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish && isActive) {
            onFinished();
        }
    };

    // Dynamic styles based on screen dimensions
    const dynamicStyles = {
        clipContainer: {
            width: screenWidth,
            height: screenHeight,
            backgroundColor: '#000',
        },
        videoContainer: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: screenWidth,
            height: screenHeight,
        },
        video: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: screenWidth,
            height: screenHeight,
        },
    };

    return (
        <View style={dynamicStyles.clipContainer}>
            {/* Video layer - doesn't capture touches */}
            <View style={dynamicStyles.videoContainer} pointerEvents="none">
                <Video
                    ref={videoRef}
                    source={{ uri: clip.videoUrl }}
                    rate={1.0}
                    volume={1.0}
                    isMuted={false}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={isActive}
                    isLooping={false}
                    style={dynamicStyles.video}
                    useNativeControls={false}
                    onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                />
            </View>

            {/* Top Navigation */}
            <View style={styles.topNav} pointerEvents="box-none">
                <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onShare} style={styles.shareButton} activeOpacity={0.7}>
                    <Share2 color="white" size={22} />
                </TouchableOpacity>
            </View>

            {/* Right Side Buttons */}
            <View style={styles.rightButtons} pointerEvents="box-none">
                <TouchableOpacity style={styles.actionButton} onPress={onLike} activeOpacity={0.7}>
                    <Heart
                        color={liked ? "#E50914" : "white"}
                        fill={liked ? "#E50914" : "transparent"}
                        size={30}
                    />
                    <Text style={[styles.actionText, liked && styles.activeText]}>
                        {liked ? "Liked" : "Like"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={onWatchLater} activeOpacity={0.7}>
                    {inWatchLater ? (
                        <Check color="#00ff00" size={30} />
                    ) : (
                        <Plus color="white" size={30} />
                    )}
                    <Text style={[styles.actionText, inWatchLater && styles.activeTextGreen]}>
                        {inWatchLater ? "Added" : "My List"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Info */}
            <View style={styles.bottomInfo} pointerEvents="none">
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.clipInfo}>
                    Clip {index + 1} of {totalClips} • {movie.genre}
                    {!isPremium && index + 1 >= FREE_CLIP_LIMIT ? ' • 🔒 Premium' : ''}
                </Text>
            </View>
        </View>
    );
};

export default function PlayerScreen() {
    const { id, clipIndex: clipIndexParam } = useLocalSearchParams();
    const router = useRouter();
    const movieId = Array.isArray(id) ? id[0] : id;
    const initialClipIndex = clipIndexParam ? parseInt(Array.isArray(clipIndexParam) ? clipIndexParam[0] : clipIndexParam, 10) : 0;

    // Navigation for canGoBack check
    const navigation = useNavigation();

    // Use hook for dynamic dimensions that update on rotation/resize
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const flatListRef = useRef<FlatList>(null);
    const [activeClipIndex, setActiveClipIndex] = useState(initialClipIndex);
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);

    const { toggleLike, toggleWatchLater, isLiked, isInWatchLater, movies, isAuthenticated, isPremium } = useAppStore();
    const liked = isLiked(movieId);
    const inWatchLater = isInWatchLater(movieId);

    useEffect(() => {
        // First try to find movie in store (already loaded)
        const storeMovie = movies.find(m => m.id === movieId);
        if (storeMovie) {
            setMovie(storeMovie);
            setLoading(false);
            return;
        }

        // If not found in store, fetch from API
        const fetchMovie = async () => {
            try {
                const movieData = await getMovie(movieId);
                setMovie(movieData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load movie');
            } finally {
                setLoading(false);
            }
        };

        fetchMovie();
    }, [movieId, movies]);

    // Scroll to the initial clip index for resume functionality
    useEffect(() => {
        if (movie && movie.clips && movie.clips.length > 0 && !hasScrolledToInitial && initialClipIndex > 0) {
            const validIndex = Math.min(initialClipIndex, movie.clips.length - 1);
            console.log('Resuming playback from clip index:', validIndex);

            // Small delay to ensure FlatList is rendered
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: validIndex, animated: false });
                setActiveClipIndex(validIndex);
                setHasScrolledToInitial(true);
            }, 100);
        }
    }, [movie, initialClipIndex, hasScrolledToInitial]);

    const handleLike = useCallback((e: any) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please log in to like movies.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/login') },
            ]);
            return;
        }
        toggleLike(movieId);
    }, [movieId, toggleLike, isAuthenticated, router]);

    const handleWatchLater = useCallback((e: any) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please log in to add movies to your list.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/login') },
            ]);
            return;
        }
        toggleWatchLater(movieId);
    }, [movieId, toggleWatchLater, isAuthenticated, router]);

    // Save watch progress when leaving or changing clips
    const saveCurrentProgress = useCallback(async () => {
        if (!isAuthenticated || !movie || !movie.clips || movie.clips.length === 0) return;

        const currentClip = movie.clips[activeClipIndex];
        if (!currentClip) return;

        try {
            console.log('Saving watch progress:', movieId, 'clip:', currentClip.id, 'index:', activeClipIndex);
            await saveWatchProgress(movieId, activeClipIndex, currentClip.id);
        } catch (error) {
            console.error('Failed to save watch progress:', error);
        }
    }, [isAuthenticated, movie, movieId, activeClipIndex]);

    const handleBack = useCallback(async (e: any) => {
        e?.stopPropagation?.();
        // Save progress before going back
        await saveCurrentProgress();
        // Check if we have navigation history, otherwise go to home
        if (navigation.canGoBack()) {
            router.back();
        } else {
            // No history (e.g., after page refresh), go to home
            router.replace('/(tabs)/home');
        }
    }, [router, navigation, saveCurrentProgress]);

    const handleShare = useCallback(async (e?: any) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();

        if (!movie) return;

        try {
            await Share.share({
                title: movie.title,
                message: `Check out "${movie.title}" on CineSwipe! 🎬\n\n${movie.description || movie.genre}`,
                // For iOS
                url: `cineswipe://movie/${movie.id}`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    }, [movie]);

    if (loading) {
        return (
            <View style={styles.errorContainer}>
                <ActivityIndicator size="large" color="#E50914" />
            </View>
        );
    }

    if (error || !movie) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
                <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const clips = movie.clips && movie.clips.length > 0 ? movie.clips : [
        { id: 'placeholder', movieId: movie.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', sequence: 1, duration: 120 }
    ];

    const goToNextClip = (currentIndex: number) => {
        const nextIndex = currentIndex + 1;

        // Paywall check: free users limited to FREE_CLIP_LIMIT clips
        if (!isPremium && nextIndex >= FREE_CLIP_LIMIT) {
            // Save progress before showing paywall
            saveCurrentProgress();
            router.push({
                pathname: '/paywall',
                params: {
                    movieId,
                    movieTitle: movie?.title || '',
                    clipIndex: String(nextIndex),
                    thumbnailUrl: movie?.thumbnailUrl || '',
                },
            });
            return;
        }

        if (nextIndex < clips.length) {
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setActiveClipIndex(nextIndex);
        }
    };

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / screenHeight);

        // Block scroll past free limit for non-premium users
        if (!isPremium && index >= FREE_CLIP_LIMIT) {
            flatListRef.current?.scrollToIndex({ index: FREE_CLIP_LIMIT - 1, animated: true });

            // Show paywall when user attempts to swipe past the limit limit
            saveCurrentProgress();
            router.push({
                pathname: '/paywall',
                params: {
                    movieId,
                    movieTitle: movie?.title || '',
                    clipIndex: String(index),
                    thumbnailUrl: movie?.thumbnailUrl || '',
                },
            });
            return;
        }

        if (index !== activeClipIndex && index >= 0 && index < clips.length) {
            setActiveClipIndex(index);
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={clips}
                extraData={activeClipIndex}
                renderItem={({ item, index }) => (
                    <ClipPlayer
                        key={`${item.id}-${activeClipIndex}`}
                        clip={item}
                        index={index}
                        isActive={index === activeClipIndex}
                        onFinished={() => goToNextClip(index)}
                        movie={movie}
                        liked={liked}
                        inWatchLater={inWatchLater}
                        onLike={handleLike}
                        onWatchLater={handleWatchLater}
                        onBack={handleBack}
                        onShare={handleShare}
                        totalClips={clips.length}
                        screenWidth={screenWidth}
                        screenHeight={screenHeight}
                        isPremium={isPremium}
                    />
                )}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={screenHeight}
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScroll}
                getItemLayout={(data, index) => ({
                    length: screenHeight,
                    offset: screenHeight * index,
                    index,
                })}
                removeClippedSubviews={true}
                initialNumToRender={2}
                maxToRenderPerBatch={3}
                windowSize={5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
    },
    backButtonCenter: {
        backgroundColor: '#E50914',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    topNav: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },
    shareButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },
    rightButtons: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 120 : 100,
        right: 16,
        alignItems: 'center',
        gap: 20,
        zIndex: 10,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 11,
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    activeText: {
        color: '#E50914',
    },
    activeTextGreen: {
        color: '#00ff00',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 120 : 100,
        left: 16,
        width: '70%',
        zIndex: 10,
    },
    movieTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 6,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    clipInfo: {
        color: '#ccc',
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
});

