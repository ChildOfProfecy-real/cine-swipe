import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// GET /movies - List movies with pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const genre = req.query.genre as string | undefined;
        const search = req.query.search as string | undefined;

        const where: any = {};
        if (genre) where.genre = genre;
        if (search) where.title = { contains: search, mode: 'insensitive' };

        const [movies, totalCount] = await Promise.all([
            prisma.movie.findMany({
                where,
                include: {
                    clips: { orderBy: { sequence: 'asc' } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.movie.count({ where }),
        ]);

        res.json({
            movies,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        });
    } catch (error) {
        logger.error({ err: error }, 'Get movies error');
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// GET /movies/:id - Get single movie with clips and comments
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const movie = await prisma.movie.findUnique({
            where: { id },
            include: {
                clips: { orderBy: { sequence: 'asc' } },
                comments: {
                    include: {
                        user: { select: { id: true, name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        res.json(movie);
    } catch (error) {
        logger.error({ err: error }, 'Get movie error');
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
});

// Helper to escape HTML characters for XSS prevention
const escapeHtml = (text: string): string => {
    return text.replace(/[<>&"']/g, char => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
    }[char] || char));
};

// POST /movies/:id/comments - Add comment (authenticated users)
router.post('/:id/comments', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const movieId = req.params.id as string;
        const userId = req.user!.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            res.status(400).json({ error: 'Comment content is required' });
            return;
        }

        const movie = await prisma.movie.findUnique({ where: { id: movieId } });
        if (!movie) {
            res.status(404).json({ error: 'Movie not found' });
            return;
        }

        const sanitizedContent = escapeHtml(content.trim());

        const comment = await prisma.comment.create({
            data: { userId, movieId, content: sanitizedContent },
            include: { user: { select: { id: true, name: true } } }
        });

        res.status(201).json(comment);
    } catch (error) {
        logger.error({ err: error }, 'Add comment error');
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

export default router;
