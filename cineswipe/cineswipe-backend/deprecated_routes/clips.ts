import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// GET /:movieId/clips - Get clips for a movie (mounted at /movies)
router.get('/:movieId/clips', async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = req.params.movieId as string;

        // Check if movie exists
        const movie = await prisma.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        const clips = await prisma.clip.findMany({
            where: { movieId },
            orderBy: { sequence: 'asc' }
        });

        res.json(clips);
    } catch (error) {
        logger.error({ err: error }, 'Get clips error');
        res.status(500).json({ error: 'Failed to fetch clips' });
    }
});

// POST /:movieId/clips - Add clip to movie (admin only, mounted at /movies)
router.post('/:movieId/clips', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = req.params.movieId as string;
        const { videoUrl, sequence, duration } = req.body;

        // Check if movie exists
        const movie = await prisma.movie.findUnique({
            where: { id: movieId }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        // Validation
        if (!videoUrl) {
            res.status(400).json({ error: 'videoUrl is required' });
            return;
        }

        // If sequence not provided, add to end
        let clipSequence = sequence;
        if (!clipSequence) {
            const lastClip = await prisma.clip.findFirst({
                where: { movieId },
                orderBy: { sequence: 'desc' }
            });
            clipSequence = lastClip ? lastClip.sequence + 1 : 1;
        }

        const clip = await prisma.clip.create({
            data: {
                movieId,
                videoUrl,
                sequence: clipSequence,
                duration: duration || 0
            }
        });

        res.status(201).json(clip);
    } catch (error) {
        logger.error({ err: error }, 'Create clip error');
        res.status(500).json({ error: 'Failed to create clip' });
    }
});

// DELETE /clips/:id - Delete a clip (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        // Check if clip exists
        const existingClip = await prisma.clip.findUnique({
            where: { id }
        });

        if (!existingClip) {
            res.status(404).json({ error: 'Clip not found' });
            return;
        }

        await prisma.clip.delete({
            where: { id }
        });

        res.json({ message: 'Clip deleted successfully' });
    } catch (error) {
        logger.error({ err: error }, 'Delete clip error');
        res.status(500).json({ error: 'Failed to delete clip' });
    }
});

// PUT /clips/:id - Update a clip (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { videoUrl, sequence, duration } = req.body;

        // Check if clip exists
        const existingClip = await prisma.clip.findUnique({
            where: { id }
        });

        if (!existingClip) {
            res.status(404).json({ error: 'Clip not found' });
            return;
        }

        const clip = await prisma.clip.update({
            where: { id },
            data: {
                ...(videoUrl && { videoUrl }),
                ...(sequence !== undefined && { sequence }),
                ...(duration !== undefined && { duration })
            }
        });

        res.json(clip);
    } catch (error) {
        logger.error({ err: error }, 'Update clip error');
        res.status(500).json({ error: 'Failed to update clip' });
    }
});

export default router;
