import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  FunnelIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [commissionSettings, setCommissionSettings] = useState({
    monthlyFeePercentage: 5,
    listingFeeAmount: 100,
    processingFeeAmount: 50,
    lateFeePercentage: 10
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    landlordId: '',
    propertyId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    landlordId: '',
    propertyId: '',
    type: 'commission',
    amount: '',
    description: '',
    dueDate: '',
    isRecurring: false,
    recurringInterval: 'monthly',
    notes: ''
  });

  useEffect(() => {
    fetchCommissions();
    fetchStats();
    fetchLandlords();
    fetchProperties();
    fetchCommissionSettings();
  }, [filters]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(`${API_ENDPOINTS.COMMISSIONS}?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setCommissions(response.data.commissions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching commissions:', error);
      toast.error('Failed to fetch commissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.COMMISSION_STATS, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLandlords = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_LANDLORDS, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLandlords(response.data);
    } catch (error) {
      console.error('Error fetching landlords:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_PROPERTIES, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchCommissionSettings = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.COMMISSION_SETTINGS, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCommissionSettings(response.data);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      // Don't try to initialize settings automatically - this could overwrite user settings
      // If settings don't exist, they should be created manually or by the server startup
    }
  };

  const handleUpdateCommissionSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.UPDATE_COMMISSION_SETTINGS, commissionSettings, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Update local state with the response data
      const updatedSettings = {
        monthlyFeePercentage: response.data.monthlyFeePercentage,
        listingFeeAmount: response.data.listingFeeAmount,
        processingFeeAmount: response.data.processingFeeAmount,
        lateFeePercentage: response.data.lateFeePercentage
      };
      
      setCommissionSettings(updatedSettings);
      
      toast.success('Commission settings updated successfully');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error updating commission settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update commission settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCreateCommission = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_ENDPOINTS.COMMISSIONS, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Commission created successfully');
      setShowCreateModal(false);
      setFormData({
        landlordId: '',
        propertyId: '',
        type: 'commission',
        amount: '',
        description: '',
        dueDate: '',
        isRecurring: false,
        recurringInterval: 'monthly',
        notes: ''
      });
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error creating commission:', error);
      toast.error(error.response?.data?.message || 'Failed to create commission');
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_ENDPOINTS.COMMISSION_DETAILS(selectedCommission._id)}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Commission updated successfully');
      setShowEditModal(false);
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error(error.response?.data?.message || 'Failed to update commission');
    }
  };

  const handleDeleteCommission = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission?')) return;
    
    try {
      await axios.delete(`${API_ENDPOINTS.COMMISSION_DETAILS(id)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Commission deleted successfully');
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast.error('Failed to delete commission');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await axios.patch(`${API_ENDPOINTS.MARK_COMMISSION_PAID(id)}`, {
        paidDate: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Commission marked as paid');
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      toast.error('Failed to mark commission as paid');
    }
  };

  const handleGenerateMonthlyFees = async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.GENERATE_MONTHLY_FEES, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success(`Monthly fees generated: ${response.data.summary.created} created, ${response.data.summary.skipped} skipped`);
      fetchCommissions();
      fetchStats();
    } catch (error) {
      console.error('Error generating monthly fees:', error);
      toast.error('Failed to generate monthly fees');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'commission': return 'bg-purple-100 text-purple-800';
      case 'listing_fee': return 'bg-blue-100 text-blue-800';
      case 'service_fee': return 'bg-orange-100 text-orange-800';
      case 'processing_fee': return 'bg-indigo-100 text-indigo-800';
      case 'monthly_fee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Commissions & Fees</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            Settings
          </button>
          <button
            onClick={handleGenerateMonthlyFees}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <CalendarIcon className="h-5 w-5" />
            Generate Monthly Fees
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Add Commission
          </button>
        </div>
      </div>

      {/* Commission Settings Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Cog6ToothIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Commission Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Monthly Fee Percentage</p>
            <p className="text-xl font-semibold text-gray-900">{commissionSettings.monthlyFeePercentage}%</p>
            <p className="text-xs text-gray-400">Applied to all properties</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Listing Fee Amount</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(commissionSettings.listingFeeAmount)}</p>
            <p className="text-xs text-gray-400">Standard listing fee</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Processing Fee Amount</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(commissionSettings.processingFeeAmount)}</p>
            <p className="text-xs text-gray-400">Standard processing fee</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-500">Late Fee Percentage</p>
            <p className="text-xl font-semibold text-gray-900">{commissionSettings.lateFeePercentage}%</p>
            <p className="text-xs text-gray-400">Applied to overdue payments</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.paidAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.pendingAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.overdueAmount || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Commissions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalCommissions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="commission">Commission</option>
            <option value="listing_fee">Listing Fee</option>
            <option value="service_fee">Service Fee</option>
            <option value="processing_fee">Processing Fee</option>
            <option value="monthly_fee">Monthly Fee</option>
          </select>

          <select
            value={filters.landlordId}
            onChange={(e) => setFilters({ ...filters, landlordId: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">All Landlords</option>
            {landlords.map(landlord => (
              <option key={landlord._id} value={landlord._id}>
                {landlord.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Start Date"
          />
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Landlord
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.map((commission) => (
                <tr key={commission._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {commission.landlord?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.landlord?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <HomeIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {commission.property?.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.property?.location?.city}, {commission.property?.location?.state}
                        </div>
                        {commission.property?.monthlyFeeAmount > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Monthly Fee: ${commission.property.monthlyFeeAmount} 
                            <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                              commission.property.monthlyFeeStatus === 'paid' ? 'bg-green-100 text-green-700' :
                              commission.property.monthlyFeeStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              commission.property.monthlyFeeStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {commission.property.monthlyFeeStatus?.toUpperCase() || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(commission.type)}`}>
                      {commission.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(commission.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                      {commission.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {formatDate(commission.dueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCommission(commission);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCommission(commission);
                          setFormData({
                            landlordId: commission.landlord._id,
                            propertyId: commission.property._id,
                            type: commission.type,
                            amount: commission.amount.toString(),
                            description: commission.description,
                            dueDate: commission.dueDate.split('T')[0],
                            isRecurring: commission.isRecurring,
                            recurringInterval: commission.recurringInterval,
                            notes: commission.notes || ''
                          });
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {commission.status === 'pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(commission._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCommission(commission._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, filters.page + 1) })}
                disabled={filters.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((filters.page - 1) * filters.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(filters.page * filters.limit, pagination.totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setFilters({ ...filters, page })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === filters.page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Commission Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Commission</h3>
              <form onSubmit={handleCreateCommission}>
                <div className="space-y-4">
                  <select
                    required
                    value={formData.landlordId}
                    onChange={(e) => setFormData({ ...formData, landlordId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Landlord</option>
                    {landlords.map(landlord => (
                      <option key={landlord._id} value={landlord._id}>
                        {landlord.name}
                      </option>
                    ))}
                  </select>

                  <select
                    required
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Property</option>
                    {properties.map(property => (
                      <option key={property._id} value={property._id}>
                        {property.title}
                      </option>
                    ))}
                  </select>

                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="commission">Commission</option>
                    <option value="listing_fee">Listing Fee</option>
                    <option value="service_fee">Service Fee</option>
                    <option value="processing_fee">Processing Fee</option>
                    <option value="monthly_fee">Monthly Fee</option>
                  </select>

                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <input
                    type="text"
                    required
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    placeholder="Notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {showEditModal && selectedCommission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Commission</h3>
              <form onSubmit={handleUpdateCommission}>
                <div className="space-y-4">
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="commission">Commission</option>
                    <option value="listing_fee">Listing Fee</option>
                    <option value="service_fee">Service Fee</option>
                    <option value="processing_fee">Processing Fee</option>
                    <option value="monthly_fee">Monthly Fee</option>
                  </select>

                  <input
                    type="number"
                    required
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <input
                    type="text"
                    required
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />

                  <textarea
                    placeholder="Notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Commission Details Modal */}
      {showDetailsModal && selectedCommission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Landlord</label>
                  <p className="text-sm text-gray-900">{selectedCommission.landlord?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Property</label>
                  <p className="text-sm text-gray-900">{selectedCommission.property?.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm text-gray-900">{selectedCommission.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedCommission.totalAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{selectedCommission.status.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedCommission.dueDate)}</p>
                </div>
                {selectedCommission.paidDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Paid Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedCommission.paidDate)}</p>
                  </div>
                )}
                {selectedCommission.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900">{selectedCommission.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Settings</h3>
              <form onSubmit={handleUpdateCommissionSettings}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Fee Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={commissionSettings.monthlyFeePercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(parsedValue)) {
                          setCommissionSettings({
                            ...commissionSettings,
                            monthlyFeePercentage: parsedValue
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="5.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Percentage of monthly rent applied to all properties
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Fee Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={commissionSettings.listingFeeAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(parsedValue)) {
                          setCommissionSettings({
                            ...commissionSettings,
                            listingFeeAmount: parsedValue
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="100.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Standard listing fee for new properties
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Processing Fee Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={commissionSettings.processingFeeAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(parsedValue)) {
                          setCommissionSettings({
                            ...commissionSettings,
                            processingFeeAmount: parsedValue
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="50.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Standard processing fee for applications
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Fee Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={commissionSettings.lateFeePercentage}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? 0 : parseFloat(value);
                        if (!isNaN(parsedValue)) {
                          setCommissionSettings({
                            ...commissionSettings,
                            lateFeePercentage: parsedValue
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="10.0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Percentage applied to overdue payments
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
