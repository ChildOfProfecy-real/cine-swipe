import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import moviesRoutes from './routes/movies';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import subscriptionRoutes from './routes/subscription';

const app = express();
const PORT = process.env.PORT || 3001;

// Security: hide Express fingerprint
app.disable('x-powered-by');

// Middleware — allow any localhost origin (dynamic port support)
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
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

// Serve uploaded files statically (legacy — keep for backward compatibility)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/movies', moviesRoutes); // Read-only public routes only
app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/subscription', subscriptionRoutes);

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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CineSwipe API running at http://localhost:${PORT}`);
});
