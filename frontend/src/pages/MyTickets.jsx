import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentingTicketId, setCommentingTicketId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

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

      // Update the ticket in the local state while preserving the property data
      setTickets(tickets.map(ticket => {
        if (ticket._id === ticketId) {
          // Preserve the existing property data
          const existingTicket = tickets.find(t => t._id === ticketId);
          return {
            ...response.data,
            property: existingTicket.property // Keep the existing property data
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Repair Tickets</h1>
            <button
              onClick={() => navigate('/create-ticket')}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create New Ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">
              No tickets found. Create your first repair ticket!
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {ticket.property.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ticket.property.location.street}, {ticket.property.location.city}, {ticket.property.location.state}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Created: {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCommentingTicketId(ticket._id)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Add Comment
                        </button>
                        {ticket.comments && ticket.comments.length > 0 && (
                          <button
                            onClick={() => toggleComments(ticket._id)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            {expandedComments[ticket._id] ? 'Hide Comments' : 'Show Comments'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  {ticket.comments && ticket.comments.length > 0 && expandedComments[ticket._id] && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Comments</h4>
                      <div className="space-y-3">
                        {ticket.comments.map((comment, index) => (
                          <div key={`${ticket._id}-${index}`} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {comment.user.name}
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  comment.user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {comment.user.role}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-700">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      {commentingTicketId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={4}
              placeholder="Enter your comment..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCommentingTicketId(null);
                  setNewComment('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddComment(commentingTicketId)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 