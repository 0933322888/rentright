import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getLandlordStatistics,
  getLandlordApplications,
  getLandlordPayments,
  getLandlordTickets
} from '../controllers/landlordController.js';

const router = express.Router();

// All routes require authentication and landlord role
router.use(protect);
router.use(restrictTo('landlord'));

// Landlord dashboard statistics
router.get('/statistics', getLandlordStatistics);

// Landlord applications
router.get('/applications', getLandlordApplications);

// Landlord payments
router.get('/payments', getLandlordPayments);

// Landlord tickets
router.get('/tickets', getLandlordTickets);

export default router; 