import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads/tenant-documents/thumbnails', express.static(path.join(__dirname, 'uploads/tenant-documents/thumbnails')));
app.use('/uploads/tenant-documents', express.static(path.join(__dirname, 'uploads/tenant-documents')));
app.use('/uploads/property-documents', express.static(path.join(__dirname, 'uploads/property-documents')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/payments', paymentRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.BACKEND_PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 