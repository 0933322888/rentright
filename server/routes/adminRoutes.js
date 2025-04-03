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
  updateApplicationStatus,
  getTenantById,
  updateTenant
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(isAdmin);

// Admin routes
router.get('/properties', getAllProperties);
router.patch('/properties/:id/approve', approveProperty);
router.delete('/properties/:id', deleteProperty);
router.get('/landlords', getAllLandlords);
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantById);
router.put('/tenants/:id', updateTenant);
router.delete('/tenants/:id', deleteTenant);
router.get('/applications', getAllApplications);
router.delete('/applications/:id', deleteApplication);
router.patch('/applications/:id', updateApplicationStatus);

export default router; 