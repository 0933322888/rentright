# Payment System - Stubbed Mode

This document describes the stubbed payment system that has been implemented for development purposes while the Stripe integration is being completed.

## Overview

The payment system has been stubbed to allow development and testing of the payment flow without requiring actual Stripe API keys or making real payment transactions.

## What's Stubbed

### Backend (Server)

1. **Payment Setup Controller** (`server/controllers/paymentSetupController.js`)
   - Stripe customer creation
   - Payment method attachment
   - Payment method retrieval
   - All Stripe API calls are simulated

2. **Payment Controller** (`server/controllers/paymentController.js`)
   - Payment intent creation
   - Payment confirmation
   - Payment status retrieval
   - All payment processing is simulated

3. **Stripe Utilities** (`server/utils/stripe.js`)
   - Complete Stripe SDK replacement
   - All functions return mock data
   - No actual API calls to Stripe

### Frontend (Client)

1. **Payment Setup Modal** (`frontend/src/components/PaymentSetupModal.jsx`)
   - Shows development mode warnings
   - Uses dummy Stripe key if no real key is provided
   - Provides clear feedback about stubbed mode

2. **Rent Payment Modal** (`frontend/src/components/RentPaymentModal.jsx`)
   - Shows development mode warnings
   - Simulates payment processing
   - Clear indication that no real payments are charged

## How It Works

### Payment Setup Flow

1. **Initialize Payment Setup**
   - Creates a mock Stripe customer ID
   - Stores setup in database
   - Returns success response

2. **Complete Payment Setup**
   - Accepts any payment method ID
   - Simulates attaching payment method to customer
   - Stores mock payment method details
   - Marks setup as completed

### Payment Processing Flow

1. **Create Payment**
   - Creates mock payment intent
   - Stores payment record in database
   - Returns mock client secret

2. **Confirm Payment**
   - Simulates payment confirmation
   - Updates payment status to 'paid'
   - Generates mock transaction IDs

## Test Data

### Mock Payment Method Details
- **Brand**: Visa
- **Last 4**: 4242
- **Expiry**: 12/2025
- **Country**: CA

### Test Card Numbers
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

Use any future expiry date and any 3-digit CVC.

## Database Records

The stubbed system still creates real database records:

- **PaymentSetup**: Stores mock Stripe customer IDs and payment method details
- **Payment**: Stores payment records with mock Stripe payment intent IDs
- **All relationships**: Maintained as if real payments were processed

## Switching to Real Stripe

To switch from stubbed mode to real Stripe integration:

1. **Environment Variables**
   ```env
   STRIPE_SECRET_KEY=sk_test_your_real_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_real_key
   ```

2. **Restore Real Stripe SDK**
   - Replace `server/utils/stripe.js` with real Stripe SDK
   - Update controllers to use real Stripe functions
   - Remove stubbed function implementations

3. **Update Frontend**
   - Remove development mode warnings
   - Use real Stripe publishable key
   - Update success messages

## Development Benefits

1. **No API Keys Required**: Development can proceed without Stripe account
2. **No Real Charges**: Safe testing without financial risk
3. **Full Flow Testing**: Complete payment flow can be tested
4. **Database Integration**: Real database records are created
5. **UI/UX Development**: Frontend can be fully developed and tested

## Limitations

1. **No Real Payment Processing**: All payments are simulated
2. **No Webhook Testing**: Stripe webhooks are not simulated
3. **Limited Error Scenarios**: Only basic error handling is simulated
4. **No Refund Testing**: Refund functionality is basic simulation

## Testing

### Manual Testing
1. Register as a tenant
2. Apply for a property
3. Set up payment method (use test card)
4. Make a rent payment
5. Check payment history

### Automated Testing
- All payment endpoints return expected responses
- Database records are created correctly
- Frontend components work as expected

## Notes

- All stubbed functions include "(STUBBED)" in their success messages
- Development mode warnings are shown in the UI
- Console logs indicate when stubbed functions are called
- No real Stripe API calls are made in stubbed mode 