import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CommentSection from '../../components/CommentSection';
import { getProfilePictureUrl } from '../../utils/imageUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { adminButtonStyles } from '../../utils/uiUtils';

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
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tenants]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.USERS}?role=tenant`);
      setTenants(response.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to fetch tenants');
      toast.error('Failed to fetch tenants');
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

  const handleOpenComments = async (tenant) => {
    setSelectedTenant(tenant);
    setIsCommentsModalOpen(true);
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.USERS}/${tenant._id}/comments`);
      setSelectedTenant(prev => ({
        ...prev,
        comments: response.data
      }));
    } catch (error) {
      toast.error('Failed to fetch comments');
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (text) => {
    if (!selectedTenant) return;

    setIsAddingComment(true);
    try {
      const response = await axios.post(`${API_ENDPOINTS.USERS}/${selectedTenant._id}/comments`, {
        text
      });

      setSelectedTenant(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data]
      }));

      // Update the tenant in the main list to reflect the new comment count
      setTenants(prev => prev.map(tenant => 
        tenant._id === selectedTenant._id 
          ? { ...tenant, comments: [...(tenant.comments || []), response.data] }
          : tenant
      ));

      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
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
                      Profile
                    </th>
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
                      Tenant Score
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Comments
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {tenant.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(tenant.profilePicture)}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                              {tenant.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {tenant.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {tenant.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {tenant.phone || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {tenant.applicationCount || 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex items-center">
                          <span className={`${
                            tenant.tenantScoring >= 80 ? 'text-green-600' :
                            tenant.tenantScoring >= 60 ? 'text-yellow-600' :
                            tenant.tenantScoring >= 40 ? 'text-yellow-500' :
                            'text-red-600'
                          }`}>
                            {tenant.tenantScoring ?? 0}%
                          </span>
                          <div className="ml-2 w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${tenant.tenantScoring >= 80 ? 'bg-green-500' :
                                tenant.tenantScoring >= 60 ? 'bg-yellow-500' :
                                tenant.tenantScoring >= 40 ? 'bg-yellow-400' :
                                'bg-red-500'}
                              }`}
                              style={{ width: `${tenant.tenantScoring ?? 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (tenant.comments?.length || 0) > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.comments?.length || 0} comment{(tenant.comments?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/tenants/${tenant._id}/profile`)}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleOpenComments(tenant)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs"
                          >
                            Comments
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(tenant._id)}
                            className="text-xs text-red-600 hover:text-red-900"
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

      {/* Comments Modal */}
      <Dialog
        open={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <span>Comments for {selectedTenant?.name}</span>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setIsCommentsModalOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTenant && (
            <CommentSection
              comments={selectedTenant.comments || []}
              onAddComment={handleAddComment}
              isLoading={isAddingComment}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 