import express from 'express';
import {
    createApplication,
    getApplications,
    updateApplicationStatus,
    promoteApplication,
    deleteApplication,
    updateApplicationViewing, getPropertyApplications
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.use(protect);

// Application routes
router.post('/', createApplication);
router.get('/', getApplications);
router.get('/property/:id', getPropertyApplications);
router.delete('/:id', deleteApplication);
router.patch('/:id/promote', promoteApplication);
router.patch('/:id/viewing', updateApplicationViewing);

export default router; 