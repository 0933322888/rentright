import Payment from '../models/paymentModel.js';
import PaymentSetup from '../models/paymentSetupModel.js';
import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';
import {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent
} from '../utils/stripe.js';

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

// Create a new payment with Stripe
export const createPayment = async (req, res) => {
  try {
    const { propertyId, amount, description } = req.body;

    // Check if tenant has an approved application for this property
    const application = await Application.findOne({
      tenant: req.user._id,
      property: propertyId,
      status: 'approved'
    });

    if (!application) {
      return res.status(400).json({ message: 'No approved application found for this property' });
    }

    // Check if tenant has completed payment setup
    const paymentSetup = await PaymentSetup.findOne({ tenant: req.user._id });
    if (!paymentSetup || !paymentSetup.setupCompleted) {
      return res.status(400).json({ 
        message: 'Payment setup not completed. Please complete payment setup first.',
        requiresPaymentSetup: true
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent(
      amount,
      paymentSetup.stripeCustomerId,
      {
        propertyId: propertyId,
        tenantId: req.user._id.toString(),
        applicationId: application._id.toString(),
        paymentType: 'rent'
      }
    );

    // Create payment record
    const payment = new Payment({
      tenant: req.user._id,
      property: propertyId,
      amount,
      date: new Date(),
      dueDate: new Date(),
      paymentMethod: 'stripe',
      description: description || 'Monthly Rent',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id
    });

    await payment.save();

    res.status(201).json({
      payment,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({ message: error.message });
  }
};

// Confirm payment with Stripe
export const confirmPayment = async (req, res) => {
  try {
    const { paymentId, paymentMethodId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if user owns this payment
    if (payment.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to confirm this payment' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment is not in pending status' });
    }

    // Confirm payment intent with Stripe
    const confirmedPaymentIntent = await confirmPaymentIntent(
      payment.stripePaymentIntentId,
      paymentMethodId
    );

    if (confirmedPaymentIntent.status === 'succeeded') {
      // Update payment status
      payment.status = 'paid';
      payment.stripeChargeId = confirmedPaymentIntent.latest_charge;
      payment.transactionId = confirmedPaymentIntent.latest_charge;
      await payment.save();

      res.json({
        message: 'Payment confirmed successfully',
        payment,
        paymentIntent: confirmedPaymentIntent
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = confirmedPaymentIntent.last_payment_error?.message || 'Payment failed';
      await payment.save();

      res.status(400).json({
        message: 'Payment failed',
        error: confirmedPaymentIntent.last_payment_error?.message || 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
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

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only admin can update payment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update payment status' });
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
      paymentMethod: 'stripe',
      description: `Rent for ${dueDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`
    });

    await payment.save();

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get payments by property ID (for landlords)
export const getPropertyPayments = async (req, res) => {
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

// Get payment intent status
export const getPaymentIntentStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await getPaymentIntent(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    console.error('Error getting payment intent status:', error);
    res.status(500).json({ message: 'Failed to get payment intent status' });
  }
}; 