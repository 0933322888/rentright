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

const router = express.Router();

// Tenant routes
router.post('/', protect, restrictTo('tenant'), createTicket);
router.delete('/:ticketId', protect, restrictTo('tenant'), deleteTicket);
router.patch('/:ticketId/tenant-status', protect, restrictTo('tenant'), updateTenantTicketStatus);
router.get('/my-tickets', protect, restrictTo('tenant'), getTenantTickets);
router.get('/:ticketId', protect, getTicketById);

// Property tickets route
router.get('/property/:propertyId', protect, getPropertyTickets);

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