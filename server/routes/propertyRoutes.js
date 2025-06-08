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
import {
  uploadPropertyDocuments,
  getPropertyDocuments,
  deletePropertyDocument
} from '../controllers/propertyDocumentController.js';
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
router.post('/', protect, restrictTo('landlord'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), createProperty);

router.put('/:id', protect, restrictTo('landlord'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), updateProperty);

router.delete('/:id', protect, restrictTo('landlord'), deleteProperty);

// Application routes
router.post('/:id/apply', protect, restrictTo('tenant'), applyForProperty);
router.put('/:propertyId/applications/:applicationId/status', protect, restrictTo('landlord'), updateApplicationStatus);

// Property document routes
router.post('/:propertyId/documents', protect, restrictTo('landlord'), upload.fields([
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), uploadPropertyDocuments);

router.get('/:propertyId/documents', protect, getPropertyDocuments);
router.delete('/:propertyId/documents/:field/:documentId', protect, restrictTo('landlord'), deletePropertyDocument);

export default router; 