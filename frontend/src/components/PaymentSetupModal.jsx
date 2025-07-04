import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Stubbed Stripe implementation for development
const createStubbedStripe = () => {
  return {
    createPaymentMethod: async ({ type, card }) => {
      // Simulate Stripe payment method creation
      return {
        error: null,
        paymentMethod: {
          id: `pm_stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025,
            country: 'CA'
          }
        }
      };
    }
  };
};

// Stubbed Elements implementation
const createStubbedElements = () => {
  return {
    getElement: () => ({
      // Mock card element that doesn't make API calls
      mount: () => {},
      unmount: () => {},
      destroy: () => {}
    })
  };
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentSetupForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('initialize'); // 'initialize', 'setup', 'complete'
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    initializePaymentSetup();
  }, []);

  const initializePaymentSetup = async () => {
    try {
      setIsLoading(true);
      await axios.post(
        API_ENDPOINTS.INITIALIZE_PAYMENT_SETUP(user._id),
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setStep('setup');
    } catch (error) {
      console.error('Error initializing payment setup:', error);
      if (error.response?.data?.message === 'Payment setup already completed') {
        toast.success('Payment method is already set up.');
        onSuccess();
      } else {
        toast.error(error.response?.data?.message || 'Failed to initialize payment setup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Basic validation
    if (!cardNumber || !expiryDate || !cvc) {
      toast.error('Please fill in all card details');
      return;
    }

    setIsLoading(true);

    try {
      // Use stubbed Stripe to create payment method
      const stripe = createStubbedStripe();
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: { number: cardNumber, exp_month: 12, exp_year: 2025, cvc }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Complete payment setup with the payment method
      await axios.post(
        API_ENDPOINTS.COMPLETE_PAYMENT_SETUP(user._id),
        {
          paymentMethodId: paymentMethod.id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setStep('complete');
      toast.success('Payment method set up successfully! (STUBBED MODE)');

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error completing payment setup:', error);
      toast.error(error.response?.data?.message || 'Failed to complete payment setup');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'initialize') {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Initializing payment setup...</p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-4">
        <Alert variant="success" className="mb-3">
          <i className="fas fa-check-circle me-2"></i>
          Payment method set up successfully! (STUBBED MODE)
        </Alert>
        <p>You can now make rent payments through the app.</p>
        <Alert variant="info" className="mt-3">
          <small>
            <strong>Note:</strong> This is running in stubbed mode. No real payments will be processed.
          </small>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          Please enter your payment information to set up automatic rent payments.
        </Alert>
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Development Mode:</strong> This is running with stubbed payment processing. 
          No real payments will be charged.
        </Alert>
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium">Card Number</label>
        <input
          type="text"
          className="form-control"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          maxLength="19"
        />
      </div>

      <div className="row mb-3">
        <div className="col-6">
          <label className="form-label fw-medium">Expiry Date</label>
          <input
            type="text"
            className="form-control"
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            maxLength="5"
          />
        </div>
        <div className="col-6">
          <label className="form-label fw-medium">CVC</label>
          <input
            type="text"
            className="form-control"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            maxLength="4"
          />
        </div>
      </div>

      <p className="text-muted small">
        Your payment information is securely processed. We do not store your card details.
        <br />
        <strong>Test Card:</strong> Use 4242 4242 4242 4242 with any future expiry date and any CVC.
      </p>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? 'Setting up...' : 'Set Up Payment Method'}
        </Button>
      </div>
    </form>
  );
};

const PaymentSetupModal = ({ show, onHide, onSuccess }) => {
  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Set Up Payment Method</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PaymentSetupForm onSuccess={onSuccess} onCancel={onHide} />
      </Modal.Body>
    </Modal>
  );
};

export default PaymentSetupModal; 