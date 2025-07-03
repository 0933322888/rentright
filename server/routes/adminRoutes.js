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
  getLeaseAgreementFile,
  geocodeProperties,
  getDashboardStats
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { loadProperty } from '../middleware/propertyMiddleware.js';
import { updatePropertyCommissionStatus } from '../controllers/propertyController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for lease agreement file uploads
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

// Protect all admin routes
router.use(protect);
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Property routes
router.get('/properties', getAllProperties);
router.get('/properties/:id/review', loadProperty, getPropertyForReview);
router.post('/properties/:id/viewing-dates', loadProperty, addViewingDates);
router.patch('/properties/:id/viewing-dates/:dateId', loadProperty, updateViewingDate);
router.delete('/properties/:id/viewing-dates/:dateId', loadProperty, deleteViewingDate);
router.patch('/properties/:id/approve', loadProperty, approveProperty);
router.patch('/properties/:id/reject', loadProperty, rejectProperty);
router.patch('/properties/:id/commission', loadProperty, updatePropertyCommissionStatus);
router.delete('/properties/:id', loadProperty, deleteProperty);

// Geocoding route
router.post('/geocode-properties', geocodeProperties);

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
router.post('/lease-agreements/:countryCode/:region', upload.single('file'), uploadLeaseAgreementFile);
router.delete('/lease-agreements/:countryCode/:region', deleteLeaseAgreementFile);
router.get('/lease-agreements/:countryCode/:region/file', getLeaseAgreementFile);

router.get('/something', (req, res) => {
  res.send('ok');
});

export default router; 