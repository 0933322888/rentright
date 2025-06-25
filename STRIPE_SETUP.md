# Stripe Payment Integration Setup

This guide will help you set up Stripe payment functionality for the RentRight application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. The RentRight application running

## Backend Setup

### 1. Install Dependencies

Navigate to the server directory and install the Stripe package:

```bash
cd server
npm install stripe
```

### 2. Environment Variables

Add the following environment variables to your `server/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Get Your Stripe Keys

1. Log in to your Stripe Dashboard
2. Go to Developers > API keys
3. Copy your Publishable key and Secret key
4. Replace the placeholder values in your `.env` file

**Important:** Use test keys for development and live keys for production.

## Frontend Setup

### 1. Install Dependencies

Navigate to the frontend directory and install the Stripe packages:

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Environment Variables

Create a `.env` file in the frontend directory and add:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Database Setup

The application will automatically create the necessary database collections when you first run it:

- `payments` - Stores payment records
- `paymentsetups` - Stores payment method setup information

## Testing the Integration

### 1. Test Card Numbers

Use these test card numbers for testing:

- **Visa:** 4242424242424242
- **Visa (debit):** 4000056655665556
- **Mastercard:** 5555555555554444
- **American Express:** 378282246310005

Use any future expiry date and any 3-digit CVC.

### 2. Test the Flow

1. **Application Approval:** When a landlord approves a tenant's application, the tenant will be prompted to set up payment
2. **Payment Setup:** Tenants can set up their payment method using the "Setup Payment" button
3. **Rent Payment:** Once payment is set up, tenants can make rent payments using the "Pay Rent" button

## Features Implemented

### Backend Features

- **Payment Setup Management:** Initialize and complete payment setup for tenants
- **Stripe Customer Creation:** Automatically create Stripe customers for tenants
- **Payment Processing:** Handle rent payments through Stripe
- **Payment History:** Track all payment transactions
- **Payment Status Management:** Handle payment confirmations and failures

### Frontend Features

- **Payment Setup Modal:** Secure form for tenants to enter payment information
- **Rent Payment Modal:** Interface for making rent payments
- **Payment Status Display:** Show payment setup status and payment history
- **Integration with Dashboard:** Seamless integration with tenant dashboard

## API Endpoints

### Payment Setup Endpoints

- `POST /api/payment-setup/initialize/:tenantId` - Initialize payment setup
- `POST /api/payment-setup/complete/:tenantId` - Complete payment setup
- `GET /api/payment-setup/status/:tenantId` - Get payment setup status
- `PUT /api/payment-setup/update/:tenantId` - Update payment method
- `DELETE /api/payment-setup/:tenantId` - Delete payment setup

### Payment Endpoints

- `POST /api/payments` - Create a new payment
- `POST /api/payments/confirm` - Confirm payment with Stripe
- `GET /api/payments/tenant/:id` - Get tenant's payment history
- `GET /api/payments/intent/:paymentIntentId/status` - Get payment intent status

## Security Considerations

1. **Never expose secret keys:** Only use publishable keys in the frontend
2. **Use HTTPS in production:** Always use HTTPS for payment processing
3. **Validate payments server-side:** All payment confirmations are validated on the server
4. **PCI Compliance:** Stripe handles PCI compliance for card data

## Troubleshooting

### Common Issues

1. **"Stripe is not defined" error:**
   - Make sure you've installed the Stripe packages
   - Check that your environment variables are set correctly

2. **Payment setup fails:**
   - Verify your Stripe keys are correct
   - Check the server logs for detailed error messages
   - Ensure you're using test keys for development

3. **Payment confirmation fails:**
   - Check that the payment intent exists
   - Verify the payment method is attached to the customer
   - Check Stripe dashboard for payment status

### Debug Mode

To enable debug logging, add this to your server environment:

```env
STRIPE_DEBUG=true
```

## Production Deployment

1. **Switch to Live Keys:** Replace test keys with live keys
2. **Update Environment Variables:** Set production environment variables
3. **Enable HTTPS:** Ensure your production environment uses HTTPS
4. **Monitor Payments:** Use Stripe Dashboard to monitor payments
5. **Set Up Webhooks:** Configure webhooks for payment status updates

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application-specific issues, check the application logs and error messages. 