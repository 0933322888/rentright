import express from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  verifyResetToken,
  completeOAuthRegistration,
  googleAuth,
  googleCallback,
  googleFailure,
  facebookAuth,
  facebookCallback,
  facebookFailure,
  linkedinAuth,
  linkedinCallback,
  linkedinFailure
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Regular auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// OAuth completion route (requires authentication)
router.post('/oauth/complete-registration', protect, completeOAuthRegistration);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/google/failure', googleFailure);

router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);
router.get('/facebook/failure', facebookFailure);

router.get('/linkedin', linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);
router.get('/linkedin/failure', linkedinFailure);

export default router; 