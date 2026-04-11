'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMovie, addClip, deleteClip, replaceClip, deleteMovie, updateMovie, reorderClips, UploadProgress } from '@/lib/api';

interface Clip {
    id: string;
    videoUrl: string;
    sequence: number;
    duration: number;
}

interface Movie {
    id: string;
    title: string;
    description: string;
    genre: string;
    thumbnailUrl: string;
    heroUrl: string;
    trailerUrl: string;
    createdAt: string;
    clips: Clip[];
}

export default function MovieDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const router = useRouter();

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editGenre, setEditGenre] = useState('');

    // Drag state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const addClipRef = useRef<HTMLInputElement>(null);
    const replaceClipRef = useRef<HTMLInputElement>(null);
    const replaceClipIdRef = useRef<string | null>(null);

    const fetchMovie = async () => {
        if (!token || !id) return;
        try {
            const data = await getMovie(token, id);
            setMovie(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load movie');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovie();
    }, [token, id]);

    const showSuccess = (msg: string) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    const onProgress = (p: UploadProgress) => setUploadProgress(p.percent);
    const clearProgress = () => setUploadProgress(null);

    // ===== Edit Movie Metadata =====
    const startEditing = () => {
        if (!movie) return;
        setEditTitle(movie.title);
        setEditDescription(movie.description);
        setEditGenre(movie.genre);
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setError('');
    };

    const handleSaveMetadata = async () => {
        if (!token || !id || !movie) return;
        setActionLoading('save');
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('description', editDescription);
            formData.append('genre', editGenre);
            const updated = await updateMovie(token, id, formData);
            setMovie(updated);
            setEditing(false);
            showSuccess('Movie details updated!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update movie');
        } finally {
            setActionLoading(null);
        }
    };

    const handleImageUpload = async (type: 'thumbnail' | 'hero' | 'trailer', file: File) => {
        if (!token || !id) return;
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) { setError('Only JPEG, PNG, and WebP images are allowed'); return; }

        setActionLoading(`upload-${type}`);
        setError('');
        try {
            const formData = new FormData();
            formData.append(type, file);
            const updated = await updateMovie(token, id, formData, onProgress);
            setMovie(updated);
            showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} updated!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to update ${type}`);
        } finally {
            setActionLoading(null);
            clearProgress();
        }
    };

    // ===== Add Clip =====
    const handleAddClip = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !id) return;
        if (file.size > 50 * 1024 * 1024) { setError('File must be under 50MB'); return; }
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!validVideoTypes.includes(file.type)) { setError('Only MP4, WebM, and QuickTime videos are allowed'); return; }

        setActionLoading('add');
        setError('');
        try {
            const formData = new FormData();
            formData.append('clip', file);
            await addClip(token, id, formData, onProgress);
            await fetchMovie();
            showSuccess('Clip added successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add clip');
        } finally {
            setActionLoading(null);
            clearProgress();
            if (addClipRef.current) addClipRef.current.value = '';
        }
    };

    // ===== Delete Clip =====
    const handleDeleteClip = async (clipId: string, sequence: number) => {
        if (!token || !id) return;
        if (!confirm(`Delete clip ${sequence}? Remaining clips will be renumbered.`)) return;
        setActionLoading(`delete-${clipId}`);
        setError('');
        try {
            await deleteClip(token, id, clipId);
            await fetchMovie();
            showSuccess(`Clip ${sequence} deleted and clips renumbered.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete clip');
        } finally {
            setActionLoading(null);
        }
    };

    // ===== Replace Clip =====
    const startReplace = (clipId: string) => {
        replaceClipIdRef.current = clipId;
        replaceClipRef.current?.click();
    };

    const handleReplaceClip = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const clipId = replaceClipIdRef.current;
        if (!file || !token || !id || !clipId) return;
        if (file.size > 50 * 1024 * 1024) { setError('File must be under 50MB'); return; }

        setActionLoading(`replace-${clipId}`);
        setError('');
        try {
            const formData = new FormData();
            formData.append('clip', file);
            await replaceClip(token, id, clipId, formData, onProgress);
            await fetchMovie();
            showSuccess('Clip replaced successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to replace clip');
        } finally {
            setActionLoading(null);
            clearProgress();
            replaceClipIdRef.current = null;
            if (replaceClipRef.current) replaceClipRef.current.value = '';
        }
    };

    // ===== Delete Movie =====
    const handleDeleteMovie = async () => {
        if (!token || !movie) return;
        if (!confirm(`Delete "${movie.title}" permanently? All clips and files will be removed.`)) return;
        setActionLoading('delete-movie');
        try {
            await deleteMovie(token, movie.id);
            router.push('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete movie');
            setActionLoading(null);
        }
    };

    // ===== Drag & Drop Reorder =====
    const handleDragStart = (index: number) => setDragIndex(index);
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };
    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = async (dropIdx: number) => {
        if (dragIndex === null || dragIndex === dropIdx || !movie || !token || !id) {
            handleDragEnd();
            return;
        }

        const sorted = [...movie.clips].sort((a, b) => a.sequence - b.sequence);
        const [moved] = sorted.splice(dragIndex, 1);
        sorted.splice(dropIdx, 0, moved);

        const newClipIds = sorted.map(c => c.id);

        // Optimistic UI update
        const optimistic = sorted.map((c, i) => ({ ...c, sequence: i + 1 }));
        setMovie({ ...movie, clips: optimistic });
        handleDragEnd();

        setActionLoading('reorder');
        try {
            await reorderClips(token, id, newClipIds);
            await fetchMovie();
            showSuccess('Clips reordered!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reorder clips');
            await fetchMovie(); // revert
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Movie not found</p>
            </div>
        );
    }

    const sortedClips = [...movie.clips].sort((a, b) => a.sequence - b.sequence);

    return (
        <div>
            {success && <div className="toast toast-success">{success}</div>}

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
                <div style={{
                    position: 'fixed', top: 0, left: 240, right: 0, zIndex: 100,
                    height: 4, background: 'var(--bg-secondary)',
                }}>
                    <div style={{
                        height: '100%',
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(90deg, #6c5ce7, #a78bfa)',
                        transition: 'width 0.2s ease',
                    }} />
                </div>
            )}

            {/* Hidden file inputs */}
            <input ref={addClipRef} type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: 'none' }} onChange={handleAddClip} />
            <input ref={replaceClipRef} type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: 'none' }} onChange={handleReplaceClip} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <button onClick={() => router.push('/admin')} style={{
                        background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: 13, marginBottom: 8, padding: 0,
                    }}>← Back to Dashboard</button>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{movie.title}</h1>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="badge">{movie.genre}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {movie.clips.length} clip{movie.clips.length !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Created {new Date(movie.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {!editing && (
                        <button className="btn btn-secondary" onClick={startEditing}>✏️ Edit</button>
                    )}
                    <button className="btn btn-danger" onClick={handleDeleteMovie} disabled={actionLoading === 'delete-movie'}>
                        {actionLoading === 'delete-movie' ? <><span className="spinner" /> Deleting...</> : '🗑️ Delete Movie'}
                    </button>
                </div>
            </div>

            {/* Edit Form */}
            {editing && (
                <div className="card" style={{ marginBottom: 24, padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Edit Movie Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Title</label>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Genre</label>
                            <input type="text" value={editGenre} onChange={(e) => setEditGenre(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <button className="btn btn-primary btn-sm" onClick={handleSaveMetadata} disabled={actionLoading === 'save'}>
                                {actionLoading === 'save' ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEditing}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Movie Info Card with Image Upload */}
            <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {movie.thumbnailUrl ? (
                        <img src={movie.thumbnailUrl} alt={movie.title} style={{ width: 120, height: 160, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: 120, height: 160, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>No thumbnail</div>
                    )}
                    <label style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                        {actionLoading === 'upload-thumbnail' ? `Uploading ${uploadProgress ?? 0}%` : 'Replace thumbnail'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                            onChange={(e) => e.target.files?.[0] && handleImageUpload('thumbnail', e.target.files[0])}
                            disabled={actionLoading === 'upload-thumbnail'} />
                    </label>
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
                        {movie.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        {movie.heroUrl ? <span>✅ Hero image</span> : (
                            <label style={{ cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }}>
                                {actionLoading === 'upload-hero' ? `Uploading ${uploadProgress ?? 0}%` : '➕ Add hero image'}
                                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload('hero', e.target.files[0])}
                                    disabled={actionLoading === 'upload-hero'} />
                            </label>
                        )}
                        {movie.trailerUrl ? <span>✅ Trailer</span> : <span>❌ No trailer</span>}
                    </div>
                    {movie.heroUrl && (
                        <div style={{ marginTop: 8 }}>
                            <label style={{ fontSize: 12, cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }}>
                                {actionLoading === 'upload-hero' ? `Uploading ${uploadProgress ?? 0}%` : 'Replace hero image'}
                                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload('hero', e.target.files[0])}
                                    disabled={actionLoading === 'upload-hero'} />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#e74c3c' }}>
                    {error}
                </div>
            )}

            {/* Clips Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                    Clips
                    {actionLoading === 'reorder' && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Saving order...</span>}
                </h2>
                <button className="btn btn-primary btn-sm" onClick={() => addClipRef.current?.click()} disabled={actionLoading === 'add'}>
                    {actionLoading === 'add' ? <><span className="spinner" /> Uploading {uploadProgress ?? 0}%</> : '➕ Add Clip'}
                </button>
            </div>

            {sortedClips.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>No clips yet</p>
                    <button className="btn btn-primary btn-sm" onClick={() => addClipRef.current?.click()}>Upload First Clip</button>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 30 }}></th>
                                <th style={{ width: 60 }}>#</th>
                                <th>Preview</th>
                                <th>Video URL</th>
                                <th style={{ width: 200 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedClips.map((clip, idx) => (
                                <tr
                                    key={clip.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDrop={() => handleDrop(idx)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        opacity: dragIndex === idx ? 0.4 : 1,
                                        background: dragOverIndex === idx ? 'var(--bg-hover)' : undefined,
                                        transition: 'background 0.15s',
                                        cursor: 'grab',
                                    }}
                                >
                                    <td style={{ cursor: 'grab', fontSize: 16, color: 'var(--text-muted)', textAlign: 'center' }}>⠿</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            width: 32, height: 32, borderRadius: 6, background: 'var(--accent)',
                                            color: 'white', fontWeight: 600, fontSize: 14,
                                        }}>{clip.sequence}</span>
                                    </td>
                                    <td>
                                        {clip.videoUrl ? (
                                            <video src={clip.videoUrl.includes('?') ? clip.videoUrl : `${clip.videoUrl}?t=${Date.now()}`}
                                                style={{ width: 80, height: 50, borderRadius: 4, objectFit: 'cover', background: 'var(--bg-secondary)' }} muted />
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all', display: 'block', maxWidth: 300 }}>
                                            {clip.videoUrl ? '.../' + clip.videoUrl.split('/').slice(-2).join('/').split('?')[0] : '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => startReplace(clip.id)} disabled={actionLoading === `replace-${clip.id}`}>
                                                {actionLoading === `replace-${clip.id}` ? <span className="spinner" /> : '🔄 Replace'}
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClip(clip.id, clip.sequence)} disabled={actionLoading === `delete-${clip.id}`}>
                                                {actionLoading === `delete-${clip.id}` ? <span className="spinner" /> : '🗑️'}
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
