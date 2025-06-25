import PaymentSetup from '../models/paymentSetupModel.js';
import User from '../models/userModel.js';
import {
  createStripeCustomer,
  attachPaymentMethod,
  setDefaultPaymentMethod,
  getPaymentMethod
} from '../utils/stripe.js';

// Initialize payment setup for a tenant
export const initializePaymentSetup = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check if user is authorized (tenant can only setup their own payment)
    if (req.user._id.toString() !== tenantId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to setup payment for this tenant' });
    }

    // Check if payment setup already exists
    const existingSetup = await PaymentSetup.findOne({ tenant: tenantId });
    if (existingSetup && existingSetup.setupCompleted) {
      return res.status(400).json({ message: 'Payment setup already completed' });
    }

    // Get tenant information
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Create Stripe customer
    const customer = await createStripeCustomer(
      tenant.email,
      `${tenant.firstName} ${tenant.lastName}`
    );

    // Create or update payment setup
    const paymentSetup = existingSetup || new PaymentSetup({
      tenant: tenantId,
      stripeCustomerId: customer.id
    });

    await paymentSetup.save();

    res.json({
      message: 'Payment setup initialized',
      customerId: customer.id,
      setupId: paymentSetup._id
    });
  } catch (error) {
    console.error('Error initializing payment setup:', error);
    res.status(500).json({ message: 'Failed to initialize payment setup' });
  }
};

// Complete payment setup with payment method
export const completePaymentSetup = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { paymentMethodId } = req.body;

    // Check if user is authorized
    if (req.user._id.toString() !== tenantId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to setup payment for this tenant' });
    }

    // Get payment setup
    const paymentSetup = await PaymentSetup.findOne({ tenant: tenantId });
    if (!paymentSetup) {
      return res.status(404).json({ message: 'Payment setup not found. Please initialize first.' });
    }

    if (paymentSetup.setupCompleted) {
      return res.status(400).json({ message: 'Payment setup already completed' });
    }

    // Attach payment method to customer
    await attachPaymentMethod(paymentMethodId, paymentSetup.stripeCustomerId);

    // Set as default payment method
    await setDefaultPaymentMethod(paymentSetup.stripeCustomerId, paymentMethodId);

    // Get payment method details
    const paymentMethod = await getPaymentMethod(paymentMethodId);

    // Update payment setup
    paymentSetup.paymentMethodId = paymentMethodId;
    paymentSetup.paymentMethodType = paymentMethod.type;
    paymentSetup.paymentMethodDetails = {
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
      country: paymentMethod.card?.country
    };
    paymentSetup.setupCompleted = true;
    paymentSetup.setupCompletedAt = new Date();

    await paymentSetup.save();

    res.json({
      message: 'Payment setup completed successfully',
      paymentSetup: {
        id: paymentSetup._id,
        customerId: paymentSetup.stripeCustomerId,
        paymentMethodId: paymentSetup.paymentMethodId,
        paymentMethodDetails: paymentSetup.paymentMethodDetails,
        setupCompleted: paymentSetup.setupCompleted
      }
    });
  } catch (error) {
    console.error('Error completing payment setup:', error);
    res.status(500).json({ message: 'Failed to complete payment setup' });
  }
};

// Get payment setup status
export const getPaymentSetupStatus = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user is authorized
    if (req.user._id.toString() !== tenantId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view payment setup for this tenant' });
    }

    const paymentSetup = await PaymentSetup.findOne({ tenant: tenantId });
    
    if (!paymentSetup) {
      return res.json({
        setupExists: false,
        setupCompleted: false
      });
    }

    res.json({
      setupExists: true,
      setupCompleted: paymentSetup.setupCompleted,
      customerId: paymentSetup.stripeCustomerId,
      paymentMethodDetails: paymentSetup.paymentMethodDetails,
      setupCompletedAt: paymentSetup.setupCompletedAt
    });
  } catch (error) {
    console.error('Error getting payment setup status:', error);
    res.status(500).json({ message: 'Failed to get payment setup status' });
  }
};

// Update payment method
export const updatePaymentMethod = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { paymentMethodId } = req.body;

    // Check if user is authorized
    if (req.user._id.toString() !== tenantId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update payment method for this tenant' });
    }

    const paymentSetup = await PaymentSetup.findOne({ tenant: tenantId });
    if (!paymentSetup || !paymentSetup.setupCompleted) {
      return res.status(404).json({ message: 'Payment setup not found or not completed' });
    }

    // Attach new payment method
    await attachPaymentMethod(paymentMethodId, paymentSetup.stripeCustomerId);

    // Set as default payment method
    await setDefaultPaymentMethod(paymentSetup.stripeCustomerId, paymentMethodId);

    // Get payment method details
    const paymentMethod = await getPaymentMethod(paymentMethodId);

    // Update payment setup
    paymentSetup.paymentMethodId = paymentMethodId;
    paymentSetup.paymentMethodDetails = {
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
      country: paymentMethod.card?.country
    };

    await paymentSetup.save();

    res.json({
      message: 'Payment method updated successfully',
      paymentMethodDetails: paymentSetup.paymentMethodDetails
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ message: 'Failed to update payment method' });
  }
};

// Delete payment setup
export const deletePaymentSetup = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user is authorized
    if (req.user._id.toString() !== tenantId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete payment setup for this tenant' });
    }

    const paymentSetup = await PaymentSetup.findOne({ tenant: tenantId });
    if (!paymentSetup) {
      return res.status(404).json({ message: 'Payment setup not found' });
    }

    await PaymentSetup.findByIdAndDelete(paymentSetup._id);

    res.json({ message: 'Payment setup deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment setup:', error);
    res.status(500).json({ message: 'Failed to delete payment setup' });
  }
}; 