'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getUsers, deleteUser, toggleUserAdmin, toggleUserSubscription } from '@/lib/api';

interface UserRecord {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    createdAt: string;
    _count: {
        lists: number;
        comments: number;
        watchProgress: number;
    };
    subscription?: {
        status: string;
        currentPeriodEnd: string | null;
    } | null;
}

export default function UsersPage() {
    const { token } = useAuth();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        if (!token) return;
        try {
            const data = await getUsers(token);
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const handleToggleAdmin = async (userId: string, userName: string | null) => {
        if (!token) return;

        setActionLoading(`admin-${userId}`);
        setError('');
        try {
            const updated = await toggleUserAdmin(token, userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: updated.isAdmin } : u));
            showSuccess(`${updated.name || updated.email} is now ${updated.isAdmin ? 'an admin' : 'a regular user'}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleSubscription = async (userId: string, currentStatus: string | undefined, userName: string | null) => {
        if (!token) return;

        const isPremium = currentStatus === 'ACTIVE';
        const newStatus = isPremium ? 'EXPIRED' : 'ACTIVE';

        setActionLoading(`sub-${userId}`);
        setError('');
        try {
            const updated = await toggleUserSubscription(token, userId, newStatus, 30);
            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, subscription: { status: updated.status, currentPeriodEnd: updated.currentPeriodEnd } }
                    : u
            ));
            showSuccess(`Successfully ${isPremium ? 'revoked Premium from' : 'granted Premium to'} ${userName || 'the user'}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update subscription status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!token) return;
        if (!confirm(`Delete user "${userEmail}" permanently? This cannot be undone.`)) return;

        setActionLoading(`delete-${userId}`);
        setError('');
        try {
            await deleteUser(token, userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            showSuccess(`User ${userEmail} deleted`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            u.email.toLowerCase().includes(q) ||
            (u.name && u.name.toLowerCase().includes(q))
        );
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    return (
        <div>
            {/* Success Toast */}
            {success && <div className="toast toast-success">{success}</div>}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>User Management</h1>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                        {users.length} registered user{users.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: 400,
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                    }}
                />
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 20,
                    fontSize: 14,
                    color: '#e74c3c',
                }}>
                    {error}
                </div>
            )}

            {/* Users Table */}
            {filteredUsers.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {search ? 'No users match your search' : 'No users found'}
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Subscription</th>
                                <th>Activity</th>
                                <th>Joined</th>
                                <th style={{ width: 260 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 500 }}>
                                        {user.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No name</span>}
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        {user.email}
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: user.isAdmin ? 'var(--accent)' : 'var(--bg-secondary)',
                                            color: user.isAdmin ? 'white' : 'var(--text-secondary)',
                                        }}>
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: user.subscription?.status === 'ACTIVE' ? '#2ecc71' : 'var(--bg-secondary)',
                                            color: user.subscription?.status === 'ACTIVE' ? 'white' : 'var(--text-secondary)',
                                        }}>
                                            {user.subscription?.status === 'ACTIVE' ? 'Premium ⭐' : 'Free'}
                                        </span>
                                        {user.subscription?.status === 'ACTIVE' && user.subscription.currentPeriodEnd && (
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                                Expires: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {user._count.lists} lists · {user._count.watchProgress} progress
                                    </td>
                                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleToggleSubscription(user.id, user.subscription?.status, user.name)}
                                                disabled={actionLoading === `sub-${user.id}`}
                                                style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                                            >
                                                {actionLoading === `sub-${user.id}` ? (
                                                    <span className="spinner" />
                                                ) : (
                                                    user.subscription?.status === 'ACTIVE' ? '❌ Revoke' : '⭐ Grant'
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleToggleAdmin(user.id, user.name)}
                                                disabled={actionLoading === `admin-${user.id}`}
                                                title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                                                style={{ padding: '4px 8px', fontSize: 12 }}
                                            >
                                                {actionLoading === `admin-${user.id}` ? (
                                                    <span className="spinner" />
                                                ) : (
                                                    user.isAdmin ? '👤 Demote' : '👑 Promote'
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteUser(user.id, user.email)}
                                                disabled={actionLoading === `delete-${user.id}`}
                                            >
                                                {actionLoading === `delete-${user.id}` ? (
                                                    <span className="spinner" />
                                                ) : (
                                                    '🗑️'
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
