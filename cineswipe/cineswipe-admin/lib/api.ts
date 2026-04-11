const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ========== Auth ==========

export async function loginAdmin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (!data.user?.isAdmin) throw new Error('Access denied: not an admin');

    return data; // { token, user }
}

// ========== Helper ==========

async function adminFetch(path: string, token: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return res.json();
}

// ========== Upload with Progress ==========

export interface UploadProgress {
    loaded: number;
    total: number;
    percent: number;
}

function uploadWithProgress(
    url: string,
    method: string,
    token: string,
    formData: FormData,
    onProgress?: (p: UploadProgress) => void,
): Promise<any> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress({
                        loaded: e.loaded,
                        total: e.total,
                        percent: Math.round((e.loaded / e.total) * 100),
                    });
                }
            };
        }

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    reject(new Error(data.error || `Request failed: ${xhr.status}`));
                }
            } catch {
                reject(new Error(`Request failed: ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
}

// ========== Stats ==========

export async function getStats(token: string) {
    return adminFetch('/admin/stats', token);
}

// ========== Movies ==========

export async function getMovies(token: string) {
    return adminFetch('/movies', token);
}

export async function getMovie(token: string, id: string) {
    return adminFetch(`/movies/${id}`, token);
}

export async function createMovie(token: string, formData: FormData, onProgress?: (p: UploadProgress) => void) {
    return uploadWithProgress(`${API_BASE}/admin/movies`, 'POST', token, formData, onProgress);
}

export async function deleteMovie(token: string, id: string) {
    return adminFetch(`/admin/movies/${id}`, token, { method: 'DELETE' });
}

// ========== Clips ==========

export async function addClip(token: string, movieId: string, formData: FormData, onProgress?: (p: UploadProgress) => void) {
    return uploadWithProgress(`${API_BASE}/admin/movies/${movieId}/clips`, 'POST', token, formData, onProgress);
}

export async function deleteClip(token: string, movieId: string, clipId: string) {
    return adminFetch(`/admin/movies/${movieId}/clips/${clipId}`, token, { method: 'DELETE' });
}

export async function replaceClip(token: string, movieId: string, clipId: string, formData: FormData, onProgress?: (p: UploadProgress) => void) {
    return uploadWithProgress(`${API_BASE}/admin/movies/${movieId}/clips/${clipId}`, 'PUT', token, formData, onProgress);
}

// ========== Movie Update ==========

export async function updateMovie(token: string, id: string, formData: FormData, onProgress?: (p: UploadProgress) => void) {
    return uploadWithProgress(`${API_BASE}/admin/movies/${id}`, 'PUT', token, formData, onProgress);
}

// ========== Users ==========

export async function getUsers(token: string) {
    return adminFetch('/admin/users', token);
}

export async function deleteUser(token: string, id: string) {
    return adminFetch(`/admin/users/${id}`, token, { method: 'DELETE' });
}

export async function toggleUserAdmin(token: string, id: string) {
    return adminFetch(`/admin/users/${id}/role`, token, { method: 'PATCH' });
}

export async function toggleUserSubscription(token: string, id: string, status: 'FREE' | 'ACTIVE' | 'EXPIRED', daysToAdd?: number) {
    return adminFetch(`/admin/users/${id}/subscription`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, daysToAdd }),
    });
}

// ========== Clip Reorder ==========

export async function reorderClips(token: string, movieId: string, clipIds: string[]) {
    return adminFetch(`/admin/movies/${movieId}/clips/reorder`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipIds }),
    });
}
