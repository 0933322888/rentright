import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import CommentSection from '../../components/CommentSection';
import { getProfilePictureUrl } from '../../utils/imageUtils';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function AdminLandlords() {
  const [landlords, setLandlords] = useState([]);
  const [filteredLandlords, setFilteredLandlords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    email: '',
    name: '',
    verificationStatus: 'all'
  });
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    fetchLandlords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, landlords]);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.USERS}?role=landlord`);
      setLandlords(response.data);
    } catch (error) {
      console.error('Error fetching landlords:', error);
      setError('Failed to fetch landlords');
      toast.error('Failed to fetch landlords');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...landlords];

    if (filters.email) {
      filtered = filtered.filter(landlord => 
        landlord.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }

    if (filters.name) {
      filtered = filtered.filter(landlord => 
        landlord.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.verificationStatus !== 'all') {
      filtered = filtered.filter(landlord => 
        filters.verificationStatus === 'verified' ? landlord.isVerified : !landlord.isVerified
      );
    }

    setFilteredLandlords(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenComments = async (landlord) => {
    setSelectedLandlord(landlord);
    setIsCommentsModalOpen(true);
    
    try {
      const response = await axios.get(`${API_ENDPOINTS.USERS}/${landlord._id}/comments`);
      setSelectedLandlord(prev => ({
        ...prev,
        comments: response.data
      }));
    } catch (error) {
      toast.error('Failed to fetch comments');
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (text) => {
    if (!selectedLandlord) return;

    setIsAddingComment(true);
    try {
      const response = await axios.post(`${API_ENDPOINTS.USERS}/${selectedLandlord._id}/comments`, {
        text
      });

      setSelectedLandlord(prev => ({
        ...prev,
        comments: [...(prev.comments || []), response.data]
      }));

      // Update the landlord in the main list to reflect the new comment count
      setLandlords(prev => prev.map(landlord => 
        landlord._id === selectedLandlord._id 
          ? { ...landlord, comments: [...(landlord.comments || []), response.data] }
          : landlord
      ));

      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDelete = async (landlordId) => {
    if (!window.confirm('Are you sure you want to delete this landlord? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_ENDPOINTS.USERS}/${landlordId}`);
      setLandlords(prev => prev.filter(landlord => landlord._id !== landlordId));
      toast.success('Landlord deleted successfully');
    } catch (error) {
      console.error('Error deleting landlord:', error);
      toast.error('Failed to delete landlord');
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
            <label htmlFor="verificationStatus" className="block text-sm font-medium text-gray-700">
              Verification Status
            </label>
            <select
              name="verificationStatus"
              id="verificationStatus"
              value={filters.verificationStatus}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8">
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
                      Properties
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Joined
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
                  {filteredLandlords.map((landlord) => (
                    <tr key={landlord._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          {landlord.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(landlord.profilePicture)}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                              {landlord.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {landlord.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {landlord.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {landlord.propertyCount || 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(landlord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (landlord.comments?.length || 0) > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {landlord.comments?.length || 0} comment{(landlord.comments?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenComments(landlord)}
                            className="text-xs text-indigo-600 hover:text-indigo-900"
                          >
                            Comments
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(landlord._id)}
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
            <span>Comments for {selectedLandlord?.name}</span>
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
          {selectedLandlord && (
            <CommentSection
              comments={selectedLandlord.comments || []}
              onAddComment={handleAddComment}
              isLoading={isAddingComment}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 