import express from 'express';
import { getMyProperties } from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User property routes
router.get('/my-properties', getMyProperties);

export default router; 