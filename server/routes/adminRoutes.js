import express from 'express';
import {
  getAllProperties,
  getAllLandlords,
  getAllTenants,
  getAllApplications,
  approveProperty,
  deleteProperty,
  deleteTenant,
  deleteApplication,
  getTenantById,
  updateTenant,
  rejectProperty,
  addViewingDates,
  updateViewingDate,
  deleteViewingDate,
  submitForReview,
  getPropertyForReview,
  getLeaseAgreements,
  uploadLeaseAgreementFile,
  deleteLeaseAgreementFile,
  getLeaseAgreementFile
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { loadProperty } from '../middleware/propertyMiddleware.js';
import fileUpload from 'express-fileupload';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(isAdmin);

// Configure file upload middleware
router.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Property routes
router.get('/properties', getAllProperties);
router.get('/properties/:id/review', loadProperty, getPropertyForReview);
router.post('/properties/:id/viewing-dates', loadProperty, addViewingDates);
router.patch('/properties/:id/viewing-dates/:dateId', loadProperty, updateViewingDate);
router.delete('/properties/:id/viewing-dates/:dateId', loadProperty, deleteViewingDate);
router.patch('/properties/:id/approve', loadProperty, approveProperty);
router.patch('/properties/:id/reject', loadProperty, rejectProperty);
router.delete('/properties/:id', loadProperty, deleteProperty);

// Landlord routes
router.get('/landlords', getAllLandlords);

// Tenant routes
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantById);
router.patch('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);

// Application routes
router.get('/applications', getAllApplications);
router.delete('/applications/:id', deleteApplication);

// Lease Agreement Management Routes
router.get('/lease-agreements', getLeaseAgreements);
router.post('/lease-agreements/:countryCode/:region', uploadLeaseAgreementFile);
router.delete('/lease-agreements/:countryCode/:region', deleteLeaseAgreementFile);
router.get('/lease-agreements/:countryCode/:region/file', getLeaseAgreementFile);

export default router; 