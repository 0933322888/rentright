import express from 'express';
import {
  getTenantPayments,
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  generateMonthlyPayment,
  getPropertyPayments
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get tenant's payment history
router.get('/tenant/:id', getTenantPayments);

// Get property's payment history (for landlords)
router.get('/property/:propertyId', getPropertyPayments);

// Create a new payment
router.post('/', createPayment);

// Get payment by ID
router.get('/:id', getPaymentById);

// Update payment status (admin only)
router.patch('/:id', updatePaymentStatus);

// Generate monthly payment
router.post('/generate', generateMonthlyPayment);

export default router; 