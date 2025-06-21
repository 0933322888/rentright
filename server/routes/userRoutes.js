import express from 'express';
import { getProfile, updateProfile, getUser, updateUser, deleteUser, getAllUsers, addComment, getComments } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { updateTenantProfile, getTenantProfile, deleteDocument } from '../controllers/tenantDocumentController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for profile picture uploads (temporary storage before S3)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create temporary directory for file processing
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.put('/profile', upload.single('profilePicture'), updateProfile);

// Tenant profile routes
router.get('/tenant-profile', getTenantProfile);
router.post('/tenant-profile', updateTenantProfile);
router.delete('/tenant-profile/:field/:index', deleteDocument);

// Admin only routes
router.get('/', restrictTo('admin'), getAllUsers);
router.post('/:userId/comments', restrictTo('admin'), addComment);
router.get('/:userId/comments', restrictTo('admin'), getComments);

// User management routes (admin only)
router.get('/:id', restrictTo('admin'), getUser);
router.patch('/:id', restrictTo('admin'), updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

export default router; 