import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { updateTenantProfile, getTenantProfile, deleteDocument } from '../controllers/tenantDocumentController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve profile pictures
router.use('/uploads/profile-pictures', express.static(path.join(__dirname, '../uploads/profile-pictures')));

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Tenant profile routes
router.get('/tenant-profile', protect, getTenantProfile);
router.post('/tenant-profile', protect, updateTenantProfile);
router.delete('/tenant-profile/:field/:index', protect, deleteDocument);

export default router; 