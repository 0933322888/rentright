import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTenantProperty();
  }, [user]);

  const fetchTenantProperty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.PROPERTIES, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Find the property where user is the current tenant
      const tenantProperty = response.data.find(prop => 
        prop.tenant && prop.tenant._id.toString() === user._id.toString()
      );
      
      if (!tenantProperty) {
        setError('No property found where you are the current tenant. You must be renting a property to create a ticket.');
        return;
      }
      
      setProperty(tenantProperty);
    } catch (error) {
      setError('Failed to load your property');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!property || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        API_ENDPOINTS.TICKETS,
        {
          propertyId: property._id,
          description: description.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Ticket created successfully');
      navigate('/my-tickets');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h1 className="text-3xl font-bold text-gray-900">Create Repair Ticket</h1>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {property && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Property
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{property.title}</p>
                    <p className="text-sm text-gray-600">
                      {property.location.street}, {property.location.city}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe the repair needed..."
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/my-tickets')}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !property}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 