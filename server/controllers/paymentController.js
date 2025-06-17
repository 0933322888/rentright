import Payment from '../models/paymentModel.js';
import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';

// Get tenant's payment history
export const getTenantPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.user._id })
      .populate('property', 'title location')
      .sort('-date');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const { propertyId, amount, paymentMethod, description } = req.body;

    // Check if tenant has an approved application for this property
    const application = await Application.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: 'approved'
    });

    if (!application) {
      return res.status(400).json({ message: 'No approved application found for this property' });
    }

    const payment = new Payment({
      tenant: req.user._id,
      property: propertyId,
      amount,
      date: new Date(),
      dueDate: new Date(), // This should be calculated based on the lease terms
      paymentMethod,
      description: description || 'Monthly Rent',
      status: 'paid' // Assuming immediate payment
    });

    await payment.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('property', 'title location')
      .populate('tenant', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if the user is authorized to view this payment
    if (req.user.role !== 'admin' && payment.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate monthly payment record
export const generateMonthlyPayment = async (req, res) => {
  try {
    const { propertyId } = req.body;

    const application = await Application.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: 'approved'
    }).populate('property', 'price');

    if (!application) {
      return res.status(400).json({ message: 'No approved application found for this property' });
    }

    const dueDate = new Date();
    dueDate.setDate(1); // Set to first day of the month
    dueDate.setMonth(dueDate.getMonth() + 1); // Set to next month

    const payment = new Payment({
      tenant: req.user._id,
      property: propertyId,
      amount: application.property.price,
      date: new Date(),
      dueDate,
      status: 'pending',
      description: `Rent for ${dueDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`
    });

    await payment.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payments by property ID (for landlords)
const getPropertyPayments = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Check if the property exists and belongs to the landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if the user is the landlord of this property
    if (property.landlord.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view payments for this property' });
    }

    const payments = await Payment.find({ property: propertyId })
      .populate('tenant', 'name email')
      .populate('property', 'title location')
      .sort('-date');

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getPropertyPayments }; 