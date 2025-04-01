import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

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
      console.log('Fetched applications:', response.data);
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error.response?.data || error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        API_ENDPOINTS.APPLICATION_BY_ID(applicationId),
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchApplications();
    } catch (error) {
      setError('Error updating application status');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(API_ENDPOINTS.APPLICATION_BY_ID(applicationId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchApplications(); // Refresh the applications list
    } catch (error) {
      setError('Error deleting application');
      console.error('Error:', error);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;

  const filteredApplications = applications.filter(app => {
    if (user.role === 'landlord') {
      return app.property.landlord._id.toString() === user._id.toString();
    }
    return app.tenant._id.toString() === user._id.toString();
  });

  console.log('Filtered applications:', filteredApplications);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'landlord' ? 'Property Applications' : 'My Applications'}
          </h1>

          {filteredApplications.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">
              No applications found.
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {filteredApplications.map((application) => (
                <div
                  key={application._id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {application.property.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {application.property.location.street && `${application.property.location.street}, `}
                        {application.property.location.city}, {application.property.location.state}
                        {application.property.location.zipCode && ` ${application.property.location.zipCode}`}
                      </p>
                    </div>
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
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900">Application Details</h4>
                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Move-in Date:</span>{' '}
                        {new Date(application.moveInDate).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Message:</span> {application.message}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    {user.role === 'landlord' && application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'rejected')}
                          className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'approved')}
                          className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Approve
                        </button>
                      </>
                    )}

                    {user.role === 'tenant' && application.status === 'pending' && (
                      <button
                        onClick={() => navigate(`/properties/${application.property._id}`)}
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        View Property
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(application._id)}
                      className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete
                    </button>
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