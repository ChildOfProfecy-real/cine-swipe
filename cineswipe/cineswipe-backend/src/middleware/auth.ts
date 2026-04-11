import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                isAdmin: boolean;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

// Auth middleware — checks Bearer header OR httpOnly cookie
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Try Authorization header first
    let token = req.headers.authorization?.split(' ')[1];

    // Fall back to httpOnly cookie (admin panel)
    if (!token && req.cookies?.admin_token) {
        token = req.cookies.admin_token;
    }

    if (!token) {
        res.status(401).json({ error: 'Authentication required. Please log in.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            id: string;
            email: string;
            isAdmin: boolean;
        };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
};

// Admin middleware — must be used AFTER authMiddleware
export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'Admin access required. Your account does not have admin privileges.' });
        return;
    }
    next();
};
