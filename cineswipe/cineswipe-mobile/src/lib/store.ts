import { create } from 'zustand';
import { Movie, User } from '../types';
import * as api from './api';

interface AppState {
    // Auth
    currentUser: User | null;
    isAuthenticated: boolean;
    authLoading: boolean;
    authError: string | null;

    // Auth Actions
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
    checkAuth: () => Promise<void>;
    clearAuthError: () => void;

    // Subscription
    isPremium: boolean;
    subscriptionStatus: string;
    fetchSubscriptionStatus: () => Promise<void>;

    // Movies
    movies: Movie[];
    moviesLoading: boolean;
    moviesError: string | null;
    fetchMovies: (options?: { genre?: string; search?: string }) => Promise<void>;

    // User Lists
    likedMovieIds: string[];
    watchLaterMovieIds: string[];
    listsLoading: boolean;

    toggleLike: (movieId: string) => Promise<void>;
    toggleWatchLater: (movieId: string) => Promise<void>;
    isLiked: (movieId: string) => boolean;
    isInWatchLater: (movieId: string) => boolean;
    fetchUserLists: () => Promise<void>;
    getLikedMovies: () => Movie[];
    getWatchLaterMovies: () => Movie[];

    // Search History
    recentSearches: string[];
    addRecentSearch: (query: string) => void;
    clearRecentSearches: () => void;

    // App Config
    freeClipLimit: number;
    fetchConfig: () => Promise<void>;

    // Preferences
    appIcon: string;
    setAppIcon: (icon: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Auth State
    currentUser: null,
    isAuthenticated: false,
    authLoading: false,
    authError: null,

    login: async (email: string, password: string) => {
        set({ authLoading: true, authError: null });
        try {
            const response = await api.loginAPI(email, password);
            set({
                currentUser: response.user,
                isAuthenticated: true,
                authLoading: false,
            });
            // Fetch user lists and subscription after login
            get().fetchUserLists();
            get().fetchSubscriptionStatus();
            return true;
        } catch (error) {
            let errorMessage = 'Login failed';
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                errorMessage = 'Cannot connect to server. Please check your internet connection and try again.';
            } else if (error instanceof Error) {
                errorMessage = error.message === 'UNAUTHORIZED'
                    ? 'Invalid email or password'
                    : error.message;
            }
            set({
                authLoading: false,
                authError: errorMessage,
            });
            return false;
        }
    },

    logout: async () => {
        await api.logoutAPI();
        set({
            currentUser: null,
            isAuthenticated: false,
            likedMovieIds: [],
            watchLaterMovieIds: [],
            isPremium: false,
            subscriptionStatus: 'FREE',
        });
    },

    register: async (name: string, email: string, password: string) => {
        set({ authLoading: true, authError: null });
        try {
            const response = await api.registerAPI(name, email, password);
            set({
                currentUser: response.user,
                isAuthenticated: true,
                authLoading: false,
            });
            return { success: true, message: 'Account created successfully!' };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            set({ authLoading: false, authError: message });
            return { success: false, message };
        }
    },

    checkAuth: async () => {
        set({ authLoading: true });
        
        // Always fetch config on startup
        get().fetchConfig();

        try {
            const { isAuthenticated, user } = await api.checkAuthStatus();
            set({
                isAuthenticated,
                currentUser: user,
                authLoading: false,
            });
            if (isAuthenticated) {
                get().fetchUserLists();
                get().fetchSubscriptionStatus();
            } else {
                // Load cached subscription for offline
                const cached = await api.getCachedSubscription();
                if (cached) {
                    set({ isPremium: cached.isPremium, subscriptionStatus: cached.status });
                }
            }
        } catch {
            set({
                isAuthenticated: false,
                currentUser: null,
                authLoading: false,
            });
        }
    },

    clearAuthError: () => set({ authError: null }),

    // Subscription State
    isPremium: false,
    subscriptionStatus: 'FREE',

    fetchSubscriptionStatus: async () => {
        if (!get().isAuthenticated) return;
        try {
            const data = await api.getSubscriptionStatus();
            set({ isPremium: data.isPremium, subscriptionStatus: data.status });
        } catch {
            // Fall back to cache
            const cached = await api.getCachedSubscription();
            if (cached) {
                set({ isPremium: cached.isPremium, subscriptionStatus: cached.status });
            }
        }
    },

    // Movies State
    movies: [],
    moviesLoading: false,
    moviesError: null,

    fetchMovies: async (options) => {
        set({ moviesLoading: true, moviesError: null });
        try {
            const movies = await api.getMovies(options);
            set({ movies, moviesLoading: false });
        } catch (error) {
            set({
                moviesLoading: false,
                moviesError: error instanceof Error ? error.message : 'Failed to fetch movies',
            });
        }
    },

    // User Lists State
    likedMovieIds: [],
    watchLaterMovieIds: [],
    listsLoading: false,

    fetchUserLists: async () => {
        if (!get().isAuthenticated) return;

        set({ listsLoading: true });
        try {
            const [likedMovies, watchlistMovies] = await Promise.all([
                api.getLikedMovies(),
                api.getWatchlistMovies(),
            ]);
            set({
                likedMovieIds: likedMovies.map(m => m.id),
                watchLaterMovieIds: watchlistMovies.map(m => m.id),
                listsLoading: false,
            });
        } catch {
            set({ listsLoading: false });
        }
    },

    toggleLike: async (movieId: string) => {
        if (!get().isAuthenticated) return;

        // Optimistic update
        const wasLiked = get().likedMovieIds.includes(movieId);
        set(state => ({
            likedMovieIds: wasLiked
                ? state.likedMovieIds.filter(id => id !== movieId)
                : [...state.likedMovieIds, movieId],
        }));

        try {
            await api.toggleLikeAPI(movieId);
        } catch {
            // Revert on error
            set(state => ({
                likedMovieIds: wasLiked
                    ? [...state.likedMovieIds, movieId]
                    : state.likedMovieIds.filter(id => id !== movieId),
            }));
        }
    },

    toggleWatchLater: async (movieId: string) => {
        if (!get().isAuthenticated) return;

        // Optimistic update
        const wasInWatchlist = get().watchLaterMovieIds.includes(movieId);
        set(state => ({
            watchLaterMovieIds: wasInWatchlist
                ? state.watchLaterMovieIds.filter(id => id !== movieId)
                : [...state.watchLaterMovieIds, movieId],
        }));

        try {
            await api.toggleWatchlistAPI(movieId);
        } catch {
            // Revert on error
            set(state => ({
                watchLaterMovieIds: wasInWatchlist
                    ? [...state.watchLaterMovieIds, movieId]
                    : state.watchLaterMovieIds.filter(id => id !== movieId),
            }));
        }
    },

    isLiked: (movieId: string) => get().likedMovieIds.includes(movieId),
    isInWatchLater: (movieId: string) => get().watchLaterMovieIds.includes(movieId),

    getLikedMovies: () => get().movies.filter(m => get().likedMovieIds.includes(m.id)),
    getWatchLaterMovies: () => get().movies.filter(m => get().watchLaterMovieIds.includes(m.id)),

    // Search History State
    recentSearches: [],
    addRecentSearch: (query: string) => {
        if (!query.trim()) return;
        const normalizedQuery = query.trim();
        set(state => {
            const filtered = state.recentSearches.filter(s => s.toLowerCase() !== normalizedQuery.toLowerCase());
            return {
                recentSearches: [normalizedQuery, ...filtered].slice(0, 10)
            };
        });
    },
    clearRecentSearches: () => set({ recentSearches: [] }),

    // App Config
    freeClipLimit: 7,
    fetchConfig: async () => {
        const config = await api.getAppConfig();
        if (config.FREE_CLIP_LIMIT) {
            set({ freeClipLimit: parseInt(config.FREE_CLIP_LIMIT, 10) });
        }
    },

    // Preferences
    appIcon: 'red',
    setAppIcon: (icon: string) => set({ appIcon: icon }),
}));
