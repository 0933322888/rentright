import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../utils/emailService.js';
import passport from 'passport';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// OAuth Success Handler
const handleOAuthSuccess = (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user._id, user.role);
    
    // Check if user needs to complete registration (new OAuth user)
    const isNewUser = !user.registrationComplete;
    
    console.log('🔐 OAuth login successful:', { 
      email: user.email, 
      userId: user._id, 
      role: user.role, 
      name: user.name,
      provider: req.params.provider || 'unknown',
      isNewUser,
      timestamp: new Date().toISOString() 
    });
    
    // Redirect to frontend with token and user info
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5137'}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture,
      socialProfile: user.socialProfile,
      socialMedia: user.socialMedia || {}
    }))}&newUser=${isNewUser}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.log('❌ OAuth success handler error:', { error: error.message, timestamp: new Date().toISOString() });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5137'}/oauth-error`);
  }
};

// OAuth Failure Handler
const handleOAuthFailure = (req, res) => {
  console.log('❌ OAuth failure:', { 
    error: req.query.error, 
    provider: req.params.provider || 'unknown',
    timestamp: new Date().toISOString() 
  });
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5137'}/oauth-error?error=${encodeURIComponent(req.query.error || 'Authentication failed')}`);
};

// OAuth Routes
export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = [
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure',
    session: false 
  }),
  handleOAuthSuccess
];

export const googleFailure = (req, res) => {
  handleOAuthFailure(req, res);
};

export const facebookAuth = passport.authenticate('facebook', { 
  profileFields: ['id', 'displayName', 'photos']
});

export const facebookCallback = [
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/facebook/failure',
    session: false 
  }),
  handleOAuthSuccess
];

export const facebookFailure = (req, res) => {
  handleOAuthFailure(req, res);
};

export const linkedinAuth = passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] });

export const linkedinCallback = [
  passport.authenticate('linkedin', { 
    failureRedirect: '/api/auth/linkedin/failure',
    session: false 
  }),
  handleOAuthSuccess
];

export const linkedinFailure = (req, res) => {
  handleOAuthFailure(req, res);
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, termsAccepted } = req.body;

    console.log('📝 Registration attempt:', { email, name, role, timestamp: new Date().toISOString() });

    // Validate that terms and conditions are accepted
    if (!termsAccepted) {
      console.log('❌ Registration failed - Terms not accepted:', { email, timestamp: new Date().toISOString() });
      return res.status(400).json({ message: 'You must accept the terms and conditions to register' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ Registration failed - User already exists:', { email, timestamp: new Date().toISOString() });
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      termsAccepted,
    });

    if (user) {
      console.log('✅ Registration successful:', { 
        email, 
        userId: user._id, 
        role: user.role, 
        name: user.name,
        timestamp: new Date().toISOString() 
      });
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        termsAccepted: user.termsAccepted,
        token: generateToken(user._id, user.role),
      });
    }
  } catch (error) {
    console.log('❌ Registration error:', { email: req.body.email, error: error.message, timestamp: new Date().toISOString() });
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, timestamp: new Date().toISOString() });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      console.log('❌ Login failed - Invalid credentials:', { email, timestamp: new Date().toISOString() });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ Login successful:', { 
      email, 
      userId: user._id, 
      role: user.role, 
      name: user.name,
      timestamp: new Date().toISOString() 
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.log('❌ Login error:', { email: req.body.email, error: error.message, timestamp: new Date().toISOString() });
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (emailError) {
      // If email fails, clear the reset token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('Email sending failed:', emailError);
      res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send success email
    try {
      await sendPasswordResetSuccessEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send success email:', emailError);
      // Don't fail the request if success email fails
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

// Complete OAuth registration with role selection
export const completeOAuthRegistration = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user._id;

    // Validate role
    if (!role || !['tenant', 'landlord'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (tenant or landlord)' });
    }

    // Find user and check if they need role completion
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is an OAuth user who hasn't completed registration
    if (user.registrationComplete) {
      return res.status(400).json({ message: 'Registration already completed' });
    }

    // Update user with role and mark registration as complete
    user.role = role;
    user.registrationComplete = true;
    await user.save();

    // Generate new token
    const token = generateToken(user._id, user.role);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        socialProfile: user.socialProfile,
        socialMedia: user.socialMedia || {},
        registrationComplete: user.registrationComplete
      },
      token
    });
  } catch (error) {
    console.error('Complete OAuth registration error:', error);
    res.status(500).json({ message: 'Failed to complete registration. Please try again.' });
  }
};
