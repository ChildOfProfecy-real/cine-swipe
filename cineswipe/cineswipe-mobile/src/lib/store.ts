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
            set({
                authLoading: false,
                authError: error instanceof Error ? error.message : 'Login failed',
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
}));
