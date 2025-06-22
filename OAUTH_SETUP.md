# OAuth Setup Guide for RentRight

This guide will help you set up OAuth authentication for Google, Facebook, and LinkedIn in your RentRight application.

## Prerequisites

- Node.js and npm installed
- MongoDB database running
- Domain name (for production) or localhost (for development)

## Environment Variables

Add the following variables to your `.env` file in the `server` directory:

```env
# Session Configuration
SESSION_SECRET=your_session_secret_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# OAuth Configuration
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/api/auth/linkedin/callback
```

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "RentRight"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email` and `profile`
5. Add test users (your email addresses)

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
5. Copy the Client ID and Client Secret to your `.env` file

## Facebook OAuth Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" app type
4. Fill in app details

### 2. Configure Facebook Login

1. In your app dashboard, go to "Add Product" > "Facebook Login"
2. Choose "Web" platform
3. Add your site URL:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)
4. Add Valid OAuth Redirect URIs:
   - `http://localhost:5000/api/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/auth/facebook/callback` (production)

### 3. Get App Credentials

1. Go to "Settings" > "Basic"
2. Copy the App ID and App Secret to your `.env` file
3. Add your domain to "App Domains"

## LinkedIn OAuth Setup

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. Fill in app details
4. Request access to "Sign In with LinkedIn" product

### 2. Configure OAuth Settings

1. Go to "Auth" tab
2. Add redirect URLs:
   - `http://localhost:5000/api/auth/linkedin/callback` (development)
   - `https://yourdomain.com/api/auth/linkedin/callback` (production)
3. Request scopes: `r_emailaddress` and `r_liteprofile`

### 3. Get App Credentials

1. Go to "Auth" tab
2. Copy the Client ID and Client Secret to your `.env` file

## Installation

1. Install the required packages in the server directory:

```bash
cd server
npm install passport passport-google-oauth20 passport-facebook passport-linkedin-oauth2 express-session
```

2. The OAuth configuration is already set up in the codebase:
   - `server/config/passport.js` - Passport strategies
   - `server/controllers/authController.js` - OAuth routes
   - `server/routes/authRoutes.js` - OAuth endpoints
   - `frontend/src/components/SocialLogin.jsx` - Social login buttons
   - `frontend/src/pages/OAuthSuccess.jsx` - Success handler
   - `frontend/src/pages/OAuthError.jsx` - Error handler

## Testing

1. Start your server:
```bash
cd server
npm run dev
```

2. Start your frontend:
```bash
cd frontend
npm run dev
```

3. Navigate to `http://localhost:3000/register` or `http://localhost:3000/login`
4. Test the social login buttons

## Production Deployment

### 1. Update Environment Variables

For production, update your environment variables:

```env
FRONTEND_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/auth/facebook/callback
LINKEDIN_CALLBACK_URL=https://yourdomain.com/api/auth/linkedin/callback
NODE_ENV=production
```

### 2. Update OAuth Provider Settings

1. **Google**: Add your production domain to authorized redirect URIs
2. **Facebook**: Add your production domain to Valid OAuth Redirect URIs
3. **LinkedIn**: Add your production domain to redirect URLs

### 3. Security Considerations

- Use strong, unique session secrets
- Enable HTTPS in production
- Regularly rotate OAuth client secrets
- Monitor OAuth usage and errors
- Implement rate limiting for OAuth endpoints

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that your callback URLs match exactly in both your app and OAuth provider settings
   - Ensure no trailing slashes or extra characters

2. **"App not configured" error**
   - Verify your OAuth app is properly configured and approved
   - Check that required APIs are enabled

3. **"Scope not allowed" error**
   - Ensure you've requested the correct scopes from the OAuth provider
   - Check that your app has been approved for the requested scopes

4. **Session issues**
   - Verify your SESSION_SECRET is set and secure
   - Check that cookies are being set properly

### Debug Mode

To enable debug logging, add this to your server startup:

```javascript
// In server.js
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the server logs for backend errors
3. Verify all environment variables are set correctly
4. Test with a single OAuth provider first
5. Ensure your OAuth apps are properly configured and approved

## Security Best Practices

1. **Never commit OAuth secrets to version control**
2. **Use environment variables for all sensitive data**
3. **Implement proper session management**
4. **Add rate limiting to prevent abuse**
5. **Monitor OAuth usage and implement alerts**
6. **Regularly audit OAuth permissions and scopes**
7. **Implement proper error handling and logging**
8. **Use HTTPS in production**
9. **Validate and sanitize all user data**
10. **Implement proper logout functionality** 