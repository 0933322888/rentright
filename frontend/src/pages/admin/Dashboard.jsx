import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { adminButtonStyles } from '../../utils/uiUtils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    pendingProperties: 0,
    landlords: 0,
    tenants: 0,
    applications: 0,
    pendingApplications: 0,
    tickets: 0,
    openTickets: 0,
    escalations: 0,
    urgentEscalations: 0,
    newEscalations: 0
  });
  const [recentEscalations, setRecentEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        propertiesRes, 
        landlordsRes, 
        tenantsRes, 
        applicationsRes,
        ticketsRes,
        escalationsRes
      ] = await Promise.all([
        axios.get(API_ENDPOINTS.ADMIN_PROPERTIES, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(API_ENDPOINTS.ADMIN_LANDLORDS, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(API_ENDPOINTS.ADMIN_TENANTS, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(API_ENDPOINTS.ADMIN_APPLICATIONS, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(API_ENDPOINTS.TICKETS, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(API_ENDPOINTS.ESCALATIONS + '/admin', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const pendingProperties = propertiesRes.data.filter(property => property.status === 'pending').length;
      const pendingApplications = applicationsRes.data.filter(app => app.status === 'pending').length;
      const openTickets = ticketsRes.data.filter(ticket => ticket.status !== 'closed').length;
      const urgentEscalations = escalationsRes.data.filter(esc => esc.priority === 'urgent').length;
      const newEscalations = escalationsRes.data.filter(esc => esc.status === 'new').length;

      // Get recent escalations (last 5)
      const recentEsc = escalationsRes.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setStats({
        properties: propertiesRes.data.length,
        pendingProperties,
        landlords: landlordsRes.data.length,
        tenants: tenantsRes.data.length,
        applications: applicationsRes.data.length,
        pendingApplications,
        tickets: ticketsRes.data.length,
        openTickets,
        escalations: escalationsRes.data.length,
        urgentEscalations,
        newEscalations
      });

      setRecentEscalations(recentEsc);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getEscalationPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getEscalationStatusColor = (status) => {
    switch (status) {
      case 'new': return 'text-orange-600 bg-orange-100';
      case 'in_review': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Priority Alerts */}
      {(stats.urgentEscalations > 0 || stats.newEscalations > 0 || stats.pendingProperties > 0) && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Priority Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.urgentEscalations > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {stats.urgentEscalations} Urgent Escalation{stats.urgentEscalations !== 1 ? 's' : ''} Require{stats.urgentEscalations !== 1 ? '' : 's'} Attention
                    </h3>
                    <button
                      onClick={() => navigate('/admin/escalations')}
                      className="mt-1 text-sm text-red-600 hover:text-red-500 font-medium"
                    >
                      View Escalations →
                    </button>
                  </div>
                </div>
              </div>
            )}
            {stats.newEscalations > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      {stats.newEscalations} New Escalation{stats.newEscalations !== 1 ? 's' : ''} Awaiting Review
                    </h3>
                    <button
                      onClick={() => navigate('/admin/escalations')}
                      className="mt-1 text-sm text-orange-600 hover:text-orange-500 font-medium"
                    >
                      Review Escalations →
                    </button>
                  </div>
                </div>
              </div>
            )}
            {stats.pendingProperties > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {stats.pendingProperties} Property{stats.pendingProperties !== 1 ? 'ies' : ''} Pending Approval
                    </h3>
                    <button
                      onClick={() => navigate('/admin/properties')}
                      className="mt-1 text-sm text-yellow-600 hover:text-yellow-500 font-medium"
                    >
                      Review Properties →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Escalations Card - Most Important */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-red-200 truncate">Escalations</dt>
                  <dd className="text-2xl font-bold">{stats.escalations}</dd>
                  <div className="flex items-center space-x-4 mt-1">
                    {stats.newEscalations > 0 && (
                      <dd className="text-sm text-red-200 bg-red-700 px-2 py-1 rounded-full">
                        {stats.newEscalations} new
                      </dd>
                    )}
                    {stats.urgentEscalations > 0 && (
                      <dd className="text-sm text-red-200 bg-red-700 px-2 py-1 rounded-full">
                        {stats.urgentEscalations} urgent
                      </dd>
                    )}
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-red-600 px-5 py-3">
            <button
              onClick={() => navigate('/admin/escalations')}
              className="text-sm font-bold text-red-500 hover:text-red-300"
            >
              View All →
            </button>
          </div>
        </div>

        {/* Pending Properties Card */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-yellow-200 truncate">Pending Properties</dt>
                  <dd className="text-2xl font-bold">{stats.pendingProperties}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-yellow-600 px-5 py-3">
            <button
              onClick={() => navigate('/admin/properties')}
              className="text-sm font-bold text-yellow-500 hover:text-yellow-300"
            >
              Review All →
            </button>
          </div>
        </div>

        {/* Open Tickets Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-blue-200 truncate">Open Tickets</dt>
                  <dd className="text-2xl font-bold">{stats.openTickets}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-blue-600 px-5 py-3">
            <button
              onClick={() => navigate('/admin/tickets')}
              className="text-sm font-bold text-blue-500 hover:text-blue-300"
            >
              View All →
            </button>
          </div>
        </div>

        {/* Pending Applications Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-green-200 truncate">Pending Applications</dt>
                  <dd className="text-2xl font-bold">{stats.pendingApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-green-600 px-5 py-3">
            <button
              onClick={() => navigate('/admin/applications')}
              className="text-sm font-bold text-green-500 hover:text-green-300"
            >
              Review All →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Escalations Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Escalations</h2>
          <button
            onClick={() => navigate('/admin/escalations')}
            className={adminButtonStyles.primary}
          >
            View All Escalations
          </button>
        </div>
        
        {recentEscalations.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recentEscalations.map((escalation) => (
                <li key={escalation._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {escalation.property?.title || 'Property not found'}
                            </p>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEscalationPriorityColor(escalation.priority)}`}>
                              {escalation.priority}
                            </span>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEscalationStatusColor(escalation.status)}`}>
                              {escalation.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {escalation.tenant?.name || 'Unknown tenant'} - {escalation.reason?.replace('_', ' ').toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500">
                          {formatDate(escalation.createdAt)}
                        </p>
                        <button
                          onClick={() => navigate('/admin/escalations')}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-500"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No escalations</h3>
            <p className="mt-1 text-sm text-gray-500">All escalations have been resolved.</p>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Properties */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Properties</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.properties}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Landlords */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Landlords</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.landlords}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Tenants */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tenants</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.tenants}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 