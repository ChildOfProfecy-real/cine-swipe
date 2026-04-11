'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/movies/new', label: 'Add Movie', icon: '➕' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: 240,
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 50,
            }}>
                {/* Logo */}
                <div style={{
                    padding: '24px 20px',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <Link href="/admin" style={{ textDecoration: 'none' }}>
                        <h1 style={{
                            fontSize: 22,
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            CineSwipe
                        </h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Admin Panel</p>
                    </Link>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '16px 12px' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    fontSize: 14,
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--bg-hover)' : 'transparent',
                                    textDecoration: 'none',
                                    marginBottom: 4,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: 16 }}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div style={{
                    padding: '16px 12px',
                    borderTop: '1px solid var(--border)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        marginBottom: 8,
                    }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'white',
                        }}>
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{user?.name || 'Admin'}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: 240,
                padding: '32px 40px',
                minHeight: '100vh',
            }}>
                {children}
            </main>
        </div>
    );
}
