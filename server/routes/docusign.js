import express from 'express';
import pkg from 'docusign-esign';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// DocuSign configuration
const config = {
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
  accountId: process.env.DOCUSIGN_ACCOUNT_ID,
  basePath: process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi',
  oAuthBasePath: process.env.DOCUSIGN_OAUTH_BASE_PATH || 'account-d.docusign.com',
  privateKeyPath: process.env.DOCUSIGN_PRIVATE_KEY_PATH,
};

// Initialize DocuSign API client
const apiClient = new pkg.ApiClient({
  basePath: config.basePath,
  accessToken: null,
});

// Get JWT token for DocuSign authentication
router.post('/auth', async (req, res) => {
  try {
    // Verify user's JWT token
    const userToken = req.headers.authorization?.split(' ')[1];
    if (!userToken) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Read private key
    const privateKey = fs.readFileSync(path.resolve(config.privateKeyPath));

    // Create JWT token for DocuSign
    const jwtToken = jwt.sign(
      {
        iss: config.integrationKey,
        sub: config.accountId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: config.oAuthBasePath,
        scope: 'signature impersonation'
      },
      privateKey,
      { algorithm: 'RS256' }
    );

    // Get access token from DocuSign
    const oAuth = new pkg.OAuth(apiClient);
    const tokenInfo = await oAuth.requestJWTUserToken(
      config.integrationKey,
      config.accountId,
      ['signature', 'impersonation'],
      jwtToken,
      3600
    );

    res.json({ access_token: tokenInfo.access_token });
  } catch (error) {
    console.error('Error in DocuSign authentication:', error);
    res.status(500).json({ error: 'Failed to authenticate with DocuSign' });
  }
});

// Generate lease agreement PDF
router.post('/generate-lease', async (req, res) => {
  try {
    const { leaseDetails } = req.body;
    
    // Here you would typically use a PDF generation library like PDFKit
    // to create the lease agreement PDF with the provided details
    // For now, we'll return a mock PDF
    
    const mockPdf = 'mock-pdf-base64-string'; // Replace with actual PDF generation
    
    res.json({ 
      success: true, 
      leaseDocument: mockPdf 
    });
  } catch (error) {
    console.error('Error generating lease agreement:', error);
    res.status(500).json({ error: 'Failed to generate lease agreement' });
  }
});

// Webhook for DocuSign events
router.post('/webhook', async (req, res) => {
  try {
    const { event, envelopeId } = req.body;
    
    // Handle different DocuSign events
    switch (event) {
      case 'envelope-sent':
        // Update lease status to 'sent for signing'
        break;
      case 'recipient-completed':
        // Update recipient's signing status
        break;
      case 'envelope-completed':
        // Update lease status to 'signed'
        // Notify both parties
        break;
      default:
        console.log('Unhandled DocuSign event:', event);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling DocuSign webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router; 