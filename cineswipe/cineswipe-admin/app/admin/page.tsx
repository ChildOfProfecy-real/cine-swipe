'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getStats, getMovies, deleteMovie } from '@/lib/api';

interface Stats {
    totalMovies: number;
    totalUsers: number;
    totalClips: number;
}

interface Movie {
    id: string;
    title: string;
    genre: string;
    thumbnailUrl: string;
    createdAt: string;
    clips?: { id: string }[];
}

export default function DashboardPage() {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [statsData, moviesResponse] = await Promise.all([
                getStats(token),
                getMovies(token),
            ]);
            setStats(statsData);
            // Handle paginated response { movies, pagination } or plain array
            const moviesList = Array.isArray(moviesResponse) ? moviesResponse : (moviesResponse as any).movies || [];
            setMovies(moviesList);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Re-fetch data every time this page mounts (including navigating back from /new)
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (movieId: string, title: string) => {
        if (!token) return;
        if (!confirm(`Delete "${title}"? This will remove all clips and files permanently.`)) return;

        setDeleteId(movieId);
        try {
            await deleteMovie(token, movieId);
            setMovies(prev => prev.filter(m => m.id !== movieId));
            setStats(prev => prev ? { ...prev, totalMovies: prev.totalMovies - 1 } : null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setDeleteId(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Overview of your CineSwipe content
                    </p>
                </div>
                <Link href="/admin/movies/new" className="btn btn-primary">
                    ➕ Add Movie
                </Link>
            </div>

            {/* Stats Row */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                    <div className="stat-card">
                        <span className="stat-value">{stats.totalMovies}</span>
                        <span className="stat-label">Movies</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.totalClips}</span>
                        <span className="stat-label">Clips</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.totalUsers}</span>
                        <span className="stat-label">Users</span>
                    </div>
                </div>
            )}

            {/* Movies Table */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>All Movies</h2>
            </div>

            {movies.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 }}>
                        No movies yet. Add your first movie to get started.
                    </p>
                    <Link href="/admin/movies/new" className="btn btn-primary">
                        ➕ Add Movie
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 50 }}></th>
                                <th>Title</th>
                                <th>Genre</th>
                                <th>Clips</th>
                                <th>Created</th>
                                <th style={{ width: 180 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movies.map((movie) => (
                                <tr key={movie.id}>
                                    <td>
                                        {movie.thumbnailUrl ? (
                                            <img
                                                src={movie.thumbnailUrl}
                                                alt=""
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 6,
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 6,
                                                background: 'var(--bg-hover)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 18,
                                            }}>
                                                🎬
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{movie.title}</td>
                                    <td><span className="badge">{movie.genre}</span></td>
                                    <td>{movie.clips?.length ?? '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                        {new Date(movie.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link
                                                href={`/admin/movies/${movie.id}`}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                Manage
                                            </Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(movie.id, movie.title)}
                                                disabled={deleteId === movie.id}
                                            >
                                                {deleteId === movie.id ? (
                                                    <span className="spinner" />
                                                ) : (
                                                    'Delete'
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
