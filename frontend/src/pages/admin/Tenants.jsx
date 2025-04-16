import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    email: '',
    name: '',
    profileStatus: 'all'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tenants]);

  const fetchTenants = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN_TENANTS}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTenants(response.data);
      console.log(response.data);
    } catch (err) {
      setError('Failed to fetch tenants');
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tenants];

    if (filters.email) {
      filtered = filtered.filter(tenant => 
        tenant.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.name) {
      filtered = filtered.filter(tenant => 
        tenant.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.profileStatus !== 'all') {
      filtered = filtered.filter(tenant => 
        filters.profileStatus === 'complete' ? tenant.hasProfile : !tenant.hasProfile
      );
    }

    setFilteredTenants(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (tenantId) => {
    navigate(`/admin/tenants/${tenantId}/edit`);
  };

  const handleDelete = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This will also delete all their applications.')) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.ADMIN_TENANTS}/${tenantId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Tenant deleted successfully');
      fetchTenants();
    } catch (err) {
      toast.error('Failed to delete tenant');
      console.error('Error deleting tenant:', err);
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
          <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all tenants registered in the system.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="text"
              name="email"
              id="email"
              value={filters.email}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Filter by email"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={filters.name}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Filter by name"
            />
          </div>
          <div>
            <label htmlFor="profileStatus" className="block text-sm font-medium text-gray-700">
              Applicant Profile Status
            </label>
            <select
              name="profileStatus"
              id="profileStatus"
              value={filters.profileStatus}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="complete">Complete</option>
              <option value="incomplete">Incomplete</option>
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
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Applications
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Joined
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Rating
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Applicant Profile Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {tenant.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {tenant.phone}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {tenant.applicationCount || 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const getStarColor = () => {
                              if (i < (tenant.rating || 0)) {
                                if (tenant.rating === 5) return 'text-green-500';
                                if (tenant.rating >= 3) return 'text-yellow-400';
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
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            tenant.tenantDocument?.hasBeenEvicted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tenant.tenantDocument?.hasBeenEvicted ? 'Complete' : 'Incomplete'}
                          </span>
                          <button
                            onClick={() => navigate(`/admin/tenants/${tenant._id}/profile`)}
                            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          >
                            View
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(tenant._id)}
                            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tenant._id)}
                            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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