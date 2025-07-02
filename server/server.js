import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectDB from './config/db.js';
import passport from './config/passport.js';
import { initializeDefaultSettings } from './initializeSettings.js';
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userPropertyRoutes from './routes/userPropertyRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import landlordRoutes from './routes/landlordRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import paymentSetupRoutes from './routes/paymentSetupRoutes.js';
import insuranceRoutes from './routes/insuranceRoutes.js';
import docusignRoutes from './routes/docusign.js';
import escalationRoutes from './routes/escalationRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Initialize default settings
initializeDefaultSettings().catch(console.error);

// Middleware
app.use(cors({
  
  origin: process.env.NODE_ENV === 'prod' ? process.env.PROD_FRONTEND_URL : process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// API Routes - these must come BEFORE static file serving
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback for OAuth compatibility
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/user-properties', userPropertyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/landlord', landlordRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-setup', paymentSetupRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/docusign', docusignRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/settings', settingsRoutes);

// Serve uploaded files statically (for local storage fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware for multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  }
  
  if (error.message === 'Only image files are allowed' || error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: error.message });
  }
  
  next(error);
});

// General error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// Serve frontend static files - these must come AFTER API routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // Fallback to index.html for SPA routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.NODE_ENV === 'prod' ? process.env.AWS_BACKEND_PORT || 8080 : process.env.DEV_BACKEND_PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 