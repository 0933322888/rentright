import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner, Badge } from 'react-bootstrap';
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

const RentPaymentForm = ({ amount, property, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('payment'); // 'payment', 'processing', 'complete'
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [useSavedPaymentMethod, setUseSavedPaymentMethod] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setStep('processing');

    try {
      let paymentMethodId = null;

      if (useSavedPaymentMethod) {
        // Use saved payment method
        const paymentSetupResponse = await axios.get(
          API_ENDPOINTS.PAYMENT_SETUP_STATUS(user._id),
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!paymentSetupResponse.data.setupCompleted) {
          throw new Error('No saved payment method found. Please set up payment method first.');
        }

        paymentMethodId = paymentSetupResponse.data.paymentMethodId;
      } else {
        // Create new payment method
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement),
        });

        if (error) {
          throw new Error(error.message);
        }

        paymentMethodId = paymentMethod.id;
      }

      // Create payment
      const paymentResponse = await axios.post(
        API_ENDPOINTS.PAYMENTS,
        {
          propertyId: property._id,
          amount: amount,
          description: `Rent payment for ${property.title}`
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const { payment, clientSecret } = paymentResponse.data;
      setPaymentIntent({ id: payment.stripePaymentIntentId, clientSecret });

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethodId,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Update payment status
      await axios.post(
        API_ENDPOINTS.CONFIRM_PAYMENT,
        {
          paymentId: payment._id,
          paymentMethodId: paymentMethodId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setStep('complete');
      toast.success('Your rent payment has been processed successfully!');

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error processing payment:', error);
      setStep('payment');
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Processing your payment...</p>
        <p className="text-muted small">Please do not close this window.</p>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-4">
        <Alert variant="success" className="mb-3">
          <i className="fas fa-check-circle me-2"></i>
          Payment completed successfully!
        </Alert>
        <p>Your rent payment of ${amount} has been processed.</p>
        <p className="text-muted small">You will receive a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h5 className="mb-3">Payment Summary</h5>
        <div className="bg-light p-3 rounded">
          <div className="d-flex justify-content-between mb-2">
            <span>Property:</span>
            <span className="fw-medium">{property.title}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Amount:</span>
            <span className="fw-bold fs-5 text-primary">${amount}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Payment Method:</span>
            <Badge bg="success">Stripe</Badge>
          </div>
        </div>
      </div>

      <hr />

      <div className="mb-3">
        <label className="form-label fw-medium">Payment Method</label>
        
        {useSavedPaymentMethod ? (
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            Using your saved payment method
          </Alert>
        ) : (
          <div
            className="border rounded p-3 mb-3"
            style={{ backgroundColor: 'white' }}
          >
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        )}

        <Button
          variant="link"
          size="sm"
          className="p-0"
          onClick={() => setUseSavedPaymentMethod(!useSavedPaymentMethod)}
        >
          {useSavedPaymentMethod ? 'Use different card' : 'Use saved payment method'}
        </Button>
      </div>

      <p className="text-muted small">
        Your payment is securely processed by Stripe. We do not store your card details.
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
          {isLoading ? 'Processing...' : `Pay $${amount}`}
        </Button>
      </div>
    </form>
  );
};

const RentPaymentModal = ({ show, onHide, onSuccess, amount, property }) => {
  return (
    <Modal show={show} onHide={onHide} size="md" centered>
      <Modal.Header closeButton>
        <Modal.Title>Make Rent Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Elements stripe={stripePromise}>
          <RentPaymentForm 
            amount={amount} 
            property={property}
            onSuccess={onSuccess} 
            onCancel={onHide} 
          />
        </Elements>
      </Modal.Body>
    </Modal>
  );
};

export default RentPaymentModal; 