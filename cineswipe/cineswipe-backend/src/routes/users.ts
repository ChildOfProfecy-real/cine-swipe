import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /users/me - Get current user profile
router.get('/me', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                isAdmin: true,
                createdAt: true,
                _count: {
                    select: {
                        lists: true,
                        comments: true
                    }
                }
            }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET /users/me/likes - Get liked movies
router.get('/me/likes', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const likedMovies = await prisma.userList.findMany({
            where: {
                userId,
                type: 'LIKED'
            },
            include: {
                movie: {
                    include: {
                        clips: {
                            orderBy: { sequence: 'asc' }
                        }
                    }
                }
            }
        });

        // Return just the movies array
        const movies = likedMovies.map(item => item.movie);
        res.json(movies);
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ error: 'Failed to fetch liked movies' });
    }
});

// POST /users/me/likes/:movieId - Toggle like on movie
router.post('/me/likes/:movieId', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const movieId = req.params.movieId as string;

        // Check if movie exists
        const movie = await prisma.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        // Check if already liked
        const existingLike = await prisma.userList.findUnique({
            where: {
                userId_movieId_type: {
                    userId,
                    movieId,
                    type: 'LIKED'
                }
            }
        });

        if (existingLike) {
            // Unlike - remove from list
            await prisma.userList.delete({
                where: { id: existingLike.id }
            });
            res.json({ liked: false, message: 'Movie removed from likes' });
        } else {
            // Like - add to list
            await prisma.userList.create({
                data: {
                    userId,
                    movieId,
                    type: 'LIKED'
                }
            });
            res.json({ liked: true, message: 'Movie added to likes' });
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// GET /users/me/watchlist - Get watch later list
router.get('/me/watchlist', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const watchlist = await prisma.userList.findMany({
            where: {
                userId,
                type: 'WATCH_LATER'
            },
            include: {
                movie: {
                    include: {
                        clips: {
                            orderBy: { sequence: 'asc' }
                        }
                    }
                }
            }
        });

        // Return just the movies array
        const movies = watchlist.map(item => item.movie);
        res.json(movies);
    } catch (error) {
        console.error('Get watchlist error:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// POST /users/me/watchlist/:movieId - Toggle watch later
router.post('/me/watchlist/:movieId', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const movieId = req.params.movieId as string;

        // Check if movie exists
        const movie = await prisma.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        // Check if already in watchlist
        const existingEntry = await prisma.userList.findUnique({
            where: {
                userId_movieId_type: {
                    userId,
                    movieId,
                    type: 'WATCH_LATER'
                }
            }
        });

        if (existingEntry) {
            // Remove from watchlist
            await prisma.userList.delete({
                where: { id: existingEntry.id }
            });
            res.json({ inWatchlist: false, message: 'Movie removed from watchlist' });
        } else {
            // Add to watchlist
            await prisma.userList.create({
                data: {
                    userId,
                    movieId,
                    type: 'WATCH_LATER'
                }
            });
            res.json({ inWatchlist: true, message: 'Movie added to watchlist' });
        }
    } catch (error) {
        console.error('Toggle watchlist error:', error);
        res.status(500).json({ error: 'Failed to toggle watchlist' });
    }
});

// GET /users/me/status/:movieId - Check like/watchlist status for a movie
router.get('/me/status/:movieId', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const movieId = req.params.movieId as string;

        const [liked, inWatchlist] = await Promise.all([
            prisma.userList.findUnique({
                where: {
                    userId_movieId_type: {
                        userId,
                        movieId,
                        type: 'LIKED'
                    }
                }
            }),
            prisma.userList.findUnique({
                where: {
                    userId_movieId_type: {
                        userId,
                        movieId,
                        type: 'WATCH_LATER'
                    }
                }
            })
        ]);

        res.json({
            movieId,
            liked: !!liked,
            inWatchlist: !!inWatchlist
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// ============== Continue Watching ==============

// POST /users/me/progress - Save watch progress
router.post('/me/progress', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { movieId, clipId, timestamp } = req.body;

        if (!movieId || timestamp === undefined || timestamp === null) {
            res.status(400).json({ error: 'movieId and timestamp are required' });
            return;
        }

        const parsedTimestamp = typeof timestamp === 'number' ? timestamp : parseFloat(timestamp);
        if (isNaN(parsedTimestamp)) {
            res.status(400).json({ error: 'timestamp must be a valid number' });
            return;
        }

        // Upsert watch progress
        const progress = await prisma.watchProgress.upsert({
            where: {
                userId_movieId: { userId, movieId }
            },
            update: {
                clipId: clipId || null,
                timestamp: parsedTimestamp,
                updatedAt: new Date()
            },
            create: {
                userId,
                movieId,
                clipId: clipId || null,
                timestamp: parsedTimestamp
            }
        });

        res.json({ success: true, progress });
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// GET /users/me/continue-watching - Get movies with saved progress
router.get('/me/continue-watching', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const progressList = await prisma.watchProgress.findMany({
            where: { userId },
            include: {
                movie: {
                    include: {
                        clips: {
                            orderBy: { sequence: 'asc' }
                        }
                    }
                },
                clip: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 10 // Limit to 10 most recent
        });

        // Format response with progress data embedded
        const result = progressList.map(p => ({
            ...p.movie,
            watchProgress: {
                clipId: p.clipId,
                timestamp: p.timestamp,
                updatedAt: p.updatedAt
            }
        }));

        res.json(result);
    } catch (error) {
        console.error('Get continue watching error:', error);
        res.status(500).json({ error: 'Failed to fetch continue watching' });
    }
});

// DELETE /users/me/progress/:movieId - Clear progress for a movie
router.delete('/me/progress/:movieId', async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const movieId = req.params.movieId as string;

        await prisma.watchProgress.deleteMany({
            where: { userId, movieId }
        });

        res.json({ success: true, message: 'Progress cleared' });
    } catch (error) {
        console.error('Clear progress error:', error);
        res.status(500).json({ error: 'Failed to clear progress' });
    }
});

export default router;
