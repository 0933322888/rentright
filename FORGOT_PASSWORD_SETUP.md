# Forgot Password Setup Guide

This guide explains how to set up the forgot password functionality for the RentRight application.

## Backend Setup

### 1. Environment Variables

Add the following environment variables to your `server/.env` file:

```env
# Email Configuration (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:5173

# Optional: SendGrid Configuration (alternative to Gmail)
# SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 2. Email Service Configuration

#### Option A: Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. Use the generated app password in `EMAIL_PASSWORD`

#### Option B: SendGrid Setup
1. Create a SendGrid account
2. Get your API key
3. Uncomment the SendGrid configuration in `server/utils/emailService.js`
4. Comment out the Gmail configuration
5. Use your SendGrid API key in `SENDGRID_API_KEY`

### 3. Database Schema Updates

The user model has been updated with the following fields:
- `resetPasswordToken`: Stores the hashed reset token
- `resetPasswordExpires`: Stores the expiration timestamp

## Frontend Setup

The frontend is already configured with:
- `/forgot-password` route for requesting password reset
- `/reset-password` route for setting new password
- Updated login page with forgot password link

## How It Works

### 1. Request Password Reset
1. User visits `/forgot-password`
2. Enters their email address
3. System generates a secure token and sends reset email
4. Token expires in 10 minutes

### 2. Reset Password
1. User clicks link in email (goes to `/reset-password?token=...`)
2. System validates the token
3. User enters new password
4. Password is updated and user is redirected to login

### 3. Security Features
- Tokens are hashed before storage
- Tokens expire after 10 minutes
- Same response message regardless of email existence (prevents email enumeration)
- Password validation (minimum 6 characters)
- Secure token generation using crypto.randomBytes

## Testing

### Test the Flow
1. Start both frontend and backend servers
2. Go to `/login` and click "Forgot password?"
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link and set a new password
6. Try logging in with the new password

### Test Error Cases
- Try with non-existent email (should show same success message)
- Try with expired token (should show error)
- Try with invalid token (should show error)
- Try with short password (should show validation error)

## Troubleshooting

### Email Not Sending
1. Check your email credentials
2. Ensure 2FA is enabled for Gmail
3. Use app password, not regular password
4. Check server logs for email errors

### Token Validation Issues
1. Check if the token is being properly passed in URL
2. Verify the token hasn't expired
3. Check server logs for validation errors

### Frontend Issues
1. Ensure routes are properly configured in `App.jsx`
2. Check browser console for errors
3. Verify API endpoints are accessible

## Security Notes

- Reset tokens are automatically cleared after use
- Tokens expire after 10 minutes
- Passwords are hashed using bcrypt
- Email addresses are not revealed in error messages
- All tokens are cryptographically secure 