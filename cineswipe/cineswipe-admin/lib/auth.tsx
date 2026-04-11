'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Restore session from cookie
        const savedToken = getCookie('admin_token');
        const savedUser = getCookie('admin_user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(decodeURIComponent(savedUser)));
            } catch {
                // Invalid cookies, clear them
                clearCookies();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);

        // Set HttpOnly-like cookies (in production, these should be set server-side)
        const maxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `admin_token=${newToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `admin_user=${encodeURIComponent(JSON.stringify(newUser))}; path=/; max-age=${maxAge}; SameSite=Lax`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        clearCookies();
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
}

// Cookie helpers
function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
}

function clearCookies() {
    document.cookie = 'admin_token=; path=/; max-age=0';
    document.cookie = 'admin_user=; path=/; max-age=0';
}
