import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ApplicationApprovalModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  application, 
  otherApplicationsCount = 0 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <WarningIcon color="warning" sx={{ fontSize: 28 }} />
        <Typography variant="h6" component="span">
          Confirm Application Approval
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          <AlertTitle>Important Notice</AlertTitle>
          <Typography variant="body2">
            By approving this application, you are selecting this tenant for your property. 
            This action will automatically reject all other pending applications for this property.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Application Details
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="body1" fontWeight="medium">
              Tenant: {application?.tenant?.name} 
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tenant Score: {application?.tenantScoring || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {otherApplicationsCount > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom color="error">
              Other Applications Affected
            </Typography>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'error.light', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'error.main'
            }}>
              <Typography variant="body1" color="error.contrastText">
                {otherApplicationsCount} other application{otherApplicationsCount !== 1 ? 's' : ''} will be automatically rejected.
              </Typography>
              <Typography variant="body2" color="error.contrastText" sx={{ mt: 1 }}>
                This action cannot be undone. Please make sure you want to proceed with this tenant.
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ 
          p: 2, 
          bgcolor: 'success.light', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'success.main'
        }}>
          <Typography variant="body2" color="success.contrastText">
            <strong>What happens next:</strong>
          </Typography>
          <Typography variant="body2" color="success.contrastText" sx={{ mt: 1 }}>
            • This tenant will be assigned to your property<br/>
            • The property will be marked as unavailable<br/>
            • You can proceed with lease agreement setup<br/>
            • All other applications will be rejected
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2,
        gap: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CancelIcon />}
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(46,125,50,0.2)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(46,125,50,0.3)',
            }
          }}
        >
          Approve Application
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationApprovalModal; 