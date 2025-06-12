import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-hot-toast';

export default function TicketManagement({ 
  tickets, 
  isLoading, 
  error, 
  onTicketAction 
}) {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading tickets...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (tickets.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Tickets Yet
        </Typography>
        <Typography variant="body1" color="text.secondary">
          There are no maintenance tickets for this property at the moment.
        </Typography>
      </Paper>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'declined':
        return 'error';
      case 'new':
        return 'info';
      default:
        return 'warning';
    }
  };

  const handleAction = async (ticketId, status) => {
    try {
      await onTicketAction(ticketId, status);
      toast.success(`Ticket ${status === 'approved' ? 'approved' : 'declined'} successfully`);
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tickets.map((ticket) => (
        <Paper 
          key={ticket._id} 
          sx={{ 
            p: 3,
            transition: 'all 0.2s',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            mb: 2 
          }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {ticket.tenant.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Chip
              label={ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              color={getStatusColor(ticket.status)}
              sx={{
                fontWeight: 500,
                '&.MuiChip-colorSuccess': {
                  backgroundColor: 'success.light',
                  color: 'success.dark',
                },
                '&.MuiChip-colorError': {
                  backgroundColor: 'error.light',
                  color: 'error.dark',
                },
                '&.MuiChip-colorInfo': {
                  backgroundColor: 'info.light',
                  color: 'info.dark',
                },
                '&.MuiChip-colorWarning': {
                  backgroundColor: 'warning.light',
                  color: 'warning.dark',
                },
              }}
            />
          </Box>
          
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {ticket.description}
          </Typography>

          {ticket.status === 'new' && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleAction(ticket._id, 'declined')}
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                  }
                }}
              >
                Decline
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleAction(ticket._id, 'approved')}
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
                Approve
              </Button>
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );
} 