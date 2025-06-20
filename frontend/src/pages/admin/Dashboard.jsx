import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { adminButtonStyles } from '../../utils/uiUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [stats, setStats] = useState({
        totalApplications: 0,
        approvedApplications: 0,
        declinedApplications: 0,
        pendingApplications: 0,
        escalations: 0,
        newEscalations: 0,
        urgentEscalations: 0,
        recentEscalations: [],
    pendingProperties: 0,
        openTickets: 0,
        lastUpdated: null
    });
    const [dateRange, setDateRange] = useState('7');

    // Generate date labels based on selected range
    const generateDateLabels = (days) => {
        const labels = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }));
        }
        
        return labels;
    };

    // Generate sample data points (replace with real data)
    const generateDataPoints = (days, maxValue) => {
        const points = [];
        for (let i = 0; i < days; i++) {
            const x = 20 + (i * 360 / (days - 1));
            const y = 180 - (Math.random() * maxValue * 4);
            points.push(`${x},${y}`);
        }
        return points.join(' ');
    };

    const dateLabels = generateDateLabels(parseInt(dateRange));
    const propertiesData = generateDataPoints(parseInt(dateRange), 40);
    const escalationsData = generateDataPoints(parseInt(dateRange), 20);

  useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_ENDPOINTS.ADMIN + '/dashboard/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setStats(response.data);
                setError(null);
    } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError(err.response?.data?.message || 'Error fetching dashboard statistics');
    } finally {
      setLoading(false);
    }
        };

        fetchDashboardStats();
    }, []);

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

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
        },
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: false,
        },
        grid: {
          color: '#f3f4f6',
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Properties chart data
  const propertiesChartData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Properties',
        data: propertiesData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Escalations chart data
  const escalationsChartData = {
    labels: dateLabels,
    datasets: [
      {
        label: 'Escalations',
        data: escalationsData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

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

            {/* Charts Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
                    <div className="flex space-x-2">
                        <select 
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setDateRange(e.target.value)}
                            value={dateRange}
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
        </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Properties Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Properties</h3>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
                            </div>
                        ) : (
                            <div className="h-64">
                                <Line options={chartOptions} data={propertiesChartData} />
                            </div>
                        )}
                    </div>

                    {/* Escalations Chart */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Escalations</h3>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
                            </div>
                        ) : (
                            <div className="h-64">
                                <Line options={chartOptions} data={escalationsChartData} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Escalations Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Escalations</h2>
                    <button
                        onClick={() => navigate('/admin/escalations')}
                        className="text-sm font-bold text-red-500 hover:text-red-300"
                    >
                        View All Escalations
                    </button>
                </div>

                {stats.recentEscalations.length > 0 ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {stats.recentEscalations.map((escalation) => (
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
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-500">No recent escalations</p>
                    </div>
                )}
            </div>

            {/* Totals Section */}
            <div className="mb-8">
                {loading ? (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
                                        <div className="animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                </dl>
              </div>
            </div>
                ) : (
                    <div className="">
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total/Approved Applications</dt>
                                <dd className="mt-1 flex justify-between items-center">
                                    <span className="text-3xl font-semibold text-gray-900">
                                        {stats.totalApplications || 0} / <span className="text-green-600">{stats.approvedApplications || 0}</span>
                                    </span>
                                    <button
                                        onClick={() => navigate('/admin/applications')}
                                        className="text-sm font-bold text-green-500 hover:text-green-300"
                                    >
                                        View All
                                    </button>
                                </dd>
                            </div>

                            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Properties</dt>
                                <dd className="mt-1 flex justify-between items-center">
                                    <span className="text-3xl font-semibold text-gray-900">{stats.totalProperties || 0}</span>
                                    <button
                                        onClick={() => navigate('/admin/properties')}
                                        className="text-sm font-bold text-blue-500 hover:text-blue-300"
                                    >
                                        View All
                                    </button>
                                </dd>
                            </div>

                            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Landlords</dt>
                                <dd className="mt-1 flex justify-between items-center">
                                    <span className="text-3xl font-semibold text-gray-900">{stats.totalLandlords || 0}</span>
                                    <button
                                        onClick={() => navigate('/admin/landlords')}
                                        className="text-sm font-bold text-yellow-500 hover:text-yellow-300"
                                    >
                                        View All
                                    </button>
                                </dd>
                            </div>

                            <div className="px-4 py-5 bg-white shadow rounded-lg overflow-hidden sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Tenants</dt>
                                <dd className="mt-1 flex justify-between items-center">
                                    <span className="text-3xl font-semibold text-gray-900">{stats.totalTenants || 0}</span>
                                    <button
                                        onClick={() => navigate('/admin/tenants')}
                                        className="text-sm font-bold text-red-500 hover:text-red-300"
                                    >
                                        View All
                                    </button>
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
      </div>
    </div>
  );
} 