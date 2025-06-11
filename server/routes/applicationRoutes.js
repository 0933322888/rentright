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
router.patch('/:id/status', updateApplicationStatus);
router.patch('/:id/promote', promoteApplication);
router.delete('/:id', deleteApplication);
router.patch('/:id/reschedule', updateApplicationViewing);
router.get('/property/:id', getPropertyApplications);

export default router; 