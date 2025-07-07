import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  createTicket,
  getAllTickets,
  getTenantTickets,
  updateTicketStatus,
  getTicketById,
  updateTicketPriority,
  addComment,
  getPropertyTickets,
  deleteTicket,
  updateTenantTicketStatus
} from '../controllers/ticketController.js';
import Ticket from '../models/ticketModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist for ticket images
const uploadsDir = path.join(__dirname, '../uploads/ticket-images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for ticket image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Tenant routes
router.post('/', protect, restrictTo('tenant'), upload.array('images', 5), createTicket);
router.get('/my-tickets', protect, restrictTo('tenant'), getTenantTickets);
router.get('/property/:propertyId', protect, getPropertyTickets);
router.delete('/:ticketId', protect, restrictTo('tenant'), deleteTicket);
router.patch('/:ticketId/tenant-status', protect, restrictTo('tenant'), updateTenantTicketStatus);
router.get('/:ticketId', protect, getTicketById);

// Admin routes
router.get('/', protect, restrictTo('admin'), getAllTickets);
router.patch('/:ticketId/status', protect, restrictTo('admin'), updateTicketStatus);
router.patch('/:ticketId/priority', protect, restrictTo('admin'), updateTicketPriority);

// Comments route - allow admins, tenants, and landlords
router.post('/:ticketId/comments', protect, async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate('property');
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Allow admins to comment on any ticket
    if (req.user.role === 'admin') {
      return next();
    }

    // Allow tenants to comment only on their own tickets
    if (ticket.tenant.toString() === req.user._id.toString()) {
      return next();
    }

    // Allow landlords to comment on tickets for their properties
    if (req.user.role === 'landlord' && ticket.property.landlord.toString() === req.user._id.toString()) {
      return next();
    }

    res.status(403).json({ message: 'Not authorized to comment on this ticket' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}, addComment);

export default router; 