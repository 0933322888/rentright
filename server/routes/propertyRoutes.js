import express from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  applyForProperty,
  updateApplicationStatus,
  getAvailableProperties
} from '../controllers/propertyController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Configure multer for file upload
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

// Public routes
router.get('/', getProperties);
router.get('/available', getAvailableProperties);
router.get('/:id', getPropertyById);

// Protected routes
router.use(protect);

// Landlord routes
router.post('/', restrictTo('landlord'), upload.array('images', 5), createProperty);
router.put('/:id', restrictTo('landlord'), upload.array('images', 5), updateProperty);
router.delete('/:id', restrictTo('landlord'), deleteProperty);
router.put('/:propertyId/applications/:applicationId', restrictTo('landlord'), updateApplicationStatus);

// Tenant routes
router.post('/:id/apply', restrictTo('tenant'), applyForProperty);

export default router; 