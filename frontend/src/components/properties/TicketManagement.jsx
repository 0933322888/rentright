import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';

export default function TicketManagement({ 
  tickets, 
  isLoading, 
  error, 
  onTicketAction 
}) {
  const [newComment, setNewComment] = useState('');
  const [commentingTicketId, setCommentingTicketId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  const handleAddComment = async (ticketId) => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/comments`,
        { text: newComment },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the ticket in the local state
      const updatedTickets = tickets.map(ticket => 
        ticket._id === ticketId ? response.data : ticket
      );
      onTicketAction(updatedTickets);

      setNewComment('');
      setCommentingTicketId(null);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const toggleComments = (ticketId) => {
    setExpandedComments(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

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

  return (
    <Box>
      {tickets.map((ticket) => (
        <Paper key={ticket._id} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Ticket #{ticket._id.slice(-6)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Created: {new Date(ticket.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {ticket.description}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Chip 
                label={ticket.status} 
                color={getStatusColor(ticket.status)}
                size="small"
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => setCommentingTicketId(ticket._id)}
                  variant="outlined"
                >
                  Add Comment
                </Button>
                {ticket.comments && ticket.comments.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => toggleComments(ticket._id)}
                    variant="text"
                  >
                    {expandedComments[ticket._id] ? 'Hide Comments' : 'Show Comments'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          {/* Comments Section */}
          {ticket.comments && ticket.comments.length > 0 && expandedComments[ticket._id] && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Comments
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ticket.comments.map((comment, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {comment.user.name}
                        </Typography>
                        <Chip
                          label={comment.user.role}
                          size="small"
                          color={comment.user.role === 'admin' ? 'secondary' : 'primary'}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {comment.text}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      ))}

      {/* Comment Dialog */}
      <Dialog 
        open={Boolean(commentingTicketId)} 
        onClose={() => {
          setCommentingTicketId(null);
          setNewComment('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCommentingTicketId(null);
              setNewComment('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleAddComment(commentingTicketId)}
            variant="contained"
            color="primary"
          >
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 