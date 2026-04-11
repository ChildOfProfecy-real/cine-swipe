'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getStats } from '@/lib/api';

interface TopLiked {
    movieId: string;
    title: string;
    genre: string;
    likeCount: number;
}

interface RecentUser {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
}

interface Stats {
    totalMovies: number;
    totalUsers: number;
    totalClips: number;
    totalLikes: number;
    totalWatchlist: number;
    topLiked: TopLiked[];
    recentUsers: RecentUser[];
    totalRevenue: number;
    activeSubscribers: number;
    pastDueSubscribers: number;
    paywallBounces: number;
    recentPayments: {
        id: string;
        amount: number;
        createdAt: string;
        user: { email: string; name: string | null };
    }[];
}

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) return;
        getStats(token)
            .then(data => setStats(data))
            .catch(err => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ color: '#e74c3c', fontSize: 14 }}>{error || 'No data available'}</p>
            </div>
        );
    }

    const maxLikes = stats.topLiked.length > 0 ? stats.topLiked[0].likeCount : 1;

    const conversionRate = stats.totalUsers > 0
        ? ((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1)
        : '0.0';

    const statCards = [
        { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#6c5ce7' },
        { label: 'Active Subscribers', value: stats.activeSubscribers, icon: '⭐', color: '#00b894' },
        { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#0984e3' },
        { label: 'Conversion Rate', value: `${conversionRate}%`, icon: '📈', color: '#e84393' },
    ];

    const contentCards = [
        { label: 'Movies', value: stats.totalMovies, icon: '🎬' },
        { label: 'Clips', value: stats.totalClips, icon: '🎞️' },
        { label: 'Likes', value: stats.totalLikes, icon: '❤️' },
        { label: 'Watchlist', value: stats.totalWatchlist, icon: '📋' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Analytics & Revenue</h1>

            {/* Financial & User KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24,
            }}>
                {statCards.map(card => (
                    <div key={card.label} className="card" style={{
                        padding: '24px',
                        textAlign: 'center',
                        borderTop: `4px solid ${card.color}`,
                        boxShadow: `0 4px 20px ${card.color}15`,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>{card.icon}</div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {card.value}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {card.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Content KPIs & Paywall Insights Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>

                {/* Content Stats Box */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Content Overview</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {contentCards.map(card => (
                            <div key={card.label} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ fontSize: 20 }}>{card.icon}</div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>{card.value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{card.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subscriptions Risk Board */}
                <div className="card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Subscription Insights</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid #e74c3c', padding: '12px 16px', borderRadius: 4 }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#e74c3c' }}>{stats.paywallBounces}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Paywall Bounces (Users stopped at Clip 7)</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Free users who hit the paywall but didn't convert.</div>
                        </div>

                        <div style={{ background: 'rgba(243, 156, 18, 0.1)', borderLeft: '4px solid #f39c12', padding: '12px 16px', borderRadius: 4 }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#f39c12' }}>{stats.pastDueSubscribers}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>Past Due Subscribers (Churn Risk)</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Users inside their 3-day grace period for failed UPI payments.</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Three-column layout for detail tables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

                {/* Recent Transactions */}
                <div className="card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                        💸 Recent Transactions
                    </h2>
                    {stats.recentPayments.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No paid transactions yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {stats.recentPayments.map(payment => (
                                <div key={payment.id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', padding: '8px 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2ecc71' }}>
                                            +₹{(payment.amount / 100).toFixed(0)}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {payment.user.name || payment.user.email}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Most Liked Movies */}
                <div className="card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                        🏆 Most Liked Movies
                    </h2>
                    {stats.topLiked.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No likes yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.topLiked.map((movie, i) => (
                                <div key={movie.movieId}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 13, marginBottom: 4,
                                    }}>
                                        <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                            {i + 1}. {movie.title}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {movie.likeCount} ❤️
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 8,
                                        borderRadius: 4,
                                        background: 'var(--bg-secondary)',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(movie.likeCount / maxLikes) * 100}%`,
                                            background: 'linear-gradient(90deg, #6c5ce7, #a78bfa)',
                                            borderRadius: 4,
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Signups */}
                <div className="card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                        🆕 Recent Signups
                    </h2>
                    {stats.recentUsers.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No users yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {stats.recentUsers.map(user => (
                                <div key={user.id} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', padding: '8px 0',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                                            {user.name || 'No name'}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {user.email}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
