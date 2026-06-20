import { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions, Platform, Share, useWindowDimensions, Alert, Animated, TouchableWithoutFeedback } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect } from "expo-router";
import { ResizeMode, Video, AVPlaybackStatus } from "expo-av";
import { BlurView } from "expo-blur";
import { ArrowLeft, Heart, Plus, Check, Share2, Play, Pause, ListVideo } from "lucide-react-native";
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from "../../src/lib/store";
import { getMovie, saveWatchProgress, getMovieClipProgress } from "../../src/lib/api";
import { Movie, Clip } from "../../src/types";
import { ActivityIndicator } from "react-native";
import { EpisodeSheet } from "../../src/components/EpisodeSheet";

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
    onOpenEpisodes,
    totalClips,
    screenWidth,
    screenHeight,
    isPremium,
    freeClipLimit,
    shouldRenderVideo
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
    onOpenEpisodes: (e?: any) => void;
    totalClips: number;
    screenWidth: number;
    screenHeight: number;
    isPremium: boolean;
    freeClipLimit: number;
    shouldRenderVideo?: boolean;
}) => {
    const videoRef = useRef<Video>(null);
    const [isBuffering, setIsBuffering] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handlePlayback = async () => {
            try {
                if (!videoRef.current) return;
                
                if (!isActive) {
                    setIsPaused(false);
                    await videoRef.current.pauseAsync();
                } else if (!isPaused) {
                    await videoRef.current.playAsync();
                } else {
                    await videoRef.current.pauseAsync();
                }
            } catch (error) {
                // Ignore EXVideo registry errors on unmount/remount
            }
        };

        handlePlayback();
    }, [isActive, isPaused]);

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
            setIsBuffering(true);
            return;
        }

        setIsBuffering(status.isBuffering);

        if (status.didJustFinish && isActive) {
            onFinished();
        }
    };

    // UI Fading Logic
    const uiOpacity = useRef(new Animated.Value(1)).current;
    const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

    const resetFadeTimer = useCallback(() => {
        // Show UI
        Animated.timing(uiOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        if (fadeTimeout.current) clearTimeout(fadeTimeout.current);

        if (isActive && !isPaused) {
            fadeTimeout.current = setTimeout(() => {
                Animated.timing(uiOpacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            }, 3000); // 3 seconds before fade out
        }
    }, [isActive, isPaused, uiOpacity]);

    useEffect(() => {
        resetFadeTimer();
        return () => {
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        };
    }, [isActive, isPaused, resetFadeTimer]);

    const tapTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleTap = () => {
        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
            // Future double tap like
        } else {
            tapTimeout.current = setTimeout(() => {
                tapTimeout.current = null;
                setIsPaused(prev => !prev);
            }, 250);
        }
    };

    // Dynamic styles based on screen dimensions
    const isLandscape = screenWidth > screenHeight;
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
        topNav: {
            position: 'absolute' as const,
            top: isLandscape ? 16 : (Platform.OS === 'ios' ? 60 : 40),
            left: 0,
            right: 0,
            paddingHorizontal: isLandscape ? 32 : 16,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            zIndex: 10,
        },
        rightButtons: {
            position: 'absolute' as const,
            bottom: isLandscape ? 40 : (Platform.OS === 'ios' ? 120 : 100),
            right: isLandscape ? 32 : 16,
            alignItems: 'center' as const,
            gap: 20,
            zIndex: 10,
        },
        bottomInfo: {
            position: 'absolute' as const,
            bottom: isLandscape ? 40 : (Platform.OS === 'ios' ? 120 : 100),
            left: isLandscape ? 32 : 16,
            width: isLandscape ? '60%' : '70%',
            zIndex: 10,
        }
    };

    return (
        <TouchableWithoutFeedback onPress={handleTap}>
            <View style={dynamicStyles.clipContainer}>
                {/* Video layer - doesn't capture touches */}
                <View style={dynamicStyles.videoContainer} pointerEvents="none">
                    {shouldRenderVideo !== false && (
                        <Video
                            ref={videoRef}
                            source={{ uri: clip.videoUrl }}
                            rate={1.0}
                            volume={1.0}
                            isMuted={false}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={isActive && !isPaused}
                            isLooping={false}
                            style={dynamicStyles.video}
                            useNativeControls={false}
                            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                            onLoadStart={() => setIsBuffering(true)}
                            onReadyForDisplay={() => setIsBuffering(false)}
                            progressUpdateIntervalMillis={500}
                        />
                    )}
                    {isBuffering && (
                        <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                            <ActivityIndicator size="large" color="#E50914" />
                        </View>
                    )}
                    {isPaused && !isBuffering && (
                        <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                            <Animated.View style={{ opacity: uiOpacity }}>
                                <Play fill="white" size={72} color="white" />
                            </Animated.View>
                        </View>
                    )}
                </View>

                {/* Top Navigation */}
                <Animated.View style={[dynamicStyles.topNav, { opacity: uiOpacity }]} pointerEvents="box-none">
                    <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                        <BlurView intensity={30} tint="dark" style={styles.iconBlur}>
                            <ArrowLeft color="white" size={24} />
                        </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onShare} style={styles.shareButton} activeOpacity={0.7}>
                        <BlurView intensity={30} tint="dark" style={styles.iconBlur}>
                            <Share2 color="white" size={22} />
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Right Side Buttons */}
                <Animated.View style={[dynamicStyles.rightButtons, { opacity: uiOpacity }]} pointerEvents="box-none">
                    <TouchableOpacity onPress={onLike} activeOpacity={0.7}>
                        <BlurView intensity={40} tint="dark" style={styles.actionBlur}>
                            <Heart
                                color={liked ? (isPremium ? "#D4AF37" : "#E50914") : "white"}
                                fill={liked ? (isPremium ? "#D4AF37" : "#E50914") : "transparent"}
                                size={26}
                            />
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onWatchLater} activeOpacity={0.7}>
                        <BlurView intensity={40} tint="dark" style={styles.actionBlur}>
                            {inWatchLater ? (
                                <Check color="#00ff00" size={28} />
                            ) : (
                                <Plus color="white" size={28} />
                            )}
                        </BlurView>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onOpenEpisodes} activeOpacity={0.7}>
                        <BlurView intensity={40} tint="dark" style={styles.actionBlur}>
                            <ListVideo color="white" size={24} />
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Bottom Info */}
                <Animated.View style={[dynamicStyles.bottomInfo, { opacity: uiOpacity }]} pointerEvents="box-none">
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={styles.movieTitle}>{movie.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => setIsPaused(!isPaused)} style={{ marginRight: 10 }}>
                            {isPaused ? <Play color="white" fill="white" size={20} /> : <Pause color="white" fill="white" size={20} />}
                        </TouchableOpacity>
                        <Text style={styles.clipInfo}>
                            Clip {index + 1} of {totalClips} • {movie.genre}
                            {!isPremium && index + 1 >= freeClipLimit ? ' • 🔒 Premium' : ''}
                        </Text>
                    </View>
                    {isPremium && index === 0 && (
                        <View style={{marginTop: 8, backgroundColor: 'rgba(212, 175, 55, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#D4AF37'}}>
                            <Text style={{color: '#D4AF37', fontSize: 12, fontWeight: 'bold'}}>✨ Premium Unlocked</Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
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
    const [episodeSheetVisible, setEpisodeSheetVisible] = useState(false);
    const [watchedIndices, setWatchedIndices] = useState<Set<number>>(new Set());
    const [isScreenFocused, setIsScreenFocused] = useState(true);
    const hasPushedPaywall = useRef(false);

    useFocusEffect(
        useCallback(() => {
            setIsScreenFocused(true);
            // Reset paywall flag when screen is focused
            hasPushedPaywall.current = false;
            
            ScreenOrientation.unlockAsync();
            return () => {
                setIsScreenFocused(false);
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            };
        }, [])
    );

    const { toggleLike, toggleWatchLater, isLiked, isInWatchLater, movies, isAuthenticated, isPremium, freeClipLimit } = useAppStore();
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

    // Re-snap to current clip after dimension change
    useEffect(() => {
        if (movie && movie.clips && hasScrolledToInitial) {
            const timeout = setTimeout(() => {
                flatListRef.current?.scrollToIndex({ 
                    index: activeClipIndex, 
                    animated: false 
                });
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [screenWidth, screenHeight, activeClipIndex, movie, hasScrolledToInitial]);

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

    const handleOpenEpisodes = useCallback(async (e?: any) => {
        e?.stopPropagation?.();
        if (!isAuthenticated) {
            Alert.alert('Sign In Required', 'Please log in to track episode progress.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign In', onPress: () => router.push('/login') },
            ]);
            return;
        }

        try {
            const progress = await getMovieClipProgress(movieId);
            const watched = new Set<number>();
            progress.clips.forEach((clip, index) => {
                if (clip.watched) watched.add(index);
            });
            watched.add(activeClipIndex); // current is also watched
            
            setWatchedIndices(watched);
        } catch (err) {
            console.error('Failed to fetch progress:', err);
            const watched = new Set<number>();
            watched.add(activeClipIndex);
            setWatchedIndices(watched);
        }

        setEpisodeSheetVisible(true);
    }, [isAuthenticated, router, movieId, activeClipIndex]);

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

    const handleSelectClip = useCallback((index: number) => {
        setEpisodeSheetVisible(false);
        if (!isPremium && index >= freeClipLimit) {
            if (!hasPushedPaywall.current) {
                hasPushedPaywall.current = true;
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
            }
            return;
        }

        const clipsLength = movie?.clips?.length || 1;
        if (index < clipsLength) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
            setActiveClipIndex(index);
        }
    }, [isPremium, movieId, movie, router, saveCurrentProgress, freeClipLimit]);

    // Save progress whenever activeClipIndex changes
    useEffect(() => {
        saveCurrentProgress();
    }, [activeClipIndex, saveCurrentProgress]);

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
        { id: 'placeholder', movieId: movie.id, videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', sequence: 1, duration: 120 }
    ];

    const goToNextClip = (currentIndex: number) => {
        const nextIndex = currentIndex + 1;

        // Paywall check: free users limited to freeClipLimit clips
        if (!isPremium && nextIndex >= freeClipLimit) {
            if (!hasPushedPaywall.current) {
                hasPushedPaywall.current = true;
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
            }
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
        if (!isPremium && index >= freeClipLimit) {
            flatListRef.current?.scrollToIndex({ index: freeClipLimit - 1, animated: true });

            // Show paywall when user attempts to swipe past the limit limit
            if (!hasPushedPaywall.current) {
                hasPushedPaywall.current = true;
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
            }
            return;
        }

        if (index !== activeClipIndex && index >= 0 && index < clips.length) {
            setActiveClipIndex(index);
        }
    };

    const isLandscape = screenWidth > screenHeight;

    return (
        <View style={styles.container}>
            <StatusBar hidden={isLandscape} />
            <FlatList
                ref={flatListRef}
                data={clips}
                extraData={activeClipIndex}
                renderItem={({ item, index }) => (
                    <ClipPlayer
                        clip={item}
                        index={index}
                        isActive={isScreenFocused && index === activeClipIndex}
                        shouldRenderVideo={Math.abs(index - activeClipIndex) <= 1}
                        onFinished={() => goToNextClip(index)}
                        movie={movie}
                        liked={liked}
                        inWatchLater={inWatchLater}
                        onLike={handleLike}
                        onWatchLater={handleWatchLater}
                        onBack={handleBack}
                        onShare={handleShare}
                        onOpenEpisodes={handleOpenEpisodes}
                        totalClips={clips.length}
                        screenWidth={screenWidth}
                        screenHeight={screenHeight}
                        isPremium={isPremium}
                        freeClipLimit={freeClipLimit}
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
            <EpisodeSheet
                visible={episodeSheetVisible}
                onClose={() => setEpisodeSheetVisible(false)}
                clips={clips}
                activeIndex={activeClipIndex}
                watchedIndices={watchedIndices}
                onSelectClip={handleSelectClip}
                movieTitle={movie.title}
                movieThumbnail={movie.thumbnailUrl || ''}
                isLandscape={isLandscape}
                freeClipLimit={freeClipLimit}
                isPremium={isPremium}
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
        borderRadius: 25,
        overflow: 'hidden',
    },
    shareButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    iconBlur: {
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
    actionBlur: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
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

