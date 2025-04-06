import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import React from 'react';

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    startDate: '',
    endDate: ''
  });
  const [newComment, setNewComment] = useState('');
  const [commentingTicketId, setCommentingTicketId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.TICKETS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load tickets');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      setUpdatingPriority(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/priority`,
        { priority: newPriority },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, priority: newPriority }
          : ticket
      ));
      
      toast.success('Ticket priority updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTickets(tickets.map(ticket => 
        ticket._id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      ));
      
      toast.success('Ticket status updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
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

  const filteredTickets = tickets.filter(ticket => {
    // Filter by status
    if (filters.status !== 'all' && ticket.status !== filters.status) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      const ticketDate = new Date(ticket.createdAt);
      if (ticketDate < startDate) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      const ticketDate = new Date(ticket.createdAt);
      if (ticketDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

  const toggleComments = (ticketId) => {
    setExpandedComments(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
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
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>

          {/* Filters */}
          <div className="mt-8 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  name="priority"
                  id="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 text-center">Loading...</div>
          ) : error ? (
            <div className="mt-8 text-center text-red-600">{error}</div>
          ) : (
            <div className="mt-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <React.Fragment key={ticket._id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.property.location.street}, {ticket.property.location.city}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.tenant.name}</div>
                          <div className="text-sm text-gray-500">{ticket.tenant.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{ticket.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={ticket.priority}
                            onChange={(e) => handlePriorityChange(ticket._id, e.target.value)}
                            disabled={updatingPriority}
                            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                              ticket.priority === 'urgent' ? 'bg-red-100' :
                              ticket.priority === 'high' ? 'bg-orange-100' :
                              ticket.priority === 'medium' ? 'bg-yellow-100' :
                              'bg-green-100'
                            }`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              {ticket.status !== 'closed' && (
                                <>
                                  {ticket.status === 'new' && (
                                    <button
                                      onClick={() => handleStatusUpdate(ticket._id, 'review')}
                                      className="text-yellow-600 hover:text-yellow-800"
                                    >
                                      Review
                                    </button>
                                  )}
                                  {ticket.status === 'review' && (
                                    <>
                                      <button
                                        onClick={() => handleStatusUpdate(ticket._id, 'approved')}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleStatusUpdate(ticket._id, 'declined')}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Decline
                                      </button>
                                    </>
                                  )}
                                  {(ticket.status === 'approved' || ticket.status === 'declined') && (
                                    <button
                                      onClick={() => handleStatusUpdate(ticket._id, 'closed')}
                                      className="text-gray-600 hover:text-gray-800"
                                    >
                                      Close
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setCommentingTicketId(ticket._id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Add Comment
                              </button>
                              {ticket.comments && ticket.comments.length > 0 && (
                                <button
                                  onClick={() => toggleComments(ticket._id)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  {expandedComments[ticket._id] ? 'Hide Comments' : 'Show Comments'}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Comments Section */}
                      {ticket.comments && ticket.comments.length > 0 && expandedComments[ticket._id] && (
                        <tr>
                          <td colSpan="7" className="px-6 py-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Comments</h4>
                              <div className="space-y-3">
                                {ticket.comments.map((comment, index) => (
                                  <div key={`${ticket._id}-${index}`} className="bg-white p-3 rounded-lg shadow-sm">
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
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