import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
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
  DialogActions,
  IconButton,
  Tooltip,
  DialogContentText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CommentIcon from '@mui/icons-material/Comment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentingTicketId, setCommentingTicketId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.MY_TICKETS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

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

      setTickets(tickets.map(ticket => {
        if (ticket._id === ticketId) {
          const existingTicket = tickets.find(t => t._id === ticketId);
          return {
            ...response.data,
            property: existingTicket.property
          };
        }
        return ticket;
      }));

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

  const handleDeleteTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ENDPOINTS.TICKETS}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTickets(tickets.filter(ticket => ticket._id !== ticketId));
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
      toast.success('Ticket deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleMarkAsResolved = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/tenant-status`,
        { status: 'resolved' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTickets(tickets.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, status: 'resolved' }
          : ticket
      ));
      
      toast.success('Ticket marked as resolved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'declined':
        return 'error';
      case 'closed':
        return 'default';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
          My Repair Tickets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-ticket')}
        >
          Create New Ticket
        </Button>
      </Box>

      {tickets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Tickets Yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your first repair ticket to get started!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tickets.map((ticket) => (
            <Paper key={ticket._id} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {ticket.property.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {ticket.property.location.street}, {ticket.property.location.city}, {ticket.property.location.state}
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
                    {ticket.status === 'new' && (
                      <Tooltip title="Delete Ticket">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setTicketToDelete(ticket._id);
                            setDeleteDialogOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {ticket.status === 'approved' && (
                      <Tooltip title="Mark as Resolved">
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsResolved(ticket._id)}
                          color="success"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Add Comment">
                      <IconButton
                        size="small"
                        onClick={() => setCommentingTicketId(ticket._id)}
                        color="primary"
                      >
                        <CommentIcon />
                      </IconButton>
                    </Tooltip>
                    {ticket.comments && ticket.comments.length > 0 && (
                      <Tooltip title={expandedComments[ticket._id] ? "Hide Comments" : "Show Comments"}>
                        <IconButton
                          size="small"
                          onClick={() => toggleComments(ticket._id)}
                          color="primary"
                        >
                          {expandedComments[ticket._id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
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
        </Box>
      )}

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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTicketToDelete(null);
        }}
      >
        <DialogTitle>Delete Ticket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this ticket? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setTicketToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteTicket(ticketToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 