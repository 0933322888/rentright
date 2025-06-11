import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import DownloadIcon from '@mui/icons-material/Download';

const LeaseAgreement = ({ leaseDetails }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signingUrl, setSigningUrl] = useState(null);
  const [envelopeStatus, setEnvelopeStatus] = useState(null);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (leaseDetails.envelopeId) {
      fetchEnvelopeStatus();
    }
  }, [leaseDetails.envelopeId]);

  const fetchEnvelopeStatus = async () => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.DOCUSIGN}/envelope/${leaseDetails.envelopeId}/status`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setEnvelopeStatus(response.data);
    } catch (error) {
      console.error('Error fetching envelope status:', error);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setPreviewLoading(true);
      const response = await axios.get(
        `${API_ENDPOINTS.DOCUSIGN}/preview-lease`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { leaseId: leaseDetails._id },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error('Error fetching PDF preview:', error);
      toast.error('Failed to load PDF preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_ENDPOINTS.DOCUSIGN}/download-lease`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { leaseId: leaseDetails._id },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lease-agreement-${leaseDetails._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSigning = async () => {
    try {
      setLoading(true);
      
      // Create envelope and get signing URL through backend
      const response = await axios.post(
        `${API_ENDPOINTS.DOCUSIGN}/envelope/create`,
        { leaseDetails },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      const { envelopeId, signingUrl } = response.data;
      
      // Update lease details with envelope ID
      await axios.put(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/envelope`,
        { envelopeId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      setSigningUrl(signingUrl);
      setShowSigningDialog(true);
      toast.success('Lease agreement sent for signing');
    } catch (error) {
      console.error('Error initiating signing:', error);
      toast.error('Failed to initiate signing process');
    } finally {
      setLoading(false);
    }
  };

  const handleSigningComplete = () => {
    setShowSigningDialog(false);
    fetchEnvelopeStatus();
  };

  const getSigningStatus = () => {
    if (!envelopeStatus) return null;

    const isLandlord = leaseDetails.landlord._id === localStorage.getItem('userId');
    const signer = envelopeStatus.recipients.signers.find(
      s => s.recipientId === (isLandlord ? '1' : '2')
    );

    if (!signer) return null;

    return {
      status: signer.status,
      signedAt: signer.signedDateTime,
      color: signer.status === 'completed' ? 'success' : 'warning'
    };
  };

  const formatLocation = (location) => {
    if (!location) return '';
    const { street, city, state, zipCode } = location;
    return `${street}, ${city}, ${state} ${zipCode}`;
  };

  const handleTerminate = async () => {
    if (!window.confirm('Are you sure you want to terminate this lease? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.post(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/terminate`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Lease terminated successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error terminating lease:', err);
      toast.error('Failed to terminate lease');
    }
  };

  const signingStatus = getSigningStatus();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Lease Agreement</h2>
          {signingStatus && (
            <Chip
              label={signingStatus.status.charAt(0).toUpperCase() + signingStatus.status.slice(1)}
              color={signingStatus.color}
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Tooltip title="Preview PDF">
            <IconButton
              onClick={handlePreviewPDF}
              disabled={loading || previewLoading}
              color="primary"
            >
              {previewLoading ? <CircularProgress size={24} /> : <PreviewIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton
              onClick={handleDownloadPDF}
              disabled={loading}
              color="primary"
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          {!leaseDetails.envelopeId && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleInitiateSigning}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Preparing...' : 'Send for Signing'}
            </Button>
          )}
          <Button
            variant="contained"
            color="error"
            onClick={handleTerminate}
            disabled={loading}
          >
            Terminate Lease
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Name</p>
              <p className="font-medium">{leaseDetails.property.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{formatLocation(leaseDetails.property.location)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Rent</p>
              <p className="font-medium">${leaseDetails.property.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lease Start Date</p>
              <p className="font-medium">{new Date(leaseDetails.startDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
          <div className="prose max-w-none">
            <ul className="list-disc pl-5 space-y-2">
              <li>Monthly rent payment is due on the 1st of each month</li>
              <li>A late fee of $50 will be charged for payments received after the 5th of the month</li>
              <li>Tenant is responsible for utilities unless otherwise specified</li>
              <li>Security deposit is equal to one month's rent</li>
              <li>Tenant must provide 30 days notice before moving out</li>
              <li>No smoking allowed on the premises</li>
              <li>Pets are subject to landlord approval and may require additional deposit</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Important Documents</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Lease Agreement PDF</p>
                <p className="text-sm text-gray-600">
                  {leaseDetails.envelopeId 
                    ? 'View the signed lease agreement'
                    : 'Download the complete lease agreement'}
                </p>
              </div>
              {leaseDetails.envelopeId ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => window.open(signingUrl, '_blank')}
                >
                  View Document
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleInitiateSigning}
                  disabled={loading}
                >
                  {loading ? 'Preparing...' : 'Send for Signing'}
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Move-in Checklist</p>
                <p className="text-sm text-gray-600">Property condition report</p>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {/* Handle download */}}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showSigningDialog}
        onClose={() => setShowSigningDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Sign Lease Agreement</DialogTitle>
        <DialogContent>
          <Box sx={{ height: '600px', width: '100%' }}>
            {signingUrl ? (
              <iframe
                src={signingUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                onLoad={handleSigningComplete}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSigningDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showPreviewDialog}
        onClose={() => {
          setShowPreviewDialog(false);
          if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Lease Agreement Preview</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadPDF}
              startIcon={<DownloadIcon />}
            >
              Download
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '80vh', width: '100%' }}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Lease Agreement Preview"
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%' 
              }}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPreviewDialog(false);
            if (previewUrl) {
              window.URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LeaseAgreement; 