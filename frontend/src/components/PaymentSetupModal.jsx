import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

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
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('initialize'); // 'initialize', 'setup', 'complete'

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

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
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
      toast.success('Payment method set up successfully!');

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
          Payment method set up successfully!
        </Alert>
        <p>You can now make rent payments through the app.</p>
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
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium">Card Information</label>
        <div
          className="border rounded p-3"
          style={{ backgroundColor: 'white' }}
        >
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <p className="text-muted small">
        Your payment information is securely processed by Stripe. We do not store your card details.
      </p>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || isLoading}
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
        <Elements stripe={stripePromise}>
          <PaymentSetupForm onSuccess={onSuccess} onCancel={onHide} />
        </Elements>
      </Modal.Body>
    </Modal>
  );
};

export default PaymentSetupModal; 