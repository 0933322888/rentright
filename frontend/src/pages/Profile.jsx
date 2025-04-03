import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantData, setTenantData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          });

          // Fetch tenant data if user is a tenant
          if (user.role === 'tenant') {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setTenantData(response.data);
          }
        } catch (error) {
          console.error('Error fetching profile data:', error);
          setError('Failed to load profile data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

          <div className="mt-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your personal information and how others see you on the platform.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-600 text-sm">
                    {success}
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>

              {/* Role-specific content */}
              {user.role === 'landlord' && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900">Landlord Dashboard</h2>
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/add-property')}
                      className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Add New Property
                    </button>
                  </div>
                </div>
              )}

              {user.role === 'tenant' && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900">Tenant Information</h2>
                  <div className="mt-4 space-y-4">
                    {tenantData && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Eviction History</h3>
                          <p className="mt-1 text-sm text-gray-900">{tenantData.hasBeenEvicted ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Payment Capability</h3>
                          <p className="mt-1 text-sm text-gray-900">
                            {tenantData.canPayMoreThanOneMonth ? `Can pay ${tenantData.monthsAheadCanPay} months ahead` : 'Can pay one month at a time'}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Applications</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        View and manage your property applications.
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => navigate('/applications')}
                          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          View Applications
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 