export interface User {
    id: string;
    email: string;
    name?: string;
    isAdmin: boolean;
}

export interface Movie {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    heroUrl?: string;
    trailerUrl?: string;
    genre: string;
    clips: Clip[];
    createdAt?: string;
    updatedAt?: string;
}

export interface Clip {
    id: string;
    movieId: string;
    videoUrl: string;
    sequence: number;
    duration: number;
}

export interface Comment {
    id: string;
    userId: string;
    userName?: string; // Hydrated from User
    movieId: string;
    content: string;
    createdAt: string;
}

// Pagination metadata from GET /movies
export interface PaginationMeta {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

export interface PaginatedMovies {
    movies: Movie[];
    pagination: PaginationMeta;
}
