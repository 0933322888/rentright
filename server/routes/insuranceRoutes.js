import express from 'express';
import multer from 'multer';
import {
  getInsuranceDocuments,
  uploadInsuranceDocument,
  deleteInsuranceDocument,
  generateInsuranceSummary,
  downloadInsuranceDocument
} from '../controllers/insuranceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Apply authentication middleware to all routes
router.use(protect);

// Get insurance documents for an application
router.get('/:applicationId', getInsuranceDocuments);

// Upload insurance document
router.post('/:applicationId/upload', upload.single('document'), uploadInsuranceDocument);

// Delete insurance document
router.delete('/:applicationId/:documentId', deleteInsuranceDocument);

// Generate AI summary of insurance documents
router.post('/:applicationId/generate-summary', generateInsuranceSummary);

// Download insurance document
router.get('/:applicationId/:documentId/download', downloadInsuranceDocument);

export default router; 