import express from 'express';
import {
    createApplication,
    getApplications,
    updateApplicationStatus,
    promoteApplication,
    deleteApplication,
    updateApplicationViewing, getPropertyApplications, terminateLease,
    uploadTenantDocument,
    deleteTenantDocument,
    addLeaseAgreementComment,
    updateLeaseAgreementStatus,
    getLeaseAgreementDetails,
    uploadStandardLeaseDocument,
    getLeaseAgreementDocument,
    serveLeaseAgreementFile,
    getMyLease,
    updateLeaseStartDate,
    updateEnvelopeId
} from '../controllers/applicationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for document uploads (temporary storage before S3)
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

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('pdf')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

const router = express.Router();

// Protected routes
router.use(protect);

// Application routes
router.post('/', createApplication);
router.get('/', getApplications);
router.get('/property/:id', getPropertyApplications);
router.delete('/:id', deleteApplication);
router.patch('/:id/promote', promoteApplication);
router.patch('/:id/viewing', updateApplicationViewing);
router.post('/:id/terminate', terminateLease);

// Update application status (landlord only)
router.patch('/:id/status', restrictTo('landlord'), updateApplicationStatus);

// Upload tenant document
router.post('/:applicationId/documents', restrictTo('tenant'), upload.single('document'), uploadTenantDocument);

// Delete tenant document
router.delete('/:applicationId/documents/:documentId', restrictTo('tenant'), deleteTenantDocument);

// Lease Agreement routes
router.get('/:applicationId/lease-agreement', protect, getLeaseAgreementDetails);
router.get('/:applicationId/lease-agreement/document', protect, getLeaseAgreementDocument);
router.get('/:applicationId/lease-agreement/file', protect, serveLeaseAgreementFile);
router.post('/:applicationId/lease-agreement/comments', protect, addLeaseAgreementComment);
router.patch('/:applicationId/lease-agreement/status', protect, updateLeaseAgreementStatus);
router.post('/:applicationId/lease-agreement/document', protect, restrictTo('landlord'), upload.single('document'), uploadStandardLeaseDocument);
router.patch('/:applicationId/lease-agreement/start-date', protect, updateLeaseStartDate);

// DocuSign envelope routes
router.put('/:id/envelope', protect, updateEnvelopeId);

// Get tenant's active lease
router.get('/my-lease', protect, getMyLease);

export default router; 