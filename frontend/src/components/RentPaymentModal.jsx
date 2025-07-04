import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert, Spinner, Badge } from 'react-bootstrap';
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

const RentPaymentForm = ({ amount, property, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('payment'); // 'payment', 'processing', 'complete'
  const [useSavedPaymentMethod, setUseSavedPaymentMethod] = useState(true);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

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

        // Use the saved payment method ID
        paymentMethodId = paymentSetupResponse.data.paymentMethodId || 'pm_stub_saved_method';
      } else {
        // Basic validation for new card
        if (!cardNumber || !expiryDate || !cvc) {
          throw new Error('Please fill in all card details');
        }

        // Create new payment method using stubbed Stripe
        const stripe = createStubbedStripe();
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: { number: cardNumber, exp_month: 12, exp_year: 2025, cvc }
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

      const { payment } = paymentResponse.data;

      // Confirm payment
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
      toast.success('Payment processed successfully! (STUBBED MODE)');

      setTimeout(() => {
        onSuccess();
      }, 3000);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to process payment');
      setStep('payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Processing...</span>
        </Spinner>
        <p>Processing your payment...</p>
        <Alert variant="info" className="mt-3">
          <small>This is running in stubbed mode. No real payment will be charged.</small>
        </Alert>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="text-center py-4">
        <Alert variant="success" className="mb-3">
          <i className="fas fa-check-circle me-2"></i>
          Payment processed successfully! (STUBBED MODE)
        </Alert>
        <p>Your rent payment has been processed.</p>
        <Alert variant="info" className="mt-3">
          <small>
            <strong>Note:</strong> This is running in stubbed mode. No real payment was charged.
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
          Processing rent payment for <strong>{property.title}</strong>
        </Alert>
        <Alert variant="warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <strong>Development Mode:</strong> This is running with stubbed payment processing. 
          No real payments will be charged.
        </Alert>
      </div>

      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-medium">Payment Amount:</span>
          <Badge bg="primary" className="fs-6">${amount}</Badge>
        </div>
      </div>

      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="useSavedPaymentMethod"
            checked={useSavedPaymentMethod}
            onChange={(e) => setUseSavedPaymentMethod(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="useSavedPaymentMethod">
            Use saved payment method
          </label>
        </div>
      </div>

      {!useSavedPaymentMethod && (
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
          
          <div className="row mt-2">
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
          
          <p className="text-muted small mt-2">
            <strong>Test Card:</strong> Use 4242 4242 4242 4242 with any future expiry date and any CVC.
          </p>
        </div>
      )}

      <p className="text-muted small">
        Your payment information is securely processed. We do not store your card details.
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
        <Modal.Title>Pay Rent</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <RentPaymentForm 
          amount={amount} 
          property={property} 
          onSuccess={onSuccess} 
          onCancel={onHide} 
        />
      </Modal.Body>
    </Modal>
  );
};

export default RentPaymentModal; 