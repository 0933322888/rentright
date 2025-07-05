import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  createStubbedEnvelope, 
  getStubbedEnvelopeStatus, 
  getStubbedSigningUrl,
  simulateStubbedSigning,
  isDocuSignStubbed 
} from '../../utils/stubbedDocuSign';
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
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  Stack,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import DescriptionIcon from '@mui/icons-material/Description';
import { 
  CheckCircle as CheckCircleIcon, 
  Comment as CommentIcon, 
  Warning as WarningIcon, 
  Send as SendIcon, 
  RadioButtonUnchecked as UncheckedIcon, 
  RadioButtonChecked as CheckedIcon, 
  Pending as PendingIcon, 
  Schedule as ScheduleIcon, 
  Assignment as AssignmentIcon, 
  AssignmentTurnedIn as AssignmentTurnedInIcon, 
  Gavel as GavelIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { VALID_LOCATIONS } from '../../utils/leaseAgreementUtils.js';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const LeaseAgreement = ({ leaseDetails, onLeaseUpdate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signingUrl, setSigningUrl] = useState(null);
  const [envelopeStatus, setEnvelopeStatus] = useState(null);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [agreementStatus, setAgreementStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [stepStatus, setStepStatus] = useState({
    downloaded: false,
    reviewed: false,
    approved: false
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [signingCompleted, setSigningCompleted] = useState(false);
  const [currentEnvelopeId, setCurrentEnvelopeId] = useState(null);

  useEffect(() => {
    fetchLeaseAgreementDetails();
    if (leaseDetails._id) {
      fetchLeaseAgreementDocument();
    }
  }, [leaseDetails._id]);

  const fetchLeaseAgreementDetails = async () => {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
              // Lease agreement details and user role
      setAgreementStatus(response.data);
      setComments(response.data.comments || []);
      
      // Update steps based on status
      setStepStatus({
        downloaded: true, // Assuming the document is always available
        reviewed: true, // Always true since we removed review status
        approved: ['tenant_approved', 'landlord_approved', 'signed'].includes(response.data.status)
      });
    } catch (error) {
              // Error fetching lease agreement details
      toast.error('Failed to load lease agreement details');
    }
  };

  const getLocationInfo = (location) => {
    if (!location) {
              // Location data is missing
      return null;
    }

    // Check if state is a valid US state code
    if (location.state && VALID_LOCATIONS.US.includes(location.state)) {
      return {
        countryCode: 'US',
        region: location.state
      };
    }

    // Check if province is a valid Canadian province code
    if (location.province && VALID_LOCATIONS.CA.includes(location.province)) {
      return {
        countryCode: 'CA',
        region: location.province
      };
    }

    // If state/province is not in valid locations, try to determine country based on state/province format
    if (location.state) {
      // If state is 2 letters, assume it's a US state code
      if (/^[A-Z]{2}$/.test(location.state)) {
        return {
          countryCode: 'US',
          region: location.state
        };
      }
    }

    if (location.province) {
      // If province is 2 letters, assume it's a Canadian province code
      if (/^[A-Z]{2}$/.test(location.province)) {
        return {
          countryCode: 'CA',
          region: location.province
        };
      }
    }

            // Invalid location format
    return null;
  };

  const fetchLeaseAgreementDocument = async () => {
    try {
      // Get the property location from lease details
      if (!leaseDetails?.property?.location) {
        // Property location data is missing
        toast.error('Property location information is missing');
        return;
      }

      const locationInfo = getLocationInfo(leaseDetails.property.location);
      if (!locationInfo) {
        toast.error('Invalid property location format');
        return;
      }

      const { countryCode, region } = locationInfo;
      
      // Use different endpoints based on user role
      const endpoint = user?.role === 'admin' 
        ? `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}/file`
        : `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/file`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Update lease details with document info
      const updatedLeaseDetails = {
        ...leaseDetails,
        leaseAgreement: {
          ...leaseDetails.leaseAgreement,
          standardLeaseDocument: {
            url,
            originalName: `${countryCode}_${region}_lease_agreement.pdf`,
            mimeType: 'application/pdf',
            uploadedAt: new Date()
          }
        }
      };
      onLeaseUpdate(updatedLeaseDetails);
    } catch (error) {
      // Error fetching lease agreement document
      if (error.response?.status === 404) {
        toast.error('No lease agreement template available for this location');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to access this document');
      } else {
        toast.error('Failed to load lease agreement document');
      }
    }
  };

  const handlePreview = async () => {
    try {
      if (!leaseDetails?.property?.location) {
        // Property location data is missing
        toast.error('Property location information is missing');
        return;
      }

      const locationInfo = getLocationInfo(leaseDetails.property.location);
      if (!locationInfo) {
        toast.error('Invalid property location format');
        return;
      }

      const { countryCode, region } = locationInfo;
      const token = localStorage.getItem('token');
      
      // Use different endpoints based on user role
      const endpoint = user?.role === 'admin' 
        ? `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}/file`
        : `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/file`;

      const response = await axios.get(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        },
        responseType: 'blob'
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreviewDialog(true);
    } catch (error) {
      // Error accessing lease agreement
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view this file.');
      } else if (error.response?.status === 404) {
        toast.error('No lease agreement template available for this location');
      } else {
        toast.error('Failed to preview lease agreement. Please try again.');
      }
    }
  };

  const handleDownload = async () => {
    try {
      if (!leaseDetails?.property?.location) {
        // Property location data is missing
        toast.error('Property location information is missing');
        return;
      }

      const locationInfo = getLocationInfo(leaseDetails.property.location);
      if (!locationInfo) {
        toast.error('Invalid property location format');
        return;
      }

      const { countryCode, region } = locationInfo;
      
      // Use different endpoints based on user role
      const endpoint = user?.role === 'admin' 
        ? `${API_ENDPOINTS.ADMIN}/lease-agreements/${countryCode}/${region}/file`
        : `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/file`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${countryCode}_${region}_lease_agreement.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStepStatus(prev => ({ ...prev, downloaded: true }));
    } catch (error) {
      // Error downloading lease agreement
      if (error.response?.status === 404) {
        toast.error('No lease agreement template available for this location');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to download this file');
      } else {
        toast.error('Failed to download lease agreement');
      }
    }
  };

  const handleInitiateSigning = async () => {
    try {
      setLoading(true);
      
      // Use stubbed DocuSign for development
      if (isDocuSignStubbed()) {
        console.log('🔧 [STUBBED] Using stubbed DocuSign for signing initiation');
        
        const result = await createStubbedEnvelope(leaseDetails);
        const { envelopeId, signingUrl } = result;
        
        // Update lease details with envelope ID
        await axios.put(
          API_ENDPOINTS.APPLICATION_ENVELOPE(leaseDetails._id),
          { envelopeId },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        // Store envelope ID in local state for signing operations
        setCurrentEnvelopeId(envelopeId);
        
        setSigningUrl(signingUrl);
        setSigningCompleted(false);
        setShowSigningDialog(true);
        console.log('🔧 [STUBBED] Dialog opened with envelope ID:', envelopeId);
        toast.success('Lease agreement sent for signing (Stubbed Mode)');
      } else {
        // Real DocuSign implementation (for production)
        const response = await axios.post(
          `${API_ENDPOINTS.DOCUSIGN_ENVELOPE_CREATE}`,
          { leaseDetails },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        const { envelopeId, signingUrl } = response.data;
        
        // Update lease details with envelope ID
        await axios.put(
          API_ENDPOINTS.APPLICATION_ENVELOPE(leaseDetails._id),
          { envelopeId },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        // Store envelope ID in local state for signing operations
        setCurrentEnvelopeId(envelopeId);
        
        setSigningUrl(signingUrl);
        setSigningCompleted(false);
        setShowSigningDialog(true);
        toast.success('Lease agreement sent for signing');
      }
    } catch (error) {
      console.error('Error initiating signing:', error);
      toast.error('Failed to initiate signing process');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvelopeStatus = async () => {
    const envelopeId = currentEnvelopeId || leaseDetails.envelopeId;
    if (!envelopeId) return;
    
    try {
      if (isDocuSignStubbed()) {
        console.log('🔧 [STUBBED] Fetching envelope status for:', envelopeId);
        const status = await getStubbedEnvelopeStatus(envelopeId);
        setEnvelopeStatus(status);
      } else {
        // Real DocuSign implementation
        const response = await axios.get(
          `${API_ENDPOINTS.DOCUSIGN_ENVELOPE_STATUS(envelopeId)}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setEnvelopeStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching envelope status:', error);
    }
  };

  const handleSigningComplete = () => {
    setShowSigningDialog(false);
    fetchEnvelopeStatus();
  };

  const getSigningStatus = () => {
    if (!envelopeStatus) return null;

    // Get landlord ID from the correct path in leaseDetails
    const landlordId = leaseDetails?.property?.landlord?._id || leaseDetails?.landlord?._id;
    const currentUserId = localStorage.getItem('userId');
    
    if (!landlordId || !currentUserId) {
      console.warn('Missing landlord ID or current user ID for signing status');
      return null;
    }

    const isLandlord = landlordId === currentUserId;
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

  // Get signing status for both parties
  const getSigningStatusForRole = (role) => {
    if (!envelopeStatus) return null;
    
    const recipientId = role === 'landlord' ? '1' : '2';
    const signer = envelopeStatus.recipients.signers.find(s => s.recipientId === recipientId);
    
    if (!signer) return null;
    
    return {
      status: signer.status,
      signedAt: signer.signedDateTime,
      color: signer.status === 'completed' ? 'success' : 'warning'
    };
  };

  // Check if current user has already signed
  const hasCurrentUserSigned = () => {
    const signingStatus = getSigningStatus();
    return signingStatus?.status === 'completed';
  };

  // Check if all parties have signed
  const hasAllPartiesSigned = () => {
    if (!envelopeStatus) return false;
    return envelopeStatus.recipients.signers.every(s => s.status === 'completed');
  };

  // Check if signing step should be marked as completed
  const isSigningStepCompleted = () => {
    // Check if agreement status is signed OR if all parties have signed
    return agreementStatus?.status === 'signed' || hasAllPartiesSigned();
  };

  // Check if current user's signing is completed (for step icon)
  const isCurrentUserSigningCompleted = () => {
    return hasCurrentUserSigned();
  };

  // Check if current user has started signing (envelope created)
  const hasSigningStarted = () => {
    return !!leaseDetails.envelopeId;
  };

  // Check if current user can sign (hasn't signed yet but signing has started)
  const canCurrentUserSign = () => {
    return hasSigningStarted() && !hasCurrentUserSigned();
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
      // Error terminating lease
      toast.error('Failed to terminate lease');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadError('Only PDF files are allowed');
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setUploadError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document', selectedFile);

      const response = await axios.post(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/documents`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update lease details with new document
      const updatedLeaseDetails = {
        ...leaseDetails,
        tenantDocuments: [...(leaseDetails.tenantDocuments || []), response.data]
      };
      onLeaseUpdate(updatedLeaseDetails);

      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      setSelectedFile(null);
    } catch (error) {
      // Error uploading document
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      // Update lease details by removing the deleted document
      const updatedLeaseDetails = {
        ...leaseDetails,
        tenantDocuments: leaseDetails.tenantDocuments.filter(doc => doc._id !== documentId)
      };
      onLeaseUpdate(updatedLeaseDetails);

      toast.success('Document deleted successfully');
    } catch (error) {
      // Error deleting document
      toast.error('Failed to delete document');
    }
  };

  const handleAddComment = async (parentCommentId = null) => {
    const text = parentCommentId ? replyText : newComment;
    if (!text.trim()) return;

    try {
      const response = await axios.post(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/comments`,
        { 
          text,
          parentCommentId 
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setComments(response.data.comments);
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      // Error adding comment
      toast.error('Failed to add comment');
    }
  };

  const handleApprove = async () => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/status`,
        { action: 'approve' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setAgreementStatus(response.data);
      setStepStatus(prev => ({ ...prev, approved: true }));
      toast.success('Lease agreement approved successfully');
    } catch (error) {
      // Error approving lease agreement
      toast.error(error.response?.data?.message || 'Failed to approve lease agreement');
    }
  };

  const handleUpdateStartDate = async () => {
    if (!selectedDate) return;

    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/start-date`,
        { 
          leaseStartDate: selectedDate,
          action: 'set_date'
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setAgreementStatus(response.data);
      setShowDatePicker(false);
      toast.success('Lease start date updated successfully');
    } catch (error) {
      // Error updating lease start date
      toast.error(error.response?.data?.message || 'Failed to update lease start date');
    }
  };

  const handleApproveStartDate = async () => {
    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/start-date`,
        { action: 'approve_date' },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setAgreementStatus(response.data);
      toast.success('Lease start date approved successfully');
    } catch (error) {
      // Error approving lease start date
      toast.error(error.response?.data?.message || 'Failed to approve lease start date');
    }
  };

  const canApproveStartDate = () => {
    const currentDate = agreementStatus?.leaseStartDate;
    return currentDate && 
           currentDate.date && 
           currentDate.setBy && 
           currentDate.setBy !== user?.role && 
           !currentDate.approvedBy;
  };

  const getNextStepInfo = () => {
    if (!agreementStatus) return null;

    const { status } = agreementStatus;
    const isTenant = user?.role === 'tenant';
    const isLandlord = user?.role === 'landlord';

    // Show 'Lease Agreement Signed' message if both parties have signed (even if status !== 'signed')
    if (hasAllPartiesSigned()) {
      return {
        type: 'success',
        title: 'Lease Agreement Signed',
        message: 'Congratulations! The lease agreement has been signed by all parties. Your lease is now active.',
        action: 'You can view the signed document and manage your lease from your dashboard.'
      };
    }

    // Check if lease start date needs to be set or approved
    const leaseStartDate = agreementStatus.leaseStartDate;
    
    // --- PRIORITIZE landlord set date blocks ---
    // Case: Landlord changed lease start date and tenant needs to approve
    if (leaseStartDate?.date && leaseStartDate?.setBy === 'landlord' && !leaseStartDate?.approvedBy && isTenant) {
      return {
        type: 'warning',
        title: 'Approve New Lease Start Date',
        message: 'Please approve new lease start date proposed by landlord.',
        action: `Click "Approve Date" to approve the lease start date of ${format(new Date(leaseStartDate.date), 'PPP')}.`
      };
    }
    // Case: Landlord is waiting for tenant to approve the lease start date
    if (leaseStartDate?.date && leaseStartDate?.setBy === 'landlord' && !leaseStartDate?.approvedBy && isLandlord) {
      return {
        type: 'info',
        title: 'Wait for Tenant Approval',
        message: 'Please wait for tenant\'s approval of lease start date.',
        action: 'No action required at this time.'
      };
    }
    // Case: landlord needs to approve the lease start date
    if (leaseStartDate?.date && leaseStartDate?.setBy === 'tenant' && !leaseStartDate?.approvedBy && isLandlord) {
      return {
        type: 'info',
        title: 'Set or Approve Lease Start Date',
        message: 'Please approve or propose new lease start date for the property.',
        action: leaseStartDate?.date ? 'Click "Approve Date" to approve the current date or "Change" to set a new date.' : 'Click "Set Start Date" to propose a lease start date.'
      };
    }
    // Case: Tenant needs to approve lease start date (regardless of who originally set it)
    if (leaseStartDate?.date && !leaseStartDate?.approvedBy && isTenant && leaseStartDate?.setBy !== 'tenant') {
      return {
        type: 'warning',
        title: 'Approve Lease Start Date',
        message: 'Please approve new lease start date proposed by landlord.',
        action: `Click "Approve Date" to approve the lease start date of ${format(new Date(leaseStartDate.date), 'PPP')}.`
      };
    }
    // Case: Landlord is waiting for tenant to approve the lease start date (regardless of who originally set it)
    if (leaseStartDate?.date && !leaseStartDate?.approvedBy && isLandlord && leaseStartDate?.setBy !== 'landlord') {
      return {
        type: 'info',
        title: 'Wait for Tenant Approval',
        message: 'Please wait for tenant\'s approval of lease start date.',
        action: 'No action required at this time.'
      };
    }
    // Case: Check if landlord recently updated the lease start date (based on lastUpdatedAt)
    if (leaseStartDate?.date && leaseStartDate?.lastUpdatedAt && !leaseStartDate?.approvedBy) {
      const lastUpdate = new Date(leaseStartDate.lastUpdatedAt);
      const now = new Date();
      const timeDiff = now - lastUpdate;
      const isRecentUpdate = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
      
      if (isRecentUpdate && leaseStartDate?.setBy === 'landlord' && isTenant) {
        return {
          type: 'warning',
          title: 'Approve New Lease Start Date',
          message: 'Please approve new lease start date proposed by landlord.',
          action: `Click "Approve Date" to approve the lease start date of ${format(new Date(leaseStartDate.date), 'PPP')}.`
        };
      }
      
      if (isRecentUpdate && leaseStartDate?.setBy === 'landlord' && isLandlord) {
        return {
          type: 'info',
          title: 'Wait for Tenant Approval',
          message: 'Please wait for tenant\'s approval of lease start date.',
          action: 'No action required at this time.'
        };
      }
    }
    // --- END PRIORITY BLOCKS ---

    // Special case: When application is approved but lease start date needs attention
    if (leaseDetails?.status === 'approved' && (!leaseStartDate?.date || !leaseStartDate?.approvedBy)) {
      if (isLandlord) {
        return {
          type: 'info',
          title: 'Set or Approve Lease Start Date',
          message: 'Please approve or propose new lease start date for the property.',
          action: leaseStartDate?.date ? 'Click "Approve Date" to approve the current date or "Change" to set a new date.' : 'Click "Set Start Date" to propose a lease start date.'
        };
      } else if (isTenant) {
        return {
          type: 'info',
          title: 'Wait for Landlord Approval',
          message: 'Wait for the landlord to approve lease start date before proceeding to the next step.',
          action: 'No action required at this time.'
        };
      }
    }

    if (!leaseStartDate?.date) {
      return {
        type: 'info',
        title: 'Set Lease Start Date',
        message: 'The lease start date needs to be set before proceeding with the agreement.',
        action: 'Click "Set Start Date" to continue.'
      };
    }

    if (leaseStartDate.date && !leaseStartDate.approvedBy && canApproveStartDate()) {
      return {
        type: 'warning',
        title: 'Approve Lease Start Date',
        message: `The ${leaseStartDate.setBy === 'tenant' ? 'tenant' : 'landlord'} has set the lease start date to ${format(new Date(leaseStartDate.date), 'PPP')}. Please review and approve this date.`,
        action: 'Click "Approve Date" to continue.'
      };
    }

    // Check agreement approval status
    if (status === 'pending') {
      if (isTenant) {
        return {
          type: 'info',
          title: 'Review and Approve Agreement',
          message: 'Please review the lease agreement carefully. Once you approve it, the landlord will review your approval.',
          action: 'Click "Approve" when you are ready to proceed.'
        };
      } else if (isLandlord) {
        return {
          type: 'info',
          title: 'Wait for Lease Agreement tenant approval',
          message: 'The tenant needs to review and approve the lease agreement first. You will be notified when they approve it.',
          action: 'No action required at this time.'
        };
      }
    }

    if (status === 'tenant_approved') {
      if (isLandlord) {
        return {
          type: 'success',
          title: 'Tenant Has Approved Lease Agreement',
          message: 'The tenant has approved the lease agreement. Please review their approval and either approve the agreement or request changes.',
          action: 'Click "Approve" to finalize the agreement or "Request Changes" if modifications are needed.'
        };
      } else if (isTenant) {
        return {
          type: 'success',
          title: 'Approval Submitted',
          message: 'Your approval has been submitted. The landlord will now review and either approve the agreement or request changes.',
          action: 'Wait for the landlord\'s response.'
        };
      }
    }

    if (status === 'landlord_approved') {
      // Check if signing has already started
      if (leaseDetails.envelopeId) {
        const landlordSigned = getSigningStatusForRole('landlord')?.status === 'completed';
        const tenantSigned = getSigningStatusForRole('tenant')?.status === 'completed';
        
        if (landlordSigned && tenantSigned) {
          return {
            type: 'success',
            title: 'Lease Agreement Signed',
            message: 'Congratulations! The lease agreement has been signed by all parties. Your lease is now active.',
            action: 'You can view the signed document and manage your lease from your dashboard.'
          };
        } else if (landlordSigned && !tenantSigned) {
          return {
            type: 'info',
            title: 'Waiting for Tenant Signature',
            message: 'You have signed the lease agreement. Waiting for the tenant to complete their signature.',
            action: 'No action required at this time.'
          };
        } else if (!landlordSigned && tenantSigned) {
          return {
            type: 'warning',
            title: 'Tenant Has Signed',
            message: 'The tenant has signed the lease agreement. Please complete your signature to finalize the agreement.',
            action: 'Click "Send for Signing" to complete your signature.'
          };
        } else {
          return {
            type: 'info',
            title: 'Signing in Progress',
            message: 'The lease agreement is ready for signing. Both parties need to sign to complete the process.',
            action: 'Click "Send for Signing" to initiate the digital signing process.'
          };
        }
      }
      
      return {
        type: 'success',
        title: 'Agreement Approved',
        message: 'The lease agreement has been approved by both parties. You can now proceed with signing the document.',
        action: 'Click "Send for Signing" to initiate the digital signing process.'
      };
    }

    if (status === 'signed') {
      return {
        type: 'success',
        title: 'Lease Agreement Signed',
        message: 'Congratulations! The lease agreement has been signed by all parties. Your lease is now active.',
        action: 'You can view the signed document and manage your lease from your dashboard.'
      };
    }

    return null;
  };

  const signingStatus = getSigningStatus();

  const getStepIcon = (step, status) => {
    const iconProps = { sx: { fontSize: 28 } };
    
    switch (step) {
      case 'download':
        return status ? <AssignmentTurnedInIcon color="success" {...iconProps} /> : <AssignmentIcon color="action" {...iconProps} />;
      case 'review':
        return status ? <CheckCircleIcon color="success" {...iconProps} /> : <CommentIcon color="action" {...iconProps} />;
      case 'approve':
        return status ? <AssignmentTurnedInIcon color="success" {...iconProps} /> : <GavelIcon color="action" {...iconProps} />;
      case 'landlord':
        return status ? <CheckCircleIcon color="success" {...iconProps} /> : <ScheduleIcon color="action" {...iconProps} />;
      case 'sign':
        return status ? <AssignmentTurnedInIcon color="success" {...iconProps} /> : <SendIcon color="action" {...iconProps} />;
      case 'start-date':
        return status ? <CheckCircleIcon color="success" {...iconProps} /> : <CalendarTodayIcon color="action" {...iconProps} />;
      default:
        return <PendingIcon color="action" {...iconProps} />;
    }
  };

  const CommentItem = ({ comment, level = 0 }) => {
    const isLandlord = user?.role === 'landlord';
    const isTenant = user?.role === 'tenant';
    const canReply = (isLandlord && comment.role === 'tenant') || (isTenant && comment.role === 'landlord');

    return (
      <Box sx={{ ml: level * 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 1, 
            backgroundColor: level === 0 ? 'background.paper' : 'action.hover',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2">
                  {comment.user.firstName} {comment.user.lastName}
                </Typography>
                <Chip
                  label={comment.role}
                  size="small"
                  color={comment.role === 'tenant' ? 'primary' : 'secondary'}
                />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(comment.createdAt), 'PPp')}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {comment.text}
              </Typography>
              {canReply && !replyingTo && (
                <Button
                  size="small"
                  onClick={() => setReplyingTo(comment._id)}
                  sx={{ mt: 1 }}
                >
                  Reply
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {replyingTo === comment._id && (
          <Box sx={{ ml: 3, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              placeholder={`Reply to ${comment.user.firstName}'s comment...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={() => handleAddComment(comment._id)}
                disabled={!replyText.trim()}
                size="small"
              >
                Send Reply
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                size="small"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {comment.replies?.map((reply) => (
          <CommentItem key={reply._id} comment={reply} level={level + 1} />
        ))}
      </Box>
    );
  };

  const steps = [
    {
      id: 'start-date',
      title: 'Set Lease Start Date',
      description: 'Agree on the lease start date with the other party. The date must be approved by the party who did not set it.',
      status: !!agreementStatus?.leaseStartDate?.approvedBy,
      actions: (
        <Box>
          {!agreementStatus?.leaseStartDate?.date ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarTodayIcon />}
              onClick={() => setShowDatePicker(true)}
              size="small"
            >
              Set Start Date
            </Button>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Start Date: {format(new Date(agreementStatus.leaseStartDate.date), 'PPP')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Set by: {agreementStatus.leaseStartDate.setBy === 'tenant' ? 'Tenant' : 'Landlord'}
                  {agreementStatus.leaseStartDate.approvedBy && 
                    ` • Approved by: ${agreementStatus.leaseStartDate.approvedBy === 'tenant' ? 'Tenant' : 'Landlord'}`}
                </Typography>
              </Box>
              {!agreementStatus.leaseStartDate.approvedBy && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowDatePicker(true)}
                  >
                    Change
                  </Button>
                  {canApproveStartDate() && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={handleApproveStartDate}
                    >
                      Approve Date
                    </Button>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      )
    },
    {
      id: 'download',
      title: 'Download Agreement',
      description: 'Download and review the lease agreement document.',
      status: stepStatus.downloaded,
      actions: (
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          size="small"
        >
          Download
        </Button>
      )
    },
    {
      id: 'review',
      title: 'Review & Comment',
      description: 'Review the agreement and discuss any questions or concerns with the other party.',
      status: stepStatus.reviewed,
      content: (
        <Box>
          <Accordion>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: 'action.hover',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.selected',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CommentIcon color="action" />
                <Typography>Comments</Typography>
                <Chip 
                  label={comments.length} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  Click to {comments.length > 0 ? 'view' : 'add'} comments
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  placeholder="Add your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleAddComment()}
                  disabled={!newComment.trim()}
                  size="small"
                >
                  Add Comment
                </Button>
              </Box>
              {comments.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    {comments.filter(comment => !comment.parentCommentId).map((comment) => (
                      <CommentItem key={comment._id} comment={comment} />
                    ))}
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )
    },
    {
      id: 'approve',
      title: user?.role === 'tenant' ? 'Tenant Approval' : 'Landlord Approval',
      description: user?.role === 'tenant' 
        ? 'Review the agreement and approve it if you agree with the terms.'
        : 'Review the tenant\'s approval and either approve the agreement or request changes.',
      status: stepStatus.approved,
      actions: (
        <Box>
          {/* Rendering approve step */}
          {user?.role === 'tenant' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<CheckCircleIcon />}
              onClick={handleApprove}
              disabled={
                agreementStatus?.status === 'tenant_approved' ||
                agreementStatus?.status === 'signed'
              }
              size="small"
            >
              Approve
            </Button>
          )}
          {user?.role === 'landlord' && (
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleIcon />}
                onClick={handleApprove}
                disabled={
                  agreementStatus?.status !== 'tenant_approved' ||
                  agreementStatus?.status === 'landlord_approved' ||
                  agreementStatus?.status === 'signed'
                }
                size="small"
                sx={{ mr: 1 }}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<WarningIcon />}
                onClick={async () => {
                  try {
                    const response = await axios.patch(
                      `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/lease-agreement/status`,
                      { action: 'request_changes' },
                      {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                      }
                    );
                    setAgreementStatus(response.data);
                    toast.success('Changes requested successfully');
                  } catch (error) {
                    // Error requesting changes
                    toast.error(error.response?.data?.message || 'Failed to request changes');
                  }
                }}
                disabled={
                  agreementStatus?.status === 'landlord_approved' ||
                  agreementStatus?.status === 'signed'
                }
                size="small"
              >
                Request Changes
              </Button>
            </Box>
          )}
        </Box>
      )
    },
    {
      id: 'sign',
      title: 'Sign Agreement',
      description: 'Sign the lease agreement to make it legally binding.',
      status: isSigningStepCompleted(),
      actions: agreementStatus?.status === 'landlord_approved' ? (
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={() => {
            if (!leaseDetails.envelopeId) {
              handleInitiateSigning();
            } else {
              setShowSigningDialog(true);
            }
          }}
          disabled={loading || hasCurrentUserSigned()}
          size="small"
        >
          Sign Agreement
        </Button>
      ) : null
    }
  ];

  return (
    <Box>
      {/* Next Step Info Banner */}
      {(() => {
        const nextStepInfo = getNextStepInfo();
        if (!nextStepInfo) return null;

        const alertColor = nextStepInfo.type === 'success' ? 'success' : 
                          nextStepInfo.type === 'warning' ? 'warning' : 'info';

        return (
          <Alert 
            severity={alertColor} 
            variant='filled'
            sx={{ 
              mb: 3,
              background: 'linear-gradient(90deg,rgba(74, 100, 173, 1) 0%,rgb(172, 194, 235) 100%)',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>
                {nextStepInfo.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {nextStepInfo.message}
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'white' }}>
                <strong>Next Step:</strong> {nextStepInfo.action}
              </Typography>
            </Box>
          </Alert>
        );
      })()}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Lease Agreement Process
          {leaseDetails?.property?.location && (() => {
            const { countryCode, region } = getLocationInfo(leaseDetails.property.location);
            return ` - ${countryCode}/${region}`;
          })()}
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          {steps.map((step, index) => (
            <Box key={step.id} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  pt: 0.5
                }}>
                  {getStepIcon(step.id, step.status)}
                  {index < steps.length - 1 && (
                    <Box 
                      sx={{ 
                        width: 2, 
                        height: 40, 
                        bgcolor: 'divider',
                        my: 0.5
                      }} 
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                    {step.actions}
                  </Box>
                  {step.content}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Full-size Lease Actions Section */}
      <Paper sx={{ p: 1.5, mb: 2, background: 'rgba(245, 248, 255, 0.8)' }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, mr: 2, color: 'text.secondary' }}>
            Lease Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Tooltip title="Preview PDF">
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PreviewIcon />}
                  onClick={handlePreview}
                  disabled={loading || previewLoading}
                  size="small"
                >
                  Preview
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Download PDF">
              <span>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={loading}
                  size="small"
                >
                  Download
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Terminate Lease">
              <span>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<WarningIcon />}
                  onClick={handleTerminate}
                  disabled={loading}
                  size="small"
                >
                  Terminate Lease
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Paper>

      <Dialog
        open={showSigningDialog}
        onClose={() => setShowSigningDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {signingCompleted ? 'Signing Completed!' : 
           hasCurrentUserSigned() ? 'You Have Already Signed' : 'Sign Lease Agreement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '600px', width: '100%' }}>
            {signingCompleted ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                textAlign: 'center'
              }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  Signing Completed Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The lease agreement has been signed by all parties.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This dialog will close automatically in a moment...
                </Typography>
              </Box>
            ) : hasCurrentUserSigned() ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                textAlign: 'center'
              }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  You Have Already Signed!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  You have completed your signature for this lease agreement.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Waiting for the other party to complete their signature.
                </Typography>
              </Box>
            ) : signingUrl ? (
              <>
                <iframe
                  src={signingUrl}
                  style={{ width: '100%', height: '80%', border: 'none' }}
                  title="DocuSign Signing Interface"
                />
                {/* Development Helper Section */}
                {isDocuSignStubbed() && !signingCompleted && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                      🔧 Development Mode - DocuSign Stubbed
                    </Typography>
                    <Typography variant="body2" color="warning.dark" sx={{ mb: 2 }}>
                      This is a mock signing interface. Use the buttons below to simulate signing actions.
                    </Typography>
                    
                    {/* Signing Status Display */}
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.primary" gutterBottom>
                        Signing Status:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip
                          label={`Landlord: ${getSigningStatusForRole('landlord')?.status || 'Not Started'}`}
                          color={getSigningStatusForRole('landlord')?.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                        <Chip
                          label={`Tenant: ${getSigningStatusForRole('tenant')?.status || 'Not Started'}`}
                          color={getSigningStatusForRole('tenant')?.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={hasAllPartiesSigned()}
                        onClick={async () => {
                          try {
                            console.log('🔧 [STUBBED] Attempting to sign with envelope ID:', currentEnvelopeId);
                            if (!currentEnvelopeId) {
                              toast.error('No envelope ID available for signing');
                              return;
                            }
                            await simulateStubbedSigning(currentEnvelopeId, '1', 'sign');
                            await simulateStubbedSigning(currentEnvelopeId, '2', 'sign');
                            toast.success('Both parties signed successfully (Mock)');
                            setSigningCompleted(true);
                            fetchEnvelopeStatus();
                            // Close dialog after a short delay to show the success message
                            setTimeout(() => {
                              setShowSigningDialog(false);
                              setSigningCompleted(false);
                            }, 1500);
                          } catch (error) {
                            console.error('Signing error:', error);
                            toast.error('Failed to simulate signing');
                          }
                        }}
                      >
                        Simulate Both Sign
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        disabled={getSigningStatusForRole('landlord')?.status === 'completed'}
                        onClick={async () => {
                          try {
                            if (!currentEnvelopeId) {
                              toast.error('No envelope ID available for signing');
                              return;
                            }
                            await simulateStubbedSigning(currentEnvelopeId, '1', 'sign');
                            toast.success('Landlord signed (Mock)');
                            fetchEnvelopeStatus();
                          } catch (error) {
                            console.error('Signing error:', error);
                            toast.error('Failed to simulate signing');
                          }
                        }}
                      >
                        Landlord Sign Only
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        disabled={getSigningStatusForRole('tenant')?.status === 'completed'}
                        onClick={async () => {
                          try {
                            if (!currentEnvelopeId) {
                              toast.error('No envelope ID available for signing');
                              return;
                            }
                            await simulateStubbedSigning(currentEnvelopeId, '2', 'sign');
                            toast.success('Tenant signed (Mock)');
                            fetchEnvelopeStatus();
                          } catch (error) {
                            console.error('Signing error:', error);
                            toast.error('Failed to simulate signing');
                          }
                        }}
                      >
                        Tenant Sign Only
                      </Button>
                    </Stack>
                  </Box>
                )}
              </>
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
          {signingCompleted ? (
            <Button 
              variant="contained" 
              color="success" 
              onClick={() => {
                setShowSigningDialog(false);
                setSigningCompleted(false);
              }}
            >
              Done
            </Button>
          ) : (
            <Button onClick={() => setShowSigningDialog(false)}>Close</Button>
          )}
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
              onClick={handleDownload}
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

      {/* Upload Document Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          setSelectedFile(null);
          setUploadError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept=".pdf"
              style={{ display: 'none' }}
              id="document-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="document-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Select PDF File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected file: {selectedFile.name}
              </Typography>
            )}
            {uploadError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {uploadError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowUploadDialog(false);
              setSelectedFile(null);
              setUploadError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Picker Dialog */}
      <Dialog 
        open={showDatePicker} 
        onClose={() => setShowDatePicker(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Set Lease Start Date</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Lease Start Date"
                value={selectedDate || agreementStatus?.leaseStartDate?.date || null}
                onChange={(newDate) => setSelectedDate(newDate)}
                minDate={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDatePicker(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateStartDate}
            variant="contained"
            disabled={!selectedDate}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaseAgreement; 