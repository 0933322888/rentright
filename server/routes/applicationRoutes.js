import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getPropertyApplications,
  updateApplicationViewing
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all applications (filtered by user role)
router.get('/', getApplications);

// Get applications for a specific property
router.get('/property/:propertyId', getPropertyApplications);

// Get a single application
router.get('/:id', getApplicationById);

// Create a new application
router.post('/', createApplication);

// Update application status (landlord only)
router.patch('/:id/status', updateApplicationStatus);

// Delete application (tenant only)
router.delete('/:id', deleteApplication);

// Allow tenant to update their own application's viewing date/time
router.patch('/:id', updateApplicationViewing);

export default router; 