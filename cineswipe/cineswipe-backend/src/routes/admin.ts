import { Router, Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import multer from 'multer';
import os from 'os';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
    uploadMovieFile,
    uploadClipFile,
    deleteMovieFolder,
    deleteClipFile,
    moveClipFile,
} from '../lib/storage';

const router = Router();

// All admin routes require auth + admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Multer config — disk storage (streams to temp dir, avoids OOM)
const upload = multer({
    storage: multer.diskStorage({
        destination: os.tmpdir(),
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `cineswipe-${uniqueSuffix}-${file.originalname}`);
        },
    }),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/webm',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
});

// Helper: wrap multer errors
function handleMulterUpload(fields: multer.Field[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        upload.fields(fields)(req, res, (err: any) => {
            if (err) {
                logger.error({ err }, '');
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    };
}

// Helper: build file object for storage.ts from multer disk file
function toStorageFile(file: Express.Multer.File) {
    return { path: file.path, mimetype: file.mimetype };
}

// ============== GET /admin/stats ==============
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const [totalMovies, totalUsers, totalClips, totalLikes, totalWatchlist, activeSubscribers, pastDueSubscribers, paymentSms, paywallBounces] = await Promise.all([
            prisma.movie.count(),
            prisma.user.count(),
            prisma.clip.count(),
            prisma.userList.count({ where: { type: 'LIKED' } }),
            prisma.userList.count({ where: { type: 'WATCH_LATER' } }),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.subscription.count({ where: { status: 'PAST_DUE' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'PAID' }
            }),
            prisma.watchProgress.count({
                where: {
                    clip: { sequence: { in: [6, 7] } },
                    user: { subscription: { status: 'FREE' } }
                }
            })
        ]);

        const totalRevenue = (paymentSms._sum.amount || 0) / 100; // Convert paise to rupees

        // Top 5 most-liked movies
        const topLikedRaw = await prisma.userList.groupBy({
            by: ['movieId'],
            where: { type: 'LIKED' },
            _count: { movieId: true },
            orderBy: { _count: { movieId: 'desc' } },
            take: 5,
        });

        const topLikedMovieIds = topLikedRaw.map(r => r.movieId);
        const topLikedMovies = await prisma.movie.findMany({
            where: { id: { in: topLikedMovieIds } },
            select: { id: true, title: true, genre: true },
        });

        const topLiked = topLikedRaw.map(r => {
            const movie = topLikedMovies.find(m => m.id === r.movieId);
            return {
                movieId: r.movieId,
                title: movie?.title || 'Unknown',
                genre: movie?.genre || '',
                likeCount: r._count.movieId,
            };
        });

        // Last 10 signups
        const recentUsers = await prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        // Last 5 payments
        const recentPayments = await prisma.payment.findMany({
            where: { status: 'PAID' },
            select: {
                id: true,
                amount: true,
                createdAt: true,
                user: { select: { email: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        res.json({
            totalMovies,
            totalUsers,
            totalClips,
            totalLikes,
            totalWatchlist,
            topLiked,
            recentUsers,
            totalRevenue,
            activeSubscribers,
            pastDueSubscribers,
            paywallBounces,
            recentPayments
        });
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ============== POST /admin/movies ==============
router.post(
    '/movies',
    handleMulterUpload([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'hero', maxCount: 1 },
        { name: 'trailer', maxCount: 1 },
        { name: 'clip', maxCount: 1 },
    ]),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { title, description, genre, duration } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!title || !genre) {
                res.status(400).json({ error: 'title and genre are required' });
                return;
            }
            if (!files?.clip?.[0]) {
                res.status(400).json({ error: 'First clip file is required' });
                return;
            }

            // Parse duration (seconds) — default to 0 if not provided
            const clipDuration = parseInt(duration) || 0;

            // 1. Create movie in DB to get the ID
            const movie = await prisma.movie.create({
                data: {
                    title,
                    description: description || '',
                    genre,
                    thumbnailUrl: '',
                    heroUrl: '',
                    trailerUrl: '',
                },
            });

            logger.info('Action completed');

            // 2. Upload files to structured storage
            let thumbnailUrl = '';
            let heroUrl = '';
            let trailerUrl = '';

            if (files.thumbnail?.[0]) {
                thumbnailUrl = await uploadMovieFile(movie.id, 'thumbnail', toStorageFile(files.thumbnail[0]));
                logger.info('Action completed');
            }

            if (files.hero?.[0]) {
                heroUrl = await uploadMovieFile(movie.id, 'hero', toStorageFile(files.hero[0]));
                logger.info('Action completed');
            }

            if (files.trailer?.[0]) {
                trailerUrl = await uploadMovieFile(movie.id, 'trailer', toStorageFile(files.trailer[0]));
                logger.info('Action completed');
            }

            // 3. Upload first clip
            const clipUrl = await uploadClipFile(movie.id, 1, toStorageFile(files.clip[0]));
            logger.info('Action completed');

            // 4. Update movie with URLs + create clip row
            const updatedMovie = await prisma.$transaction(async (tx) => {
                await tx.movie.update({
                    where: { id: movie.id },
                    data: { thumbnailUrl, heroUrl, trailerUrl },
                });

                await tx.clip.create({
                    data: {
                        movieId: movie.id,
                        videoUrl: clipUrl,
                        sequence: 1,
                        duration: clipDuration,
                    },
                });

                return tx.movie.findUnique({
                    where: { id: movie.id },
                    include: { clips: { orderBy: { sequence: 'asc' } } },
                });
            });

            logger.info('Action completed');
            res.status(201).json(updatedMovie);
        } catch (error) {
            logger.error({ err: error }, '');
            res.status(500).json({ error: 'Failed to create movie' });
        }
    }
);

// ============== POST /admin/movies/:id/clips ==============
router.post(
    '/movies/:id/clips',
    handleMulterUpload([{ name: 'clip', maxCount: 1 }]),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const movieId = req.params.id as string;
            const { duration } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files?.clip?.[0]) {
                res.status(400).json({ error: 'Clip file is required' });
                return;
            }

            const movie = await prisma.movie.findUnique({ where: { id: movieId } });
            if (!movie) {
                res.status(404).json({ error: 'Movie not found' });
                return;
            }

            const clipDuration = parseInt(duration) || 0;

            // Find max sequence
            const lastClip = await prisma.clip.findFirst({
                where: { movieId },
                orderBy: { sequence: 'desc' },
            });
            const newSequence = lastClip ? lastClip.sequence + 1 : 1;

            // Upload clip
            const clipUrl = await uploadClipFile(movieId, newSequence, toStorageFile(files.clip[0]));

            // Create DB record
            const clip = await prisma.clip.create({
                data: {
                    movieId,
                    videoUrl: clipUrl,
                    sequence: newSequence,
                    duration: clipDuration,
                },
            });

            logger.info({ clipId: clip.id }, 'Clip added');
            res.status(201).json(clip);
        } catch (error) {
            logger.error({ err: error }, '');
            res.status(500).json({ error: 'Failed to add clip' });
        }
    }
);

// ============== DELETE /admin/movies/:id ==============
router.delete('/movies/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = req.params.id as string;

        const movie = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        // Delete all storage files (non-fatal — DB is source of truth)
        try {
            await deleteMovieFolder(movieId);
            logger.info({ movieId }, 'Movie folder deleted from storage');
        } catch (err) {
            logger.warn({ err }, 'Failed to delete movie folder from storage');
        }

        // Delete from DB (cascade handles clips, comments, etc.)
        await prisma.movie.delete({ where: { id: movieId } });

        logger.info({ movieId }, 'Movie deleted');
        res.json({ message: 'Movie deleted successfully' });
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to delete movie' });
    }
});

// ============== DELETE /admin/movies/:id/clips/:clipId ==============
router.delete(
    '/movies/:id/clips/:clipId',
    async (req: Request, res: Response): Promise<void> => {
        try {
            const movieId = req.params.id as string;
            const clipId = req.params.clipId as string;

            const clipToDelete = await prisma.clip.findUnique({
                where: { id: clipId },
            });

            if (!clipToDelete || clipToDelete.movieId !== movieId) {
                res.status(404).json({ error: 'Clip not found' });
                return;
            }

            // Prevent deleting the last clip
            const clipCount = await prisma.clip.count({ where: { movieId } });
            if (clipCount <= 1) {
                res.status(400).json({ error: 'Cannot delete the last clip. Delete the movie instead.' });
                return;
            }

            const deletedSequence = clipToDelete.sequence;

            // 1. Try to delete file from storage (non-fatal)
            try {
                await deleteClipFile(movieId, deletedSequence);
            } catch (err) {
                logger.warn({ err }, 'Failed to delete clip file');
            }

            // 2. Delete DB record + renumber in a transaction
            await prisma.$transaction(async (tx) => {
                await tx.clip.delete({ where: { id: clipId } });

                const remaining = await tx.clip.findMany({
                    where: { movieId },
                    orderBy: { sequence: 'asc' },
                });

                for (let i = 0; i < remaining.length; i++) {
                    const clip = remaining[i];
                    const newSeq = i + 1;

                    if (clip.sequence !== newSeq) {
                        let newUrl = clip.videoUrl;
                        try {
                            newUrl = await moveClipFile(movieId, clip.sequence, newSeq);
                        } catch (err) {
                            logger.warn({ err }, 'Failed to move clip file');
                        }

                        await tx.clip.update({
                            where: { id: clip.id },
                            data: { sequence: newSeq, videoUrl: newUrl },
                        });

                        logger.info({ clipId: clip.id, newSeq }, 'Clip renumbered');
                    }
                }
            });

            logger.info({ clipId, movieId }, 'Clip deleted');
            res.json({ message: 'Clip deleted and renumbered' });
        } catch (error) {
            logger.error({ err: error }, '');
            res.status(500).json({ error: 'Failed to delete clip' });
        }
    }
);

// ============== PUT /admin/movies/:id/clips/:clipId ==============
router.put(
    '/movies/:id/clips/:clipId',
    handleMulterUpload([{ name: 'clip', maxCount: 1 }]),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const movieId = req.params.id as string;
            const clipId = req.params.clipId as string;
            const { duration } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files?.clip?.[0]) {
                res.status(400).json({ error: 'Clip file is required' });
                return;
            }

            const existingClip = await prisma.clip.findUnique({
                where: { id: clipId },
            });

            if (!existingClip || existingClip.movieId !== movieId) {
                res.status(404).json({ error: 'Clip not found' });
                return;
            }

            // Try to delete old file first
            try {
                await deleteClipFile(movieId, existingClip.sequence);
            } catch (err) {
                logger.warn({ err }, 'Failed to delete old clip file');
            }

            // Upload new file
            const rawUrl = await uploadClipFile(movieId, existingClip.sequence, toStorageFile(files.clip[0]));

            // Cache-busting param
            const newUrl = `${rawUrl}?v=${Date.now()}`;

            // Update DB with new URL and optional duration
            const updateData: any = { videoUrl: newUrl };
            if (duration !== undefined) {
                updateData.duration = parseInt(duration) || 0;
            }

            const updatedClip = await prisma.clip.update({
                where: { id: clipId },
                data: updateData,
            });

            logger.info({ clipId }, 'Clip updated');
            res.json(updatedClip);
        } catch (error) {
            logger.error({ err: error }, '');
            res.status(500).json({ error: 'Failed to replace clip' });
        }
    }
);

// ============== PUT /admin/movies/:id ==============
router.put(
    '/movies/:id',
    handleMulterUpload([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'hero', maxCount: 1 },
        { name: 'trailer', maxCount: 1 },
    ]),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const movieId = req.params.id as string;
            const { title, description, genre } = req.body;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            const movie = await prisma.movie.findUnique({ where: { id: movieId } });
            if (!movie) {
                res.status(404).json({ error: 'Movie not found' });
                return;
            }

            // Build update data from provided fields only
            const updateData: any = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (genre !== undefined) updateData.genre = genre;

            // Upload new images if provided
            if (files?.thumbnail?.[0]) {
                updateData.thumbnailUrl = await uploadMovieFile(movieId, 'thumbnail', toStorageFile(files.thumbnail[0]));
                logger.info('Thumbnail updated');
            }
            if (files?.hero?.[0]) {
                updateData.heroUrl = await uploadMovieFile(movieId, 'hero', toStorageFile(files.hero[0]));
                logger.info('Hero updated');
            }
            if (files?.trailer?.[0]) {
                updateData.trailerUrl = await uploadMovieFile(movieId, 'trailer', toStorageFile(files.trailer[0]));
                logger.info('Trailer updated');
            }

            const updatedMovie = await prisma.movie.update({
                where: { id: movieId },
                data: updateData,
                include: { clips: { orderBy: { sequence: 'asc' } } },
            });

            logger.info({ movieId }, 'Movie updated');
            res.json(updatedMovie);
        } catch (error) {
            logger.error({ err: error }, '');
            res.status(500).json({ error: 'Failed to update movie' });
        }
    }
);

// ============== GET /admin/users ==============
router.get('/users', async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                subscription: {
                    select: {
                        status: true,
                        currentPeriodEnd: true,
                    },
                },
                _count: {
                    select: {
                        lists: true,
                        comments: true,
                        watchProgress: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(users);
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ============== DELETE /admin/users/:id ==============
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;

        // Prevent self-deletion
        if (userId === req.user!.id) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Cascade delete handles lists, comments, watchProgress
        await prisma.user.delete({ where: { id: userId } });

        logger.info({ userId }, 'User deleted');
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============== PATCH /admin/users/:id/role ==============
router.patch('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;

        // Prevent self-demotion
        if (userId === req.user!.id) {
            res.status(400).json({ error: 'Cannot change your own admin status' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isAdmin: !user.isAdmin },
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
            },
        });

        logger.info('Action completed');
        res.json(updatedUser);
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// ============== PUT /admin/movies/:id/clips/reorder ==============
router.put('/movies/:id/clips/reorder', async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = req.params.id as string;
        const { clipIds } = req.body as { clipIds: string[] };

        if (!Array.isArray(clipIds) || clipIds.length === 0) {
            res.status(400).json({ error: 'clipIds array is required' });
            return;
        }

        const movie = await prisma.movie.findUnique({
            where: { id: movieId },
            include: { clips: true },
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        // Verify all clipIds belong to this movie
        const movieClipIds = new Set(movie.clips.map(c => c.id));
        for (const cid of clipIds) {
            if (!movieClipIds.has(cid)) {
                res.status(400).json({ error: `Clip ${cid} does not belong to this movie` });
                return;
            }
        }

        // Build a map of old sequences for file moves
        const oldSequenceMap = new Map(movie.clips.map(c => [c.id, c.sequence]));

        // Use a temporary high sequence to avoid unique constraint conflicts during renumber
        const tempOffset = 10000;

        await prisma.$transaction(async (tx) => {
            // Step 1: move all to temp sequences to avoid unique conflicts
            for (let i = 0; i < clipIds.length; i++) {
                await tx.clip.update({
                    where: { id: clipIds[i] },
                    data: { sequence: tempOffset + i + 1 },
                });
            }
            // Step 2: set final sequences
            for (let i = 0; i < clipIds.length; i++) {
                await tx.clip.update({
                    where: { id: clipIds[i] },
                    data: { sequence: i + 1 },
                });
            }
        });

        // Move storage files to match new sequences
        for (let i = 0; i < clipIds.length; i++) {
            const oldSeq = oldSequenceMap.get(clipIds[i])!;
            const newSeq = i + 1;
            if (oldSeq !== newSeq) {
                try {
                    await moveClipFile(movieId, oldSeq, newSeq);
                } catch (err) {
                    logger.warn('Warning');
                }
            }
        }

        const updatedMovie = await prisma.movie.findUnique({
            where: { id: movieId },
            include: { clips: { orderBy: { sequence: 'asc' } } },
        });

        logger.info('Action completed');
        res.json(updatedMovie);
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to reorder clips' });
    }
});

// ============== PATCH /admin/users/:id/subscription ==============
router.patch('/users/:id/subscription', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id as string;
        const { status, daysToAdd } = req.body as { status: string; daysToAdd?: number };

        const validStatuses = ['FREE', 'ACTIVE', 'EXPIRED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        let currentPeriodEnd: Date | null = null;
        if (status === 'ACTIVE') {
            currentPeriodEnd = new Date();
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + (daysToAdd || 30));
        }

        await prisma.subscription.upsert({
            where: { userId },
            update: { status, currentPeriodEnd },
            create: { userId, status, currentPeriodEnd },
        });

        logger.info('Action completed');
        res.json({ success: true, status, currentPeriodEnd });
    } catch (error) {
        logger.error({ err: error }, '');
        res.status(500).json({ error: 'Failed to update subscription' });
    }
});

export default router;
