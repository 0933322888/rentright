import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.TICKETS, {
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

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ticket status updated successfully');
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
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
          <h1 className="text-3xl font-bold text-gray-900">Repair Tickets</h1>

          {tickets.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">
              No tickets found.
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
                        Tenant: {ticket.tenant.name} ({ticket.tenant.email})
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 