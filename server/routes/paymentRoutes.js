import express from 'express';
import {
  getTenantPayments,
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  generateMonthlyPayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Get tenant's payment history
router.get('/tenant/:id', getTenantPayments);

// Create a new payment
router.post('/', createPayment);

// Get payment by ID
router.get('/:id', getPaymentById);

// Update payment status (admin only)
router.patch('/:id', updatePaymentStatus);

// Generate monthly payment
router.post('/generate', generateMonthlyPayment);

export default router; 