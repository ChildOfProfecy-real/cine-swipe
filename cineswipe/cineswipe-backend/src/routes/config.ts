import { Router } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

const router = Router();

// Default values if not present in DB
const DEFAULT_CONFIG = {
    FREE_CLIP_LIMIT: '7'
};

// GET /config
router.get('/', async (req, res) => {
    try {
        const configs = await prisma.appConfig.findMany();
        
        // Merge with defaults
        const configMap: Record<string, string> = { ...DEFAULT_CONFIG };
        configs.forEach(c => {
            configMap[c.key] = c.value;
        });

        res.json(configMap);
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch config');
        // Return defaults on error
        res.json(DEFAULT_CONFIG);
    }
});

export default router;
