import express from 'express';
import { getProfile, updateProfile, getUser, updateUser, deleteUser, getAllUsers, addComment, getComments } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { updateTenantProfile, getTenantProfile, deleteDocument } from '../controllers/tenantDocumentController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve profile pictures
router.use('/uploads/profile-pictures', express.static(path.join(__dirname, '../uploads/profile-pictures')));

// Protected routes (require authentication)
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

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