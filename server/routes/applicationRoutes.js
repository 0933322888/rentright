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
    updateLeaseStartDate
} from '../controllers/applicationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import fileUpload from 'express-fileupload';

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
    safeFileNames: false
}));

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
router.post('/:applicationId/documents', restrictTo('tenant'), uploadTenantDocument);

// Delete tenant document
router.delete('/:applicationId/documents/:documentId', restrictTo('tenant'), deleteTenantDocument);

// Lease Agreement routes
router.get('/:applicationId/lease-agreement', protect, getLeaseAgreementDetails);
router.get('/:applicationId/lease-agreement/document', protect, getLeaseAgreementDocument);
router.get('/:applicationId/lease-agreement/file', protect, serveLeaseAgreementFile);
router.post('/:applicationId/lease-agreement/comments', protect, addLeaseAgreementComment);
router.patch('/:applicationId/lease-agreement/status', protect, updateLeaseAgreementStatus);
router.post('/:applicationId/lease-agreement/document', protect, restrictTo('landlord'), uploadStandardLeaseDocument);
router.patch('/:applicationId/lease-agreement/start-date', protect, updateLeaseStartDate);

// Get tenant's active lease
router.get('/my-lease', protect, getMyLease);

export default router; 