import express from 'express';
import {
  getAllCommissions,
  getCommissionStats,
  getCommissionById,
  createCommission,
  updateCommission,
  deleteCommission,
  markCommissionAsPaid,
  getOverdueCommissions,
  getCommissionsByLandlord,
  getCommissionsByProperty,
  generateMonthlyFees
} from '../controllers/commissionController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all commission routes
router.use(protect);
router.use(isAdmin);

// Commission management routes
router.get('/', getAllCommissions);
router.get('/stats', getCommissionStats);
router.get('/overdue', getOverdueCommissions);
router.get('/landlord/:landlordId', getCommissionsByLandlord);
router.get('/property/:propertyId', getCommissionsByProperty);

// Monthly fee generation
router.post('/generate-monthly-fees', generateMonthlyFees);

// Individual commission routes
router.get('/:id', getCommissionById);
router.post('/', createCommission);
router.patch('/:id', updateCommission);
router.delete('/:id', deleteCommission);
router.patch('/:id/mark-paid', markCommissionAsPaid);

export default router; 