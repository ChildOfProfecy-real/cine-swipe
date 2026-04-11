'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createMovie } from '@/lib/api';

export default function NewMoviePage() {
    const { token } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [genre, setGenre] = useState('');

    // File refs
    const thumbnailRef = useRef<HTMLInputElement>(null);
    const heroRef = useRef<HTMLInputElement>(null);
    const clipRef = useRef<HTMLInputElement>(null);

    // File names for display
    const [thumbnailName, setThumbnailName] = useState('');
    const [heroName, setHeroName] = useState('');
    const [clipName, setClipName] = useState('');

    const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Animation', 'Fantasy'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setError('');

        // Validations
        if (!title.trim()) { setError('Title is required'); return; }
        if (!genre) { setError('Genre is required'); return; }
        if (!clipRef.current?.files?.[0]) { setError('First clip file is required'); return; }

        const clipFile = clipRef.current.files[0];
        if (clipFile.size > 50 * 1024 * 1024) {
            setError('Clip file must be under 50MB');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('genre', genre);

            if (thumbnailRef.current?.files?.[0]) {
                setUploadProgress('Uploading thumbnail...');
                formData.append('thumbnail', thumbnailRef.current.files[0]);
            }

            if (heroRef.current?.files?.[0]) {
                setUploadProgress('Uploading hero image...');
                formData.append('hero', heroRef.current.files[0]);
            }

            setUploadProgress('Uploading clip (this may take a moment)...');
            formData.append('clip', clipFile);

            setUploadProgress('Creating movie...');
            await createMovie(token, formData);

            router.replace('/admin');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create movie');
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    return (
        <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Add New Movie</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Upload a movie with its first clip
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-secondary)' }}>
                        Movie Details
                    </h2>

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter movie title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Brief description of the movie"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Genre *</label>
                        <select
                            className="form-select"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            required
                        >
                            <option value="">Select a genre</option>
                            {genres.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-secondary)' }}>
                        Media Files
                    </h2>

                    <div className="form-group">
                        <label className="form-label">Thumbnail Image</label>
                        <div
                            className="form-file-input"
                            onClick={() => thumbnailRef.current?.click()}
                        >
                            {thumbnailName || 'Click to select thumbnail (JPG, PNG, WebP)'}
                        </div>
                        <input
                            ref={thumbnailRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => setThumbnailName(e.target.files?.[0]?.name || '')}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hero Image</label>
                        <div
                            className="form-file-input"
                            onClick={() => heroRef.current?.click()}
                        >
                            {heroName || 'Click to select hero image (JPG, PNG, WebP)'}
                        </div>
                        <input
                            ref={heroRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={(e) => setHeroName(e.target.files?.[0]?.name || '')}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">First Clip * (max 50MB)</label>
                        <div
                            className="form-file-input"
                            onClick={() => clipRef.current?.click()}
                            style={{ borderColor: clipName ? 'var(--success)' : undefined }}
                        >
                            {clipName || 'Click to select video clip (MP4, WebM, MOV)'}
                        </div>
                        <input
                            ref={clipRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            style={{ display: 'none' }}
                            onChange={(e) => setClipName(e.target.files?.[0]?.name || '')}
                        />
                    </div>
                </div>

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

                {uploadProgress && (
                    <div style={{
                        background: 'rgba(108, 92, 231, 0.1)',
                        border: '1px solid rgba(108, 92, 231, 0.3)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        marginBottom: 20,
                        fontSize: 14,
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                    }}>
                        <span className="spinner" />
                        {uploadProgress}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ padding: '12px 32px' }}
                    >
                        {loading ? 'Creating...' : 'Create Movie'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => router.push('/admin')}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
