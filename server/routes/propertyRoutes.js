import express from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  applyForProperty,
  updateApplicationStatus,
  getAvailableProperties,
  generatePropertyListing,
  generatePropertyPrice,
  getViewingSlots,
  getViewingDates,
  updatePropertyCommissionStatus,
  uploadPropertyImages,
  uploadImages
} from '../controllers/propertyController.js';
import {
  approveProperty,
  rejectProperty,
  submitForReview
} from '../controllers/adminController.js';
import {
  uploadPropertyDocuments,
  getPropertyDocuments,
  deletePropertyDocument
} from '../controllers/propertyDocumentController.js';
import {
  getPropertyStatistics,
  trackPropertyView,
  trackPropertyClick
} from '../controllers/propertyStatisticsController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for temporary file storage (before S3 upload)
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

// Public routes
router.get('/', getProperties);
router.get('/available', getAvailableProperties);
router.get('/:id', getPropertyById);
router.get('/:id/viewing-dates', getViewingDates);
router.get('/:id/viewing-slots', getViewingSlots);
router.post('/:id/view', trackPropertyView); // Track property views
router.post('/:id/click', trackPropertyClick); // Track property clicks

// Protected routes
router.use(protect);

// Property management routes
router.post('/', restrictTo('landlord', 'admin'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), createProperty);

router.put('/:id', restrictTo('landlord', 'admin'), upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), updateProperty);

// New route for JSON updates (no file upload)
router.patch('/:id', restrictTo('landlord', 'admin'), updateProperty);

router.delete('/:id', restrictTo('landlord', 'admin'), deleteProperty);

// Application routes
router.post('/:id/apply', restrictTo('tenant'), applyForProperty);
router.put('/:propertyId/applications/:applicationId/status', restrictTo('landlord'), updateApplicationStatus);

// Property document routes
router.post('/:propertyId/documents', restrictTo('landlord', 'admin'), upload.fields([
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'governmentId', maxCount: 1 },
  { name: 'condoBoardRules', maxCount: 1 },
  { name: 'utilityBills', maxCount: 5 }
]), uploadPropertyDocuments);

router.get('/:propertyId/documents', restrictTo('landlord', 'admin'), getPropertyDocuments);
router.delete('/:propertyId/documents/:field/:documentId', restrictTo('landlord', 'admin'), deletePropertyDocument);
// router.put('/:id/documents', restrictTo('landlord', 'admin'), updatePropertyDocuments); // TODO: Implement this function

// AI Generation route
router.post('/generate-listing', restrictTo('landlord'), generatePropertyListing);
router.post('/generate-price', protect, restrictTo('landlord'), generatePropertyPrice);

// Property statistics routes
router.get('/:id/statistics', restrictTo('landlord', 'admin'), getPropertyStatistics);
// AI Generation routes
router.post('/generate-listing', protect, restrictTo('landlord'), generatePropertyListing);
router.post('/generate-price', protect, restrictTo('landlord'), generatePropertyPrice);

// Admin routes
router.post('/:id/submit', restrictTo('landlord'), submitForReview);
router.post('/:id/approve', restrictTo('admin'), approveProperty);
router.post('/:id/reject', restrictTo('admin'), rejectProperty);

// Update property commission status - moved to the end to avoid conflicts
router.patch('/:propertyId/commission', restrictTo('admin'), updatePropertyCommissionStatus);

// New route for JSON property creation (no file upload)
router.post('/json', restrictTo('landlord', 'admin'), createProperty);

router.post('/:id/images', restrictTo('landlord', 'admin'), upload.array('images', 10), uploadPropertyImages);
router.post('/images', restrictTo('landlord', 'admin'), upload.array('images', 10), uploadImages);

export default router; 