import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
      console.log('Lease agreement details:', response.data);
      console.log('User role:', user?.role);
      setAgreementStatus(response.data);
      setComments(response.data.comments || []);
      
      // Update steps based on status
      setStepStatus({
        downloaded: true, // Assuming the document is always available
        reviewed: true, // Always true since we removed review status
        approved: ['tenant_approved', 'landlord_approved', 'signed'].includes(response.data.status)
      });
    } catch (error) {
      console.error('Error fetching lease agreement details:', error);
      toast.error('Failed to load lease agreement details');
    }
  };

  const getLocationInfo = (location) => {
    if (!location) {
      console.error('Location data is missing');
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

    console.error('Invalid location format:', location);
    return null;
  };

  const fetchLeaseAgreementDocument = async () => {
    try {
      // Get the property location from lease details
      if (!leaseDetails?.property?.location) {
        console.error('Property location data is missing:', leaseDetails?.property?.location);
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
      console.error('Error fetching lease agreement document:', error);
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
        console.error('Property location data is missing:', leaseDetails?.property?.location);
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
      console.error('Error accessing lease agreement:', error);
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
        console.error('Property location data is missing:', leaseDetails?.property?.location);
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
      console.error('Error downloading lease agreement:', error);
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
      console.error('Error uploading document:', error);
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
      console.error('Error deleting document:', error);
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
      console.error('Error adding comment:', error);
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
      console.error('Error approving lease agreement:', error);
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
      console.error('Error updating lease start date:', error);
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
      console.error('Error approving lease start date:', error);
      toast.error(error.response?.data?.message || 'Failed to approve lease start date');
    }
  };

  const canApproveStartDate = () => {
    if (!agreementStatus?.leaseStartDate) return false;
    const { setBy, approvedBy } = agreementStatus.leaseStartDate;
    return setBy !== user?.role && !approvedBy;
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
          {console.log('Rendering approve step:', {
            userRole: user?.role,
            agreementStatus: agreementStatus?.status,
            isTenant: user?.role === 'tenant',
            isLandlord: user?.role === 'landlord',
            tenantButtonDisabled: agreementStatus?.status === 'tenant_approved' || agreementStatus?.status === 'signed',
            landlordButtonDisabled: agreementStatus?.status !== 'tenant_approved' || agreementStatus?.status === 'landlord_approved' || agreementStatus?.status === 'signed'
          })}
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
                    console.error('Error requesting changes:', error);
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
      status: agreementStatus?.status === 'signed',
      actions: agreementStatus?.status === 'landlord_approved' ? (
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={() => setShowSigningDialog(true)}
          size="small"
        >
          Start Signing Process
        </Button>
      ) : null
    }
  ];

  return (
    <Box>
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
                onClick={handlePreview}
                disabled={loading || previewLoading}
                color="primary"
              >
                {previewLoading ? <CircularProgress size={24} /> : <PreviewIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download PDF">
              <IconButton
                onClick={handleDownload}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Important Documents</Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setShowUploadDialog(true)}
              >
                Upload Document
              </Button>
            </Box>

            <Paper sx={{ p: 2 }}>
              <List>
                {/* Lease Agreement */}
                <ListItem>
                  <ListItemText
                    primary="Lease Agreement PDF"
                    secondary={leaseDetails.envelopeId 
                      ? 'View the signed lease agreement'
                      : 'Download the complete lease agreement'}
                  />
                  <ListItemSecondaryAction>
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
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                {/* Tenant Uploaded Documents */}
                {leaseDetails.tenantDocuments && leaseDetails.tenantDocuments.length > 0 && (
                  <>
                    {leaseDetails.tenantDocuments.map((doc) => (
                      <ListItem key={doc._id}>
                        <ListItemText
                          primary={doc.originalName}
                          secondary={`Uploaded on ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Preview">
                            <IconButton
                              onClick={() => window.open(doc.url, '_blank')}
                              color="primary"
                            >
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              onClick={() => handleDeleteDocument(doc._id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            </Paper>
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