// Stubbed Stripe utilities for development
// This file simulates Stripe functionality without making actual API calls

// Stubbed Stripe instance
const stripe = {
  customers: {
    create: async (params) => {
      // Simulate customer creation
      return {
        id: `cus_stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: params.email,
        name: params.name,
        created: Date.now()
      };
    },
    update: async (customerId, params) => {
      // Simulate customer update
      return {
        id: customerId,
        ...params,
        updated: Date.now()
      };
    }
  },
  paymentIntents: {
    create: async (params) => {
      // Simulate payment intent creation
      const paymentIntentId = `pi_stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: paymentIntentId,
        amount: params.amount,
        currency: params.currency || 'cad',
        customer: params.customer,
        metadata: params.metadata || {},
        client_secret: `pi_stub_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_payment_method',
        created: Date.now()
      };
    },
    confirm: async (paymentIntentId, params) => {
      // Simulate payment intent confirmation
      const chargeId = `ch_stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: paymentIntentId,
        status: 'succeeded',
        latest_charge: chargeId,
        amount: 1000, // Stubbed amount
        currency: 'cad',
        payment_method: params.payment_method
      };
    },
    retrieve: async (paymentIntentId) => {
      // Simulate payment intent retrieval
      return {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 1000,
        currency: 'cad',
        created: Date.now()
      };
    }
  },
  paymentMethods: {
    attach: async (paymentMethodId, params) => {
      // Simulate payment method attachment
      return {
        id: paymentMethodId,
        customer: params.customer,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          country: 'CA'
        }
      };
    },
    retrieve: async (paymentMethodId) => {
      // Simulate payment method retrieval
      return {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          country: 'CA'
        }
      };
    }
  }
};

// Create a Stripe customer
export const createStripeCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer (STUBBED):', error);
    throw error;
  }
};

// Create a payment intent
export const createPaymentIntent = async (amount, customerId, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'cad',
      customer: customerId,
      metadata: {
        ...metadata,
        source: 'rentright_app'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent (STUBBED):', error);
    throw error;
  }
};

// Confirm a payment intent
export const confirmPaymentIntent = async (paymentIntentId, paymentMethodId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error confirming payment intent (STUBBED):', error);
    throw error;
  }
};

// Attach payment method to customer
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    return paymentMethod;
  } catch (error) {
    console.error('Error attaching payment method (STUBBED):', error);
    throw error;
  }
};

// Set payment method as default
export const setDefaultPaymentMethod = async (customerId, paymentMethodId) => {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    return customer;
  } catch (error) {
    console.error('Error setting default payment method (STUBBED):', error);
    throw error;
  }
};

// Get payment method details
export const getPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Error retrieving payment method (STUBBED):', error);
    throw error;
  }
};

// Create a refund
export const createRefund = async (chargeId, amount, reason = 'requested_by_customer') => {
  try {
    const refundId = `re_stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: refundId,
      charge: chargeId,
      amount: amount,
      currency: 'cad',
      reason: reason,
      status: 'succeeded',
      created: Date.now()
    };
  } catch (error) {
    console.error('Error creating refund (STUBBED):', error);
    throw error;
  }
};

// Get payment intent details
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent (STUBBED):', error);
    throw error;
  }
};

// Get charge details
export const getCharge = async (chargeId) => {
  try {
    return {
      id: chargeId,
      amount: 1000,
      currency: 'cad',
      status: 'succeeded',
      payment_intent: `pi_stub_${chargeId}`,
      created: Date.now()
    };
  } catch (error) {
    console.error('Error retrieving charge (STUBBED):', error);
    throw error;
  }
};

// Export the stubbed stripe instance for testing
export { stripe }; 