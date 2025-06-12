import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

export function useTickets(propertyId) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasNewTickets, setHasNewTickets] = useState(false);

  useEffect(() => {
    if (propertyId) {
      fetchTickets();
    }
  }, [propertyId]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(API_ENDPOINTS.PROPERTY_TICKETS(propertyId), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTickets(response.data);
      setHasNewTickets(response.data.some(ticket => ticket.status === 'new'));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets');
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketAction = async (ticketId, status) => {
    try {
      await axios.patch(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      await fetchTickets();
      toast.success(`Ticket ${status === 'approved' ? 'approved' : 'declined'} successfully`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  return {
    tickets,
    isLoading,
    error,
    hasNewTickets,
    fetchTickets,
    handleTicketAction
  };
} 