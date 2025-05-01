import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    propertyTitle: '',
    tenantEmail: '',
    status: 'all'
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, applications]);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_APPLICATIONS, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setApplications(response.data);
      console.log(response.data);
    } catch (err) {
      setError('Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.propertyTitle) {
      filtered = filtered.filter(application => 
        application.property.title.toLowerCase().includes(filters.propertyTitle.toLowerCase())
      );
    }

    if (filters.tenantEmail) {
      filtered = filtered.filter(application => 
        application.tenant.email.toLowerCase().includes(filters.tenantEmail.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(application => 
        application.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (applicationId) => {
    try {
      await axios.delete(
        `${API_ENDPOINTS.ADMIN_APPLICATIONS}/${applicationId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Application deleted successfully');
      fetchApplications();
    } catch (err) {
      toast.error('Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      await axios.patch(
        `${API_ENDPOINTS.ADMIN_APPLICATIONS}/${applicationId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
    } catch (err) {
      toast.error(`Failed to ${newStatus} application`);
      console.error(`Error ${newStatus} application:`, err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all applications in the system.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="propertyTitle" className="block text-sm font-medium text-gray-700">
              Property Title
            </label>
            <input
              type="text"
              name="propertyTitle"
              id="propertyTitle"
              value={filters.propertyTitle}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by property title"
            />
          </div>
          <div>
            <label htmlFor="tenantEmail" className="block text-sm font-medium text-gray-700">
              Tenant Email
            </label>
            <input
              type="text"
              name="tenantEmail"
              id="tenantEmail"
              value={filters.tenantEmail}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by tenant email"
            />
          </div>
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
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Property
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tenant
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tenant Rating
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Application Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Applied
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredApplications.map((application) => (
                    <tr key={application._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <span className="font-bold">{application.property?.title || 'Property not found'}</span>
                        <br />
                        {application.property?.location?.city + ' ' + application.property?.location?.state + ' ' + application.property?.location?.zipCode || 'Location not found'}
                        <br />
                        {application.property?.location?.street + ' ' + application.property?.location?.unit || 'Street not found'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {application.tenant?.email || 'Tenant not found'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const getStarColor = () => {
                              if (i < (application.tenant?.rating || 0)) {
                                if (application.tenant?.rating === 5) return 'text-green-500';
                                if (application.tenant?.rating >= 3) return 'text-yellow-400';
                                return 'text-red-500';
                              }
                              return 'text-gray-300';
                            };
                            
                            return (
                              <svg
                                key={i}
                                className={`h-5 w-5 ${getStarColor()}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            );
                          })}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {application.status === 'pending' && (
                            <>
                              
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'declined')}
                                className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(application._id)}
                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 