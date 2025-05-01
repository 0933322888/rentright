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
  updateTenant
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(isAdmin);

// Property routes
router.get('/properties', getAllProperties);
router.patch('/properties/:id/approve', approveProperty);
router.delete('/properties/:id', deleteProperty);

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

export default router; 