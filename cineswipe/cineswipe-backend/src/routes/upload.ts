import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';

const router = Router();

// Use memory storage for Supabase uploads (files stored in buffer, not disk)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

    console.log('🔍 Checking file:', file.originalname, file.mimetype);

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.error('❌ Rejected file type:', file.mimetype);
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// POST /upload
// Upload a single file to Supabase Storage
router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response, next: NextFunction) => {
    console.log('📂 Upload request received');
    console.log('Headers Content-Type:', req.headers['content-type']);

    upload.single('file')(req, res, (err: any) => {
        if (err) {
            console.error('❌ Multer error:', err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req: Request, res: Response): Promise<void> => {
    console.log('✅ Multer processing complete');

    if (!req.file) {
        console.error('❌ No file in req.file');
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = req.file.originalname.split('.').pop() || '';
        const fileName = `${uniqueSuffix}.${ext}`;

        // Determine folder based on file type
        const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';
        const filePath = `${folder}/${fileName}`;

        console.log('📤 Uploading to Supabase Storage:', filePath);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ Supabase upload error:', error);
            res.status(500).json({ error: `Upload failed: ${error.message}` });
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;
        console.log('🎉 Upload successful:', publicUrl);

        res.json({
            url: publicUrl,
            filename: fileName,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
    } catch (err) {
        console.error('❌ Upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
