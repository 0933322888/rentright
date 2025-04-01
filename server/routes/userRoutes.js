import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import fileUpload from 'express-fileupload';
import { updateTenantProfile, getTenantProfile, deleteDocument } from '../controllers/tenantDocumentController.js';

const router = express.Router();

// Configure file upload
router.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true,
  parseNested: true,
  safeFileNames: false // Disable safe file names to preserve extensions
}));

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Tenant profile routes
router.get('/tenant-profile', protect, getTenantProfile);
router.post('/tenant-profile', protect, updateTenantProfile);
router.delete('/tenant-profile/:field', protect, deleteDocument);

export default router; 