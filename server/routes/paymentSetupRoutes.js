import express from 'express';
import {
  initializePaymentSetup,
  completePaymentSetup,
  getPaymentSetupStatus,
  updatePaymentMethod,
  deletePaymentSetup
} from '../controllers/paymentSetupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Initialize payment setup
router.post('/initialize/:tenantId', initializePaymentSetup);

// Complete payment setup
router.post('/complete/:tenantId', completePaymentSetup);

// Get payment setup status
router.get('/status/:tenantId', getPaymentSetupStatus);

// Update payment method
router.put('/update/:tenantId', updatePaymentMethod);

// Delete payment setup
router.delete('/:tenantId', deletePaymentSetup);

export default router; 