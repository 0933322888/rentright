import express from 'express';
import {
  getAllFees,
  getFeeStats,
  createFee,
  getFeeById,
  updateFee,
  deleteFee,
  markFeeAsPaid,
  generateRecurringFees,
  getOverdueFees,
  getFeesByLandlord,
  getFeesByProperty,
  generateMonthlyFeesForAllProperties
} from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(isAdmin);

// Fee management routes
router.get('/', getAllFees);
router.get('/stats', getFeeStats);
router.post('/', createFee);
router.get('/overdue', getOverdueFees);
router.get('/landlord/:landlordId', getFeesByLandlord);
router.get('/property/:propertyId', getFeesByProperty);
router.post('/generate-recurring', generateRecurringFees);
router.post('/generate-monthly-fees', generateMonthlyFeesForAllProperties);

// Individual fee routes
router.get('/:id', getFeeById);
router.patch('/:id', updateFee);
router.delete('/:id', deleteFee);
router.patch('/:id/mark-paid', markFeeAsPaid);

export default router; 