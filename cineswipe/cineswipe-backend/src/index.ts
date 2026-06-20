import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import * as Sentry from '@sentry/node';
import logger from './lib/logger';
import { globalErrorHandler, registerProcessHandlers } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Sentry before everything else
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
    });
    logger.info('Sentry initialized successfully');
}

// Register process-level error handlers for uncaught exceptions/rejections
// registerProcessHandlers();

// Import routes
import authRoutes from './routes/auth';
import moviesRoutes from './routes/movies';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import subscriptionRoutes from './routes/subscription';
import configRoutes from './routes/config';

const app = express();
const PORT = process.env.PORT || 3001;

// Security: hide Express fingerprint
app.disable('x-powered-by');

// Security headers: CSP, HSTS, X-Frame-Options, etc.
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API (no HTML served)
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow mobile app to fetch resources
}));

// Structured request logging
app.use(pinoHttp({ logger }));

// CORS — environment-driven origins for production, localhost in dev
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any localhost origin in development
        if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Also allow local network IPs in development (for Expo on physical devices)
        if (process.env.NODE_ENV !== 'production' && /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Allow configured production origins
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.use(express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
        // Capture raw body for webhook signature verification
        req.rawBody = buf.toString();
    },
}));
app.use(cookieParser());

// Rate limiting on auth routes — 5 requests per minute per IP
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'Too many attempts, please try again after 1 minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting on general public routes — 100 requests per minute per IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'Too many requests from this IP, please try again after 1 minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve uploaded files statically (legacy — keep for backward compatibility)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/movies', generalLimiter, moviesRoutes); // Read-only public routes only
app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/config', generalLimiter, configRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'CineSwipe API is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'CineSwipe API',
        version: '2.0.0',
        endpoints: {
            health: 'GET /health',
            auth: {
                login: 'POST /auth/login',
                register: 'POST /auth/register',
            },
            movies: {
                list: 'GET /movies?page=1&limit=20',
                single: 'GET /movies/:id',
            },
            admin: {
                stats: 'GET /admin/stats',
                createMovie: 'POST /admin/movies',
                deleteMovie: 'DELETE /admin/movies/:id',
                addClip: 'POST /admin/movies/:id/clips',
                deleteClip: 'DELETE /admin/movies/:id/clips/:clipId',
                replaceClip: 'PUT /admin/movies/:id/clips/:clipId',
            },
            subscription: {
                status: 'GET /subscription/status',
                create: 'POST /subscription/create',
                verify: 'POST /subscription/verify',
                cancel: 'POST /subscription/cancel',
                webhook: 'POST /subscription/webhook',
            },
            users: {
                profile: 'GET /users/me',
                likes: 'GET /users/me/likes',
                watchlist: 'GET /users/me/watchlist',
            }
        }
    });
});

// Global error handler — catches all unhandled errors in route handlers
app.use(globalErrorHandler);

// Start server
app.listen(PORT as number, '0.0.0.0', () => {
    logger.info(`🚀 CineSwipe API running on port ${PORT} (0.0.0.0)`);
});
