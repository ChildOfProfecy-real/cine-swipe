import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Movie, User, PaginatedMovies } from '../types';

// API Configuration
const API_BASE_URL = 'http://192.168.0.105:3001'; // Update to your machine's local IP
const TOKEN_KEY = 'cineswipe_auth_token';

// ============== Token Management ==============

export async function getToken(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
}

// ============== API Helpers ==============

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        // Handle expired or invalid tokens by redirecting to login
        if (response.status === 401) {
            await clearToken();
            router.replace('/login');
            throw new Error('UNAUTHORIZED');
        }
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ============== Auth API ==============

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export async function loginAPI(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    await setToken(response.token);
    return response;
}

export async function registerAPI(
    name: string,
    email: string,
    password: string
): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    await setToken(response.token);
    return response;
}

export async function logoutAPI(): Promise<void> {
    await clearToken();
}

export async function getCurrentUser(): Promise<User> {
    return apiRequest<User>('/users/me');
}

// ============== Movies API ==============

export async function getMovies(options?: {
    genre?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<Movie[]> {
    const params = new URLSearchParams();
    if (options?.genre) params.append('genre', options.genre);
    if (options?.search) params.append('search', options.search);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const query = params.toString();
    const response = await apiRequest<PaginatedMovies | Movie[]>(`/movies${query ? `?${query}` : ''}`);

    // Handle paginated response (new) or plain array (fallback)
    if (Array.isArray(response)) return response;
    return response.movies;
}

export async function getMovie(id: string): Promise<Movie> {
    return apiRequest<Movie>(`/movies/${id}`);
}

// ============== User Lists API ==============

export interface LikeResponse {
    liked: boolean;
    message: string;
}

export interface WatchlistResponse {
    inWatchlist: boolean;
    message: string;
}

export interface MovieStatus {
    movieId: string;
    liked: boolean;
    inWatchlist: boolean;
}

export async function toggleLikeAPI(movieId: string): Promise<LikeResponse> {
    return apiRequest<LikeResponse>(`/users/me/likes/${movieId}`, {
        method: 'POST',
    });
}

export async function toggleWatchlistAPI(movieId: string): Promise<WatchlistResponse> {
    return apiRequest<WatchlistResponse>(`/users/me/watchlist/${movieId}`, {
        method: 'POST',
    });
}

export async function getLikedMovies(): Promise<Movie[]> {
    return apiRequest<Movie[]>('/users/me/likes');
}

export async function getWatchlistMovies(): Promise<Movie[]> {
    return apiRequest<Movie[]>('/users/me/watchlist');
}

export async function getMovieStatus(movieId: string): Promise<MovieStatus> {
    return apiRequest<MovieStatus>(`/users/me/status/${movieId}`);
}

// ============== Continue Watching API ==============

export interface WatchProgressData {
    clipId: string | null;
    timestamp: number;
    updatedAt: string;
}

export interface MovieWithProgress extends Movie {
    watchProgress: WatchProgressData;
}

export async function saveWatchProgress(
    movieId: string,
    timestamp: number,
    clipId?: string
): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>('/users/me/progress', {
        method: 'POST',
        body: JSON.stringify({ movieId, clipId, timestamp }),
    });
}

export async function getContinueWatching(): Promise<MovieWithProgress[]> {
    return apiRequest<MovieWithProgress[]>('/users/me/continue-watching');
}

export async function clearWatchProgress(movieId: string): Promise<{ success: boolean }> {
    return apiRequest<{ success: boolean }>(`/users/me/progress/${movieId}`, {
        method: 'DELETE',
    });
}

export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
    const token = await getToken();
    if (!token) {
        return { isAuthenticated: false, user: null };
    }

    try {
        const user = await getCurrentUser();
        return { isAuthenticated: true, user };
    } catch {
        await clearToken();
        return { isAuthenticated: false, user: null };
    }
}

// ============== Subscription API ==============

const SUBSCRIPTION_CACHE_KEY = 'cineswipe_subscription';
export const FREE_CLIP_LIMIT = 7;

export interface SubscriptionStatus {
    status: string; // FREE, ACTIVE, PAST_DUE, CANCELLED, EXPIRED
    isPremium: boolean;
    currentPeriodEnd: string | null;
    freeClipLimit: number;
}

export interface SubscriptionCreateResponse {
    subscriptionId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const data = await apiRequest<SubscriptionStatus>('/subscription/status');
    // Cache for offline use
    try {
        await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({
            ...data,
            cachedAt: new Date().toISOString(),
        }));
    } catch { /* ignore cache errors */ }
    return data;
}

export async function getCachedSubscription(): Promise<SubscriptionStatus | null> {
    try {
        const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
        if (!cached) return null;
        const data = JSON.parse(cached);
        // Trust cache for up to 24 hours if premium
        const cachedAt = new Date(data.cachedAt);
        const hoursSinceCached = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCached > 24) return null;
        return data;
    } catch {
        return null;
    }
}

export async function createSubscription(): Promise<SubscriptionCreateResponse> {
    return apiRequest<SubscriptionCreateResponse>('/subscription/create', {
        method: 'POST',
    });
}

export async function verifySubscription(paymentData: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
}): Promise<SubscriptionStatus> {
    const data = await apiRequest<SubscriptionStatus>('/subscription/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData),
    });
    // Update cache immediately
    try {
        await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify({
            ...data,
            cachedAt: new Date().toISOString(),
        }));
    } catch { /* ignore */ }
    return data;
}

export async function cancelSubscription(): Promise<{ status: string; message: string }> {
    return apiRequest('/subscription/cancel', { method: 'POST' });
}

export async function cancelPendingSubscription(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/subscription/cancel-pending', { method: 'POST' });
}

// ============== Admin API (DEPRECATED) ==============
// These functions are no longer used in the mobile app.
// Admin uploads are now handled exclusively via the Next.js Admin Panel.
// Kept here commented out for reference. Original file backed up at:
// app/deprecated/upload.tsx

/*
export interface MovieCreateInput {
    title: string;
    description: string;
    genre: string;
    movieUrl: string;
    thumbnailUrl: string;
}

export async function uploadFile(file: { uri: string; name: string; type: string }): Promise<{ url: string }> {
    const token = await getToken();
    const formData = new FormData();
    if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name || 'upload.bin');
    } else {
        formData.append('file', { uri: file.uri, name: file.name, type: file.type || 'application/octet-stream' } as any);
    }
    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'File upload failed');
    return { url: data.url };
}

export async function createMovieAPI(input: MovieCreateInput): Promise<Movie> {
    return apiRequest<Movie>('/movies', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}
*/
