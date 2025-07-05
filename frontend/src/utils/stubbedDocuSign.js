/**
 * Stubbed DocuSign utilities for development
 * This file provides mock implementations of DocuSign functionality
 * to enable development and testing without real DocuSign integration
 */

// Mock DocuSign configuration
const STUBBED_CONFIG = {
  clientId: 'stubbed-client-id',
  accountId: 'stubbed-account-id',
  basePath: 'https://demo.docusign.net/restapi',
};

// Mock envelope storage
const mockEnvelopes = new Map();

const LOCAL_STORAGE_KEY = 'stubbedDocuSignEnvelopes';

// Load from localStorage
function loadEnvelopes() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      const obj = JSON.parse(data);
      for (const [id, env] of Object.entries(obj)) {
        mockEnvelopes.set(id, env);
      }
    } catch {}
  }
}

// Save to localStorage
function saveEnvelopes() {
  const obj = {};
  for (const [id, env] of mockEnvelopes.entries()) {
    obj[id] = env;
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
}

// Call loadEnvelopes() on module load
loadEnvelopes();

/**
 * Initialize stubbed DocuSign
 */
export const initializeStubbedDocuSign = () => {
  console.log('🔧 [STUBBED] DocuSign initialized for development');
  return Promise.resolve({
    success: true,
    message: 'Stubbed DocuSign initialized',
    config: STUBBED_CONFIG
  });
};

/**
 * Create a mock envelope
 */
export const createStubbedEnvelope = (leaseDetails) => {
  console.log('🔧 [STUBBED] Creating envelope with leaseDetails structure:', {
    hasProperty: !!leaseDetails?.property,
    hasLandlord: !!leaseDetails?.landlord,
    propertyLandlord: !!leaseDetails?.property?.landlord,
    tenant: !!leaseDetails?.tenant
  });
  
  const envelopeId = `stubbed-envelope-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const mockEnvelope = {
    envelopeId,
    status: 'sent',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    recipients: {
      signers: [
        {
          recipientId: '1',
          name: leaseDetails?.property?.landlord?.name || leaseDetails?.landlord?.name || 'Landlord',
          email: leaseDetails?.property?.landlord?.email || leaseDetails?.landlord?.email || 'landlord@example.com',
          status: 'sent',
          sentDateTime: new Date().toISOString()
        },
        {
          recipientId: '2',
          name: leaseDetails?.tenant?.name || 'Tenant',
          email: leaseDetails?.tenant?.email || 'tenant@example.com',
          status: 'sent',
          sentDateTime: new Date().toISOString()
        }
      ]
    }
  };
  
  mockEnvelopes.set(envelopeId, mockEnvelope);
  
  console.log('🔧 [STUBBED] Envelope created:', envelopeId);
  
  saveEnvelopes();
  
  return Promise.resolve({
    envelopeId,
    signingUrl: `https://demo.docusign.net/Member/SigningStart.aspx?t=${envelopeId}`,
    status: 'sent',
    message: 'Mock envelope created successfully'
  });
};

/**
 * Get mock envelope status
 */
export const getStubbedEnvelopeStatus = (envelopeId) => {
  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return Promise.reject(new Error('Envelope not found'));
  }
  
  console.log('🔧 [STUBBED] Envelope status retrieved:', envelopeId);
  
  return Promise.resolve(envelope);
};

/**
 * Get mock signing URL
 */
export const getStubbedSigningUrl = (envelopeId) => {
  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return Promise.reject(new Error('Envelope not found'));
  }
  
  console.log('🔧 [STUBBED] Signing URL retrieved:', envelopeId);
  
  return Promise.resolve({
    signingUrl: `https://demo.docusign.net/Member/SigningStart.aspx?t=${envelopeId}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  });
};

/**
 * Simulate signing completion (for testing)
 */
export const simulateStubbedSigning = (envelopeId, recipientId, action = 'sign') => {
  const envelope = mockEnvelopes.get(envelopeId);
  if (!envelope) {
    return Promise.reject(new Error('Envelope not found'));
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
  
  saveEnvelopes();
  
  return Promise.resolve({
    success: true,
    envelope: envelope,
    message: `Mock signing ${action} completed`
  });
};

/**
 * Generate mock lease agreement PDF
 */
export const generateStubbedLeasePDF = (leaseDetails) => {
  console.log('🔧 [STUBBED] Lease agreement PDF generated');
  
  return Promise.resolve({
    success: true,
    leaseDocument: 'JVBERi0xLjQKJcOkw7zDtsO...', // Mock PDF base64
    message: 'Mock lease agreement generated successfully'
  });
};

/**
 * Get all mock envelopes (for debugging)
 */
export const getAllStubbedEnvelopes = () => {
  const envelopes = Array.from(mockEnvelopes.entries()).map(([id, envelope]) => ({
    envelopeId: id,
    status: envelope.status,
    created: envelope.created,
    recipients: envelope.recipients
  }));
  
  return Promise.resolve({
    envelopes,
    count: envelopes.length,
    message: 'Mock envelopes for development'
  });
};

/**
 * Clear all mock envelopes (for testing)
 */
export const clearStubbedEnvelopes = () => {
  mockEnvelopes.clear();
  console.log('🔧 [STUBBED] All mock envelopes cleared');
  saveEnvelopes();
  return Promise.resolve({
    success: true,
    message: 'All mock envelopes cleared'
  });
};

/**
 * Check if DocuSign is stubbed
 */
export const isDocuSignStubbed = () => {
  return true; // Always true in this stubbed implementation
};

/**
 * Get stubbed configuration
 */
export const getStubbedConfig = () => {
  return STUBBED_CONFIG;
};

export default {
  initializeStubbedDocuSign,
  createStubbedEnvelope,
  getStubbedEnvelopeStatus,
  getStubbedSigningUrl,
  simulateStubbedSigning,
  generateStubbedLeasePDF,
  getAllStubbedEnvelopes,
  clearStubbedEnvelopes,
  isDocuSignStubbed,
  getStubbedConfig
}; 