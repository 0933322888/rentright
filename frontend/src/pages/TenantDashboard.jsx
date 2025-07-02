import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Container, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import PaymentSetupModal from '../components/PaymentSetupModal';
import RentPaymentModal from '../components/RentPaymentModal';
import { 
  FaUser, FaHome, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBuilding, 
  FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaCheck, FaTimes, FaEye,
  FaTicketAlt, FaMoneyBillWave, FaExclamationTriangle, FaFileContract, FaCalendarCheck,
  FaCreditCard, FaWallet
} from 'react-icons/fa';
import ViewingScheduleModal from '../components/ViewingScheduleModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast from 'react-hot-toast';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [paymentsError, setPaymentsError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentSetupModal, setShowPaymentSetupModal] = useState(false);
  const [showRentPaymentModal, setShowRentPaymentModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [paymentSetupStatus, setPaymentSetupStatus] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [profileRes, applicationsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(API_ENDPOINTS.APPLICATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTenantData(profileRes.data);
      setApplications(applicationsRes.data);

      // Check if profile is complete - updated logic
      const profile = profileRes.data;
      const isProfileComplete = profile && 
        profile.proofOfIdentity && 
        profile.proofOfIncome && 
        profile.monthsAheadCanPay;

      console.log('Profile completion check:', {
        profile,
        isProfileComplete,
        hasIdentity: !!profile?.proofOfIdentity,
        hasIncome: !!profile?.proofOfIncome,
        paymentStatus: profile?.monthsAheadCanPay
      });

      // Only show profile modal if profile is actually incomplete
      if (!isProfileComplete) {
        setShowProfileModal(true);
      }

      // Fetch tickets and payments if there's an approved application
      const approvedApplication = applicationsRes.data.find(app => app.status === 'approved');
      if (approvedApplication) {
        // Reset errors
        setTicketsError(null);
        setPaymentsError(null);

        // Fetch tickets and payments separately to handle errors independently
        try {
          const ticketsRes = await axios.get(API_ENDPOINTS.MY_TICKETS, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTickets(ticketsRes.data);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          setTicketsError('Failed to load tickets');
          setTickets([]); // Reset tickets to empty array
        }

        try {
          const paymentsRes = await axios.get(`${API_ENDPOINTS.PAYMENTS}/tenant/${approvedApplication._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Payments response:', paymentsRes.data);
          setPayments(paymentsRes.data);
        } catch (error) {
          console.error('Error fetching payments:', error);
          setPaymentsError('Failed to load payments');
          setPayments([]); // Reset payments to empty array
        }

        // Fetch payment setup status
        try {
          const paymentSetupRes = await axios.get(
            API_ENDPOINTS.PAYMENT_SETUP_STATUS(user._id),
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setPaymentSetupStatus(paymentSetupRes.data);
        } catch (error) {
          console.error('Error fetching payment setup status:', error);
          setPaymentSetupStatus({ setupExists: false, setupCompleted: false });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Only show profile modal on actual errors, not just for incomplete profile
      if (error.response?.status === 404) {
        setShowProfileModal(true);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Add useEffect to log payments state changes
  useEffect(() => {
    console.log('Payments state updated:', payments);
  }, [payments]);

  const handlePaymentSetupSuccess = () => {
    setShowPaymentSetupModal(false);
    fetchDashboardData(); // Refresh data to get updated payment setup status
    toast.success('Payment method set up successfully!');
  };

  const handleRentPaymentSuccess = () => {
    setShowRentPaymentModal(false);
    fetchDashboardData(); // Refresh data to get updated payments
    toast.success('Rent payment completed successfully!');
  };

  if (loading) {
    return (
      <div className="w-full d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const activeApplications = applications.filter(app => 
    ['viewing', 'pending'].includes(app.status)
  );

  const approvedApplication = applications.find(app => app.status === 'approved');

  // Hide both sections if no active applications and there is an approved application
  const hideApplicationsAndViewings = activeApplications.length === 0 && !!approvedApplication;

  const handlePromoteApplication = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_ENDPOINTS.APPLICATIONS}/${applicationId}/promote`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Application promoted to pending status');
      fetchDashboardData();
    } catch (error) {
      console.error('Error promoting application:', error);
      toast.error(error.response?.data?.message || 'Failed to promote application');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FaCheck className="text-success" />;
      case 'rejected':
        return <FaTimes className="text-danger" />;
      case 'viewing':
        return <FaEye className="text-info" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "badge rounded-pill px-3 py-2";
    switch (status) {
      case 'approved':
        return <span className={`${baseClasses} bg-success text-white`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-danger text-white`}>Rejected</span>;
      case 'viewing':
        return <span className={`${baseClasses} bg-info text-white`}>Viewing Scheduled</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-warning text-dark`}>Pending</span>;
      default:
        return <span className={`${baseClasses} bg-secondary text-white`}>{status}</span>;
    }
  };

  // Handler for reschedule
  const handleReschedule = (app) => {
    setSelectedApplication(app);
    setShowRescheduleModal(true);
  };

  // Handler for cancel
  const handleCancel = (app) => {
    setSelectedApplication(app);
    setShowCancelModal(true);
  };

  const getTicketStatusBadge = (status) => {
    const baseClasses = "badge rounded-pill px-3 py-2";
    switch (status) {
      case 'new':
        return <span className={`${baseClasses} bg-danger text-white`}>New</span>;
      case 'review':
        return <span className={`${baseClasses} bg-warning text-dark`}>Review</span>;
      case 'approved':
        return <span className={`${baseClasses} bg-info text-white`}>Approved</span>;
      case 'declined':
        return <span className={`${baseClasses} bg-secondary text-white`}>Declined</span>;
      case 'resolved':
        return <span className={`${baseClasses} bg-success text-white`}>Resolved</span>;
      case 'closed':
        return <span className={`${baseClasses} bg-secondary text-white`}>Closed</span>;
      default:
        return <span className={`${baseClasses} bg-secondary text-white`}>{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    const baseClasses = "badge rounded-pill px-3 py-2";
    switch (status) {
      case 'paid':
        return <span className={`${baseClasses} bg-success text-white`}>Paid</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-warning text-dark`}>Pending</span>;
      case 'overdue':
        return <span className={`${baseClasses} bg-danger text-white`}>Overdue</span>;
      default:
        return <span className={`${baseClasses} bg-secondary text-white`}>{status}</span>;
    }
  };

  const getNextAction = () => {
    if (!applications || applications.length === 0) {
      return {
        type: 'apply',
        title: 'Start Your Application',
        description: 'Begin your journey by applying for a property.',
        icon: <FaHome className="text-primary" size={24} />,
        action: {
          text: 'Find Properties',
          link: '/properties'
        },
        priority: 1
      };
    }

    // Check for pending lease agreement
    const approvedApplication = applications.find(app => 
      app.status === 'approved' && !app.leaseSigned
    );
    if (approvedApplication) {
      return {
        type: 'lease',
        title: 'Sign Lease Agreement',
        description: `You've been approved for ${approvedApplication.property.title}. Please review and sign the lease agreement.`,
        icon: <FaFileContract className="text-warning" size={24} />,
        action: {
          text: 'Review Lease',
          link: `/my-lease`
        },
        priority: 2
      };
    }

    // Check for upcoming viewing
    const upcomingViewing = applications.find(app => 
      app.status === 'viewing' && 
      app.viewingDate && 
      new Date(app.viewingDate) > new Date()
    );
    if (upcomingViewing) {
      return {
        type: 'viewing',
        title: 'Upcoming Viewing',
        description: `You have a viewing scheduled for ${upcomingViewing.property.title} on ${new Date(upcomingViewing.viewingDate).toLocaleDateString()}.`,
        icon: <FaCalendarCheck className="text-info" size={24} />,
        action: {
          text: 'View Details',
          link: `/applications/${upcomingViewing._id}`
        },
        priority: 3
      };
    }

    // Check for overdue payments
    if (Array.isArray(payments)) {
      const overduePayment = payments.find(payment => 
        payment.status === 'overdue' || 
        (payment.status === 'pending' && new Date(payment.dueDate) < new Date())
      );
      if (overduePayment) {
        return {
          type: 'payment',
          title: 'Payment Overdue',
          description: `You have an overdue payment of $${overduePayment.amount.toFixed(2)} due on ${new Date(overduePayment.dueDate).toLocaleDateString()}.`,
          icon: <FaExclamationTriangle className="text-danger" size={24} />,
          action: {
            text: 'Make Payment',
            link: `/payments/${overduePayment._id}`
          },
          priority: 4
        };
      }
    }

    // If no specific action is needed
    return {
      type: 'none',
      title: 'All Caught Up',
      description: 'You have no pending actions at the moment.',
      icon: <FaCheckCircle className="text-success" size={24} />,
      action: null,
      priority: 5
    };
  };

  return (
    <div style={{ background: '#f7f7f9', minHeight: '100vh', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <div>
        <ProfileCompletionModal 
          show={showProfileModal} 
          onHide={() => setShowProfileModal(false)} 
        />
        <div>
          <div>
            {/* Next Action Section - colorful card */}
            <Row className="mb-6 mx-2 my-2">
              <Col md={12}>
                <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: 18, background: 'linear-gradient(85deg, #4a64ad 0%, #e6ecf7 100%)', boxShadow: '0 2px 12px rgba(30,34,90,0.04)' }}>
                  <Card.Body>
                    {(() => {
                      const nextAction = getNextAction();
                      const getHeaderIcon = (type) => {
                        switch (type) {
                          case 'profile': return <FaUser className="text-white" size={24} />;
                          case 'application': return <FaHome className="text-white" size={24} />;
                          case 'viewing': return <FaCalendarCheck className="text-white" size={24} />;
                          case 'payment': return <FaExclamationTriangle className="text-white" size={24} />;
                          default: return <FaCheckCircle className="text-white" size={24} />;
                        }
                      };
                      // Always use green for icon background as in screenshot
                      const iconBg = '#43c463';
                      return (
                        <div>
                          <div className="mb-2">
                            <span className="badge bg-light text-muted px-3 py-2" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                              Next Action
                            </span>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="me-4">
                              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: iconBg
                              }}>
                                {getHeaderIcon(nextAction.type)}
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <h5 className="mb-1 fw-bold" style={{ color: 'white' }}>{nextAction.title}</h5>
                              <p className="mb-0" style={{ color: '#e6ecf7' }}>{nextAction.description}</p>
                            </div>
                            {nextAction.action && (
                              <div>
                                <Link to={nextAction.action.link}>
                                  <Button style={{ background: '#4a64ad', border: 'none' }}>
                                    {nextAction.action.text}
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Tickets and Recent Payments Section - Only visible for approved tenants */}
            {approvedApplication && (
              <Row className="mb-6 mx-2">
                {/* Tickets Section */}
                <Col md={6} className="mb-4 mb-md-0">
                  <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <FaTicketAlt className="text-primary me-2" size={24} />
                          <Card.Title className="mb-0">Maintenance Tickets</Card.Title>
                        </div>
                        <Link to="/tickets/create">
                          <Button variant="primary" size="sm">Create New Ticket</Button>
                        </Link>
                      </div>
                      {ticketsError ? (
                        <div className="text-center py-4">
                          <p className="text-danger mb-2">{ticketsError}</p>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => fetchDashboardData()}
                          >
                            Retry Loading Tickets
                          </Button>
                        </div>
                      ) : Array.isArray(tickets) && tickets.length > 0 ? (
                        <>
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead>
                                <tr>
                                  <th>Title</th>
                                  <th>Category</th>
                                  <th>Created</th>
                                  <th>Status</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tickets.map(ticket => (
                                  <tr key={ticket._id}>
                                    <td>{ticket.title}</td>
                                    <td>{ticket.category}</td>
                                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                    <td>{getTicketStatusBadge(ticket.status)}</td>
                                    <td>
                                      <Link to={`/tickets/${ticket._id}`}>
                                        <Button variant="outline-primary" size="sm">View Details</Button>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Link to="/tickets">
                            <Button variant="outline-primary" className="w-100 mt-3">View All Tickets</Button>
                          </Link>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No maintenance tickets</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Recent Payments Section */}
                <Col md={6}>
                  <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <FaMoneyBillWave className="text-primary me-2" size={24} />
                          <Card.Title className="mb-0">Recent Payments</Card.Title>
                        </div>
                        <div className="d-flex gap-2">
                          {paymentSetupStatus?.setupCompleted ? (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => setShowRentPaymentModal(true)}
                            >
                              <FaCreditCard className="me-1" />
                              Pay Rent
                            </Button>
                          ) : (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => setShowPaymentSetupModal(true)}
                            >
                              <FaWallet className="me-1" />
                              Setup Payment
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Payment Setup Status */}
                      {paymentSetupStatus && (
                        <div className="mb-3">
                          {paymentSetupStatus.setupCompleted ? (
                            <div className="alert alert-success d-flex align-items-center py-2">
                              <FaCheckCircle className="me-2" />
                              <small>Payment method set up ✓</small>
                            </div>
                          ) : (
                            <div className="alert alert-warning d-flex align-items-center py-2">
                              <FaExclamationTriangle className="me-2" />
                              <small>Payment method not set up</small>
                            </div>
                          )}
                        </div>
                      )}

                      {paymentsError ? (
                        <div className="text-center py-4">
                          <p className="text-danger mb-2">{paymentsError}</p>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => fetchDashboardData()}
                          >
                            Retry Loading Payments
                          </Button>
                        </div>
                      ) : Array.isArray(payments) && payments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payments
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                                .slice(0, 3) // Take only the last 3 payments
                                .map(payment => (
                                  <tr key={payment._id}>
                                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                                    <td>{payment.description || 'Rent Payment'}</td>
                                    <td>${typeof payment.amount === 'number' ? payment.amount.toFixed(2) : '0.00'}</td>
                                    <td>{getPaymentStatusBadge(payment.status)}</td>
                                    <td>
                                      <Link to={`/payments/${payment._id}`}>
                                        <Button variant="outline-primary" size="sm">View Details</Button>
                                      </Link>
                                    </td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">
                            {!Array.isArray(payments) 
                              ? 'Error loading payments' 
                              : 'No payment history'}
                          </p>
                        </div>
                      )}
                      <Link to="/payments">
                        <Button variant="outline-primary" className="w-100 mt-3">View All Payments</Button>
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Active Applications and Upcoming Viewings Section */}
            {!hideApplicationsAndViewings && (
              <Row className="mb-6 mx-2">
                {/* Active Applications Section */}
                <Col md={6} className="mb-4 mb-md-0">
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(30,34,90,0.04)' }}>
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <FaHome className="me-2" size={24} style={{ color: '#4f8cff', opacity: 0.8 }} />
                        <Card.Title className="mb-0" style={{ color: '#222', fontWeight: 600, fontSize: '1.2rem' }}>Active Applications</Card.Title>
                      </div>
                      {activeApplications.length > 0 ? (
                        activeApplications.map(application => (
                          <div key={application._id} className="mb-4 p-3 border rounded">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h5 className="mb-0">{application.property?.title}</h5>
                              <div className="d-flex flex-column align-items-end">
                                {getStatusBadge(application.status)}
                                {application.status === 'pending' && (
                                  <div style={{ color: '#6c757d', fontSize: '0.97rem', marginTop: 2 }}>
                                    <em>Application is awaiting landlord review</em>
                                  </div>
                                )}
                                {application.status === 'viewing' && (
                                  <div style={{ color: '#6c757d', fontSize: '0.97rem', marginTop: 2 }}>
                                    <em>Please arrive 10 minutes before the viewing time</em>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="d-flex align-items-center mb-1" style={{ fontSize: '1rem' }}>
                              <FaMapMarkerAlt className="text-muted me-2" style={{ fontSize: 20 }} />
                              <span>{application.property?.location?.street}, {application.property?.location?.city}</span>
                            </div>
                            {application.viewingDate && (
                              <>
                                <div className="d-flex align-items-center mb-1" style={{ fontSize: '1rem' }}>
                                  <FaCalendarAlt className="text-muted me-2" style={{ fontSize: 20 }} />
                                  <span>Viewing Date: {new Date(application.viewingDate).toLocaleDateString()}</span>
                                </div>
                                <div className="d-flex align-items-center mb-1" style={{ fontSize: '1rem' }}>
                                  <FaClock className="text-muted me-2" style={{ fontSize: 20 }} />
                                  <span>Viewing Time: {application.viewingTime}</span>
                                </div>
                              </>
                            )}
                            <div className="d-flex align-items-center mb-1" style={{ fontSize: '1rem' }}>
                              <FaBuilding className="text-muted me-2" style={{ fontSize: 20 }} />
                              <span>Submitted: {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                            {application.status === 'viewing' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="mt-2"
                                onClick={() => handlePromoteApplication(application._id)}
                              >
                                Apply for tenancy
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted mb-3">No active applications</p>
                        </div>
                      )}
                      {applications.length > 0 && (
                        <Link to="/applications">
                          <Button variant="outline-primary" className="w-100 mt-3">View All Applications</Button>
                        </Link>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Upcoming Viewings Section */}
                <Col md={6}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(30,34,90,0.04)' }}>
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <FaCalendarAlt className="me-2" size={24} style={{ color: '#a259ff', opacity: 0.8 }} />
                        <Card.Title className="mb-0" style={{ color: '#222', fontWeight: 600, fontSize: '1.2rem' }}>Upcoming Viewings</Card.Title>
                      </div>
                      {activeApplications.filter(app => app.viewingDate).length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Property</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeApplications
                                .filter(app => app.viewingDate)
                                .map(app => (
                                  <tr key={app._id}>
                                    <td>
                                      <Link to={`/properties/${app.property._id}`} className="text-decoration-none">
                                        {app.property.title}
                                      </Link>
                                    </td>
                                    <td>{new Date(app.viewingDate).toLocaleDateString()}</td>
                                    <td>{app.viewingTime}</td>
                                    <td>{getStatusBadge(app.status)}</td>
                                    <td>
                                      {app.status === 'viewing' && (
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          className="me-2"
                                          onClick={() => handlePromoteApplication(app._id)}
                                        >
                                          Apply for tenancy
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="me-2"
                                        onClick={() => handleReschedule(app)}
                                      >
                                        Reschedule
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleCancel(app)}
                                      >
                                        Cancel
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No upcoming viewings scheduled</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </div>
        </div>
      </div>

      <ViewingScheduleModal
        show={showRescheduleModal}
        onHide={() => setShowRescheduleModal(false)}
        application={selectedApplication}
        onSuccess={() => {
          setShowRescheduleModal(false);
          fetchDashboardData();
        }}
      />

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Cancel Viewing</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel this viewing?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            No, Keep It
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                await axios.patch(
                  `${API_ENDPOINTS.APPLICATIONS}/${selectedApplication._id}/cancel`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                toast.success('Viewing cancelled successfully');
                setShowCancelModal(false);
                fetchDashboardData();
              } catch (error) {
                console.error('Error cancelling viewing:', error);
                toast.error(error.response?.data?.message || 'Failed to cancel viewing');
              }
            }}
          >
            Yes, Cancel It
          </Button>
        </Modal.Footer>
      </Modal>

      <PaymentSetupModal
        show={showPaymentSetupModal}
        onHide={() => setShowPaymentSetupModal(false)}
        onSuccess={handlePaymentSetupSuccess}
      />

      <RentPaymentModal
        show={showRentPaymentModal}
        onHide={() => setShowRentPaymentModal(false)}
        onSuccess={handleRentPaymentSuccess}
        amount={approvedApplication?.property?.price || 0}
        property={approvedApplication?.property}
      />
    </div>
  );
};

export default TenantDashboard; 