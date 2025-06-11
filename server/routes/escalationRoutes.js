import express from 'express';
import { 
  createEscalation, 
  getAllEscalations, 
  getLandlordEscalations,
  getEscalationDetails,
  updateEscalationStatus,
  addAdminNote,
  getActiveEscalation,
  getPropertyEscalations
} from '../controllers/escalationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new escalation (landlord only)
router.post('/', protect, restrictTo('landlord'), createEscalation);

// Get all escalations (admin only)
router.get('/admin', protect, restrictTo('admin'), getAllEscalations);

// Get escalations for a specific landlord
router.get('/landlord', protect, restrictTo('landlord'), getLandlordEscalations);

// Get all escalations for a property
router.get('/property/:propertyId', protect, getPropertyEscalations);

// Get active escalation for a property
router.get('/property/:propertyId/active', protect, getActiveEscalation);

// Get escalation details
router.get('/:escalationId', protect, getEscalationDetails);

// Update escalation status (both admin and landlord can update)
router.patch('/:escalationId/status', protect, updateEscalationStatus);

// Add admin note to escalation (admin only)
router.post('/:escalationId/notes', protect, restrictTo('admin'), addAdminNote);

export default router; 