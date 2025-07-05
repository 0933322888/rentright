import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Stubbed DocuSign configuration for development
const STUBBED_CONFIG = {
  integrationKey: 'stubbed-integration-key',
  accountId: 'stubbed-account-id',
  basePath: 'https://demo.docusign.net/restapi',
  oAuthBasePath: 'account-d.docusign.com',
};

// Mock envelope storage for development
const mockEnvelopes = new Map();
const mockSigningUrls = new Map();

// Generate mock envelope ID
const generateMockEnvelopeId = () => {
  return `stubbed-envelope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get JWT token for DocuSign authentication (stubbed)
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

    // Return a mock access token
    const mockAccessToken = `stubbed-access-token-${Date.now()}`;
    
    console.log('🔧 [STUBBED] DocuSign authentication successful');
    res.json({ 
      access_token: mockAccessToken,
      expires_in: 3600,
      token_type: 'Bearer'
    });
  } catch (error) {
    console.error('Error in stubbed DocuSign authentication:', error);
    res.status(500).json({ error: 'Failed to authenticate with DocuSign' });
  }
});

// Generate lease agreement PDF (stubbed)
router.post('/generate-lease', async (req, res) => {
  try {
    const { leaseDetails } = req.body;
    
    // Create a mock PDF base64 string
    const mockPdfBase64 = 'JVBERi0xLjQKJcOkw7zDtsO...'; // Truncated for brevity
    
    console.log('🔧 [STUBBED] Lease agreement PDF generated');
    
    res.json({ 
      success: true, 
      leaseDocument: mockPdfBase64,
      message: 'Mock lease agreement generated successfully'
    });
  } catch (error) {
    console.error('Error generating stubbed lease agreement:', error);
    res.status(500).json({ error: 'Failed to generate lease agreement' });
  }
});

// Create envelope (stubbed)
router.post('/envelope/create', async (req, res) => {
  try {
    const { leaseDetails } = req.body;
    
    // Generate mock envelope ID
    const envelopeId = generateMockEnvelopeId();
    
    // Create mock envelope data
    const mockEnvelope = {
      envelopeId,
      status: 'sent',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      recipients: {
        signers: [
          {
            recipientId: '1',
            name: leaseDetails.landlord?.name || 'Landlord',
            email: leaseDetails.landlord?.email || 'landlord@example.com',
            status: 'sent',
            sentDateTime: new Date().toISOString()
          },
          {
            recipientId: '2',
            name: leaseDetails.tenant?.name || 'Tenant',
            email: leaseDetails.tenant?.email || 'tenant@example.com',
            status: 'sent',
            sentDateTime: new Date().toISOString()
          }
        ]
      }
    };
    
    // Store mock envelope
    mockEnvelopes.set(envelopeId, mockEnvelope);
    
    // Generate mock signing URL
    const signingUrl = `https://demo.docusign.net/Member/SigningStart.aspx?t=${envelopeId}`;
    mockSigningUrls.set(envelopeId, signingUrl);
    
    console.log('🔧 [STUBBED] DocuSign envelope created:', envelopeId);
    
    res.json({ 
      envelopeId,
      signingUrl,
      status: 'sent',
      message: 'Mock envelope created successfully'
    });
  } catch (error) {
    console.error('Error creating stubbed envelope:', error);
    res.status(500).json({ error: 'Failed to create envelope' });
  }
});

// Get envelope status (stubbed)
router.get('/envelope/:envelopeId/status', async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    const envelope = mockEnvelopes.get(envelopeId);
    if (!envelope) {
      return res.status(404).json({ error: 'Envelope not found' });
    }
    
    console.log('🔧 [STUBBED] Envelope status retrieved:', envelopeId);
    
    res.json(envelope);
  } catch (error) {
    console.error('Error getting stubbed envelope status:', error);
    res.status(500).json({ error: 'Failed to get envelope status' });
  }
});

// Get signing URL (stubbed)
router.get('/envelope/:envelopeId/signing-url', async (req, res) => {
  try {
    const { envelopeId } = req.params;
    
    const signingUrl = mockSigningUrls.get(envelopeId);
    if (!signingUrl) {
      return res.status(404).json({ error: 'Signing URL not found' });
    }
    
    console.log('🔧 [STUBBED] Signing URL retrieved:', envelopeId);
    
    res.json({ 
      signingUrl,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  } catch (error) {
    console.error('Error getting stubbed signing URL:', error);
    res.status(500).json({ error: 'Failed to get signing URL' });
  }
});

// Simulate signing completion (for testing)
router.post('/envelope/:envelopeId/simulate-signing', async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { recipientId, action } = req.body; // 'sign' or 'decline'
    
    const envelope = mockEnvelopes.get(envelopeId);
    if (!envelope) {
      return res.status(404).json({ error: 'Envelope not found' });
    }
    
    // Update signer status
    const signer = envelope.recipients.signers.find(s => s.recipientId === recipientId);
    if (signer) {
      if (action === 'sign') {
        signer.status = 'completed';
        signer.signedDateTime = new Date().toISOString();
      } else if (action === 'decline') {
        signer.status = 'declined';
        signer.declinedDateTime = new Date().toISOString();
      }
    }
    
    // Check if all signers have completed
    const allCompleted = envelope.recipients.signers.every(s => s.status === 'completed');
    if (allCompleted) {
      envelope.status = 'completed';
      envelope.completedDateTime = new Date().toISOString();
    }
    
    console.log('🔧 [STUBBED] Signing simulation completed:', envelopeId, action);
    
    res.json({ 
      success: true,
      envelope: envelope,
      message: `Mock signing ${action} completed`
    });
  } catch (error) {
    console.error('Error simulating signing:', error);
    res.status(500).json({ error: 'Failed to simulate signing' });
  }
});

// Webhook for DocuSign events (stubbed)
router.post('/webhook', async (req, res) => {
  try {
    const { event, envelopeId } = req.body;
    
    console.log('🔧 [STUBBED] DocuSign webhook received:', event, envelopeId);
    
    // Handle different DocuSign events
    switch (event) {
      case 'envelope-sent':
        console.log('🔧 [STUBBED] Envelope sent for signing');
        break;
      case 'recipient-completed':
        console.log('🔧 [STUBBED] Recipient completed signing');
        break;
      case 'envelope-completed':
        console.log('🔧 [STUBBED] Envelope completed');
        break;
      default:
        console.log('🔧 [STUBBED] Unhandled DocuSign event:', event);
    }
    
    res.json({ success: true, message: 'Mock webhook processed' });
  } catch (error) {
    console.error('Error handling stubbed DocuSign webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Development helper endpoint to list all mock envelopes
router.get('/debug/envelopes', async (req, res) => {
  try {
    const envelopes = Array.from(mockEnvelopes.entries()).map(([id, envelope]) => ({
      envelopeId: id,
      status: envelope.status,
      created: envelope.created,
      recipients: envelope.recipients
    }));
    
    res.json({ 
      envelopes,
      count: envelopes.length,
      message: 'Mock envelopes for development'
    });
  } catch (error) {
    console.error('Error listing mock envelopes:', error);
    res.status(500).json({ error: 'Failed to list envelopes' });
  }
});

export default router; 