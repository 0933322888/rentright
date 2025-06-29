import express from 'express';
import {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  createOrUpdateSetting,
  deleteSetting,
  getCommissionSettings,
  updateCommissionSettings,
  initializeDefaultSettings
} from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(isAdmin);

// General settings routes
router.get('/', getAllSettings);
router.get('/category/:category', getSettingsByCategory);
router.get('/key/:key', getSetting);
router.post('/', createOrUpdateSetting);
router.delete('/:key', deleteSetting);

// Commission settings routes
router.get('/commission', getCommissionSettings);
router.post('/commission', updateCommissionSettings);

// Initialize default settings
router.post('/initialize', initializeDefaultSettings);

export default router; 