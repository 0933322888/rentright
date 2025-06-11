import Escalation from '../models/escalationModel.js';
import Payment from '../models/paymentModel.js';
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';

// Create a new escalation
export const createEscalation = async (req, res) => {
  try {
    const { propertyId, tenantId, reason, description } = req.body;
    const landlordId = req.user._id;

    // Verify property belongs to landlord
    const property = await Property.findOne({ _id: propertyId, landlord: landlordId });
    if (!property) {
      return res.status(403).json({ message: 'Property not found or unauthorized' });
    }

    // Get recent payment history
    const recentPayments = await Payment.find({
      property: propertyId,
      tenant: tenantId
    }).sort({ date: -1 }).limit(6);

    const escalation = new Escalation({
      property: propertyId,
      tenant: tenantId,
      landlord: landlordId,
      reason,
      description,
      paymentHistory: recentPayments.map(p => p._id)
    });

    await escalation.save();

    res.status(201).json(escalation);
  } catch (error) {
    console.error('Error creating escalation:', error);
    res.status(500).json({ message: 'Error creating escalation' });
  }
};

// Get all escalations (admin only)
export const getAllEscalations = async (req, res) => {
  try {
    const escalations = await Escalation.find()
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('paymentHistory')
      .sort({ createdAt: -1 });

    res.json(escalations);
  } catch (error) {
    console.error('Error fetching escalations:', error);
    res.status(500).json({ message: 'Error fetching escalations' });
  }
};

// Get escalations for a specific landlord
export const getLandlordEscalations = async (req, res) => {
  try {
    const escalations = await Escalation.find({ landlord: req.user._id })
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('paymentHistory')
      .sort({ createdAt: -1 });

    res.json(escalations);
  } catch (error) {
    console.error('Error fetching landlord escalations:', error);
    res.status(500).json({ message: 'Error fetching escalations' });
  }
};

// Add admin note to escalation
export const addAdminNote = async (req, res) => {
  try {
    const { escalationId } = req.params;
    const { text } = req.body;

    const escalation = await Escalation.findById(escalationId);
    if (!escalation) {
      return res.status(404).json({ message: 'Escalation not found' });
    }

    escalation.adminNotes.push({
      admin: req.user._id,
      text
    });

    await escalation.save();

    // Populate the admin field in the response
    await escalation.populate('adminNotes.admin', 'name');

    res.json(escalation);
  } catch (error) {
    console.error('Error adding admin note:', error);
    res.status(500).json({ message: 'Error adding admin note' });
  }
};

// Update escalation status
export const updateEscalationStatus = async (req, res) => {
  try {
    const { escalationId } = req.params;
    const { status } = req.body;

    const escalation = await Escalation.findById(escalationId)
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone');

    if (!escalation) {
      return res.status(404).json({ message: 'Escalation not found' });
    }

    // Check if user has permission to update this escalation
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== escalation.landlord._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this escalation' });
    }

    // If user is a landlord, they can only close the escalation
    if (req.user.role === 'landlord' && status !== 'closed') {
      return res.status(403).json({ message: 'Landlords can only close escalations' });
    }

    // Update the escalation
    escalation.status = status;
    if (status === 'closed' || status === 'resolved') {
      escalation.resolutionDate = new Date();
    }
    await escalation.save();

    // Populate the updated escalation
    const updatedEscalation = await Escalation.findById(escalationId)
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('paymentHistory')
      .populate('adminNotes.admin', 'name');

    res.json(updatedEscalation);
  } catch (error) {
    console.error('Error updating escalation status:', error);
    res.status(500).json({ message: 'Error updating escalation status' });
  }
};

// Get escalation details
export const getEscalationDetails = async (req, res) => {
  try {
    const { escalationId } = req.params;

    const escalation = await Escalation.findById(escalationId)
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('paymentHistory')
      .populate('adminNotes.admin', 'name');

    if (!escalation) {
      return res.status(404).json({ message: 'Escalation not found' });
    }

    // Check if user has permission to view this escalation
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== escalation.landlord._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view this escalation' });
    }

    res.json(escalation);
  } catch (error) {
    console.error('Error fetching escalation details:', error);
    res.status(500).json({ message: 'Error fetching escalation details' });
  }
};

// Get active escalation for a property
export const getActiveEscalation = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Find the most recent active escalation for the property
    const escalation = await Escalation.findOne({
      property: propertyId,
      status: { $in: ['pending', 'in_review'] }
    })
    .populate('property', 'title location')
    .populate('tenant', 'name email phone')
    .populate('landlord', 'name email phone')
    .populate('paymentHistory')
    .populate('adminNotes.admin', 'name')
    .sort({ createdAt: -1 });

    if (!escalation) {
      return res.json(null);
    }

    // Check if user has permission to view this escalation
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== escalation.landlord._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to view this escalation' });
    }

    res.json(escalation);
  } catch (error) {
    console.error('Error fetching active escalation:', error);
    res.status(500).json({ message: 'Error fetching active escalation' });
  }
};

// Get all escalations for a property
export const getPropertyEscalations = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const escalations = await Escalation.find({ property: propertyId })
      .populate('property', 'title location')
      .populate('tenant', 'name email phone')
      .populate('landlord', 'name email phone')
      .populate('paymentHistory')
      .populate('adminNotes.admin', 'name')
      .sort({ createdAt: -1 });

    // Check if user has permission to view these escalations
    if (req.user.role !== 'admin' && 
        escalations.length > 0 && 
        req.user._id.toString() !== escalations[0].landlord._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these escalations' });
    }

    res.json(escalations);
  } catch (error) {
    console.error('Error fetching property escalations:', error);
    res.status(500).json({ message: 'Error fetching escalations' });
  }
}; 