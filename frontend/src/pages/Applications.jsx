import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error.response?.data || error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      await axios.delete(
        `${API_ENDPOINTS.APPLICATIONS}/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Application deleted successfully');
      setApplications(applications.filter(app => app._id !== applicationId));
    } catch (error) {
      console.error('Error deleting application:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete application. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  const filteredApplications = applications.filter(app => {
    if (!app || !app.property || !app.tenant || !app.tenant._id || !user || !user._id) return false;
    return app.tenant._id === user._id;
  });

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>

          {filteredApplications.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">
              No applications found.
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={application.property.images?.[0] || 'https://via.placeholder.com/400x300'}
                        alt={application.property.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.property.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {application.property.location.street}, {application.property.location.city}, {application.property.location.state}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Applied on {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            application.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : application.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                        <button
                          onClick={() => navigate(`/properties/${application.property._id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Property
                        </button>
                        <button
                          onClick={() => handleDelete(application._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
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