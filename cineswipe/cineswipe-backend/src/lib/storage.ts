import { supabase, STORAGE_BUCKET } from './supabase';
import fs from 'fs';

/**
 * Structured storage helper for media/movies/{movieId}/... paths.
 * All uploads now accept either Buffer or file path (for disk-based multer).
 */

function getExtension(mimeType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/webm': 'webm',
    };
    return map[mimeType] || 'bin';
}

// Read file content — supports Buffer directly or file path from disk storage
async function getFileContent(file: { buffer?: Buffer; path?: string }): Promise<Buffer> {
    if (file.buffer) return file.buffer;
    if (file.path) return fs.promises.readFile(file.path);
    throw new Error('File has neither buffer nor path');
}

// Clean up temp file from disk storage
async function cleanupTempFile(filePath?: string): Promise<void> {
    if (!filePath) return;
    try {
        await fs.promises.unlink(filePath);
    } catch {
        // Ignore — temp file already cleaned up
    }
}

// Upload thumbnail, hero, or trailer for a movie
export async function uploadMovieFile(
    movieId: string,
    type: 'thumbnail' | 'hero' | 'trailer',
    file: { buffer?: Buffer; path?: string; mimetype: string }
): Promise<string> {
    const ext = getExtension(file.mimetype);
    const filePath = `movies/${movieId}/${type}.${ext}`;
    const content = await getFileContent(file);

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, content, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: true,
        });

    await cleanupTempFile(file.path);
    if (error) throw new Error(`Upload ${type} failed: ${error.message}`);

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// Upload a clip file → media/movies/{movieId}/clips/clip{sequence}.mp4
export async function uploadClipFile(
    movieId: string,
    sequence: number,
    file: { buffer?: Buffer; path?: string; mimetype: string }
): Promise<string> {
    const filePath = `movies/${movieId}/clips/clip${sequence}.mp4`;
    const content = await getFileContent(file);

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, content, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: true,
        });

    await cleanupTempFile(file.path);
    if (error) throw new Error(`Upload clip failed: ${error.message}`);

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// Delete entire movie folder (all files for that movie)
export async function deleteMovieFolder(movieId: string): Promise<void> {
    const basePath = `movies/${movieId}`;

    // List root files (thumbnail, hero, trailer)
    const { data: rootFiles } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(basePath, { limit: 100 });

    const rootPaths = (rootFiles || [])
        .filter(f => f.name && !f.id?.includes('/'))
        .map(f => `${basePath}/${f.name}`);

    if (rootPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(rootPaths);
    }

    // List and delete clip files
    const { data: clipFiles } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`${basePath}/clips`, { limit: 100 });

    const clipPaths = (clipFiles || [])
        .filter(f => f.name)
        .map(f => `${basePath}/clips/${f.name}`);

    if (clipPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(clipPaths);
    }

    // Also clean up legacy flat paths (pre-Phase 2)
    await cleanupLegacyFiles(movieId);
}

// Delete a single clip file (non-fatal — logs warning on failure)
export async function deleteClipFile(movieId: string, sequence: number): Promise<void> {
    const filePath = `movies/${movieId}/clips/clip${sequence}.mp4`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    if (error) {
        console.warn(`⚠️ deleteClipFile failed (${filePath}):`, error.message);
    }
}

// Rename/move a clip file (for renumbering)
export async function moveClipFile(
    movieId: string,
    oldSequence: number,
    newSequence: number
): Promise<string> {
    const oldPath = `movies/${movieId}/clips/clip${oldSequence}.mp4`;
    const newPath = `movies/${movieId}/clips/clip${newSequence}.mp4`;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .move(oldPath, newPath);

    if (error) throw new Error(`Move clip failed: ${error.message}`);

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(newPath);
    return data.publicUrl;
}

// Clean up legacy flat-path files from pre-Phase 2 uploads
async function cleanupLegacyFiles(movieId: string): Promise<void> {
    try {
        // Legacy paths looked like: videos/{uuid}.mp4, images/{uuid}.jpg
        // We can't know the exact filenames without querying clips first,
        // but cascade delete already cleaned up the DB records.
        // This is a best-effort cleanup — log a note for manual review.
        console.log(`ℹ️ Legacy file cleanup for movie ${movieId}: check 'videos/' and 'images/' buckets if orphans exist.`);
    } catch {
        // Non-fatal
    }
}
