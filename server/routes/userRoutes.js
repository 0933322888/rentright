import express from 'express';
import { getProfile, updateProfile, getUser, updateUser, deleteUser, getAllUsers, addComment, getComments } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { updateTenantProfile, getTenantProfile, deleteDocument } from '../controllers/tenantDocumentController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/tenant-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for tenant document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve profile pictures
router.use('/uploads/profile-pictures', express.static(path.join(__dirname, '../uploads/profile-pictures')));

// Serve tenant documents
router.use('/uploads/tenant-documents', express.static(path.join(__dirname, '../uploads/tenant-documents')));

// Protected routes (require authentication)
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Tenant profile routes
router.get('/tenant-profile', getTenantProfile);
router.post('/tenant-profile', upload.fields([
  { name: 'proofOfIdentity', maxCount: 5 },
  { name: 'proofOfIncome', maxCount: 5 },
  { name: 'creditHistory', maxCount: 5 },
  { name: 'rentalHistory', maxCount: 5 },
  { name: 'additionalDocuments', maxCount: 5 }
]), updateTenantProfile);
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