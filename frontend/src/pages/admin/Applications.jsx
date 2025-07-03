import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { adminButtonStyles } from '../../utils/uiUtils';

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
      // Applications data
    } catch (err) {
      setError('Failed to fetch applications');
      // Error fetching applications
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
      // Error deleting application
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
      // Error updating application status
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
                      Tenant Info
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Lease Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Financial
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status & Dates
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
                        <div className="font-bold">{application.property?.title || 'Property not found'}</div>
                        <div className="text-gray-500">
                          {application.property?.location?.street} {application.property?.location?.unit}
                        </div>
                        <div className="text-gray-500">
                          {[
                            application.property?.location?.city,
                            application.property?.location?.state,
                            application.property?.location?.zipCode
                          ].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {application.tenant?.name || 'Name not found'}
                        </div>
                        <div className="text-gray-500">
                          {application.tenant?.email || 'Email not found'}
                        </div>
                        <div className="text-gray-500">
                          {application.tenant?.phone || 'Phone not found'}
                        </div>

                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div>
                          <span className="font-medium">Monthly Rent: </span>
                          <span className="text-gray-500">
                            ${application.property?.price.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Start Date: </span>
                          <span className="text-gray-500">
                            {application.leaseAgreement?.leaseStartDate?.date ? new Date(application.leaseAgreement?.leaseStartDate?.date).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Landlord Approved: </span>
                          <span className="text-gray-500">
                            {application.leaseAgreement?.landlordApprovedAt ?
                              `${new Date(application.leaseAgreement?.landlordApprovedAt).toLocaleDateString()}` :
                              'Not approved'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Tenant Approved: </span>
                          <span className="text-gray-500">
                            {application.leaseAgreement?.tenantApprovedAt ?
                              `${new Date(application.leaseAgreement?.tenantApprovedAt).toLocaleDateString()}` :
                              'Not approved'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Signed: </span>
                          <span className={`${application.leaseAgreement?.status === 'signed' ? 'text-green-600' : 'text-gray-500'}`}>
                            {application.leaseAgreement?.status === 'signed' ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div className="flex items-center mt-1">
                          <span className="text-gray-500 mr-1">Tenant Score: </span>
                          <span className={`font-medium ${!application.tenantScoring ? 'text-gray-500' :
                            application.tenantScoring >= 80 ? 'text-green-600' :
                              application.tenantScoring >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                            {application.tenantScoring ? `${application.tenantScoring}%` : 'N/A'}
                          </span>
                          {application.tenantScoring && (
                            <div className="ml-2 w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${application.tenantScoring >= 80 ? 'bg-green-500' :
                                  application.tenantScoring >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${application.tenantScoring}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <div>
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${application.status === 'approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {application.status}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-medium">Applied: </span>
                          <span className="text-gray-500">
                            {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Last Updated: </span>
                          <span className="text-gray-500">
                            {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'approved')}
                                className={adminButtonStyles.textApprove}
                              >
                                Approve
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleStatusUpdate(application._id, 'declined')}
                                className={adminButtonStyles.textReject}
                              >
                                Decline
                              </button>
                              <span className="text-gray-300">|</span>
                            </>
                          )}
                          <button
                            onClick={() => handleStatusUpdate(application._id, 'rejected')}
                            disabled={['rejected', 'terminated', 'cancelled'].includes(application.status)}
                            className={`${adminButtonStyles.textReject} ${['rejected', 'terminated', 'cancelled'].includes(application.status) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            Reject
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(application._id)}
                            className={adminButtonStyles.textDelete}
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