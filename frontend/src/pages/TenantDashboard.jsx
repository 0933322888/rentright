import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Container, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import { 
  FaUser, FaHome, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBuilding, 
  FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaCheck, FaTimes, FaEye,
  FaTicketAlt, FaMoneyBillWave, FaExclamationTriangle, FaFileContract, FaCalendarCheck
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
  const [selectedApplication, setSelectedApplication] = useState(null);

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
        profile.creditHistory && 
        profile.rentalHistory && 
        profile.hasBeenEvicted !== null && 
        profile.hasBeenEvicted !== undefined &&
        profile.canPayMoreThanOneMonth !== null && 
        profile.canPayMoreThanOneMonth !== undefined;

      console.log('Profile completion check:', {
        profile,
        isProfileComplete,
        hasIdentity: !!profile?.proofOfIdentity,
        hasIncome: !!profile?.proofOfIncome,
        hasCredit: !!profile?.creditHistory,
        hasRental: !!profile?.rentalHistory,
        evictionStatus: profile?.hasBeenEvicted,
        paymentStatus: profile?.canPayMoreThanOneMonth
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
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
      case 'open':
        return <span className={`${baseClasses} bg-warning text-dark`}>Open</span>;
      case 'in_progress':
        return <span className={`${baseClasses} bg-info text-white`}>In Progress</span>;
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
    <div className="w-full">
      <ProfileCompletionModal 
        show={showProfileModal} 
        onHide={() => setShowProfileModal(false)} 
      />
      
      <div className="bg-white">
        <div className="py-8">
          {/* Next Action Section */}
          <Row className="mb-6">
            <Col md={12}>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <h5 className="mb-3">Next Action</h5>
                  {(() => {
                    const nextAction = getNextAction();
                    return (
                      <div className="d-flex align-items-center">
                        <div className="me-4">
                          {nextAction.icon}
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{nextAction.title}</h6>
                          <p className="text-muted mb-0">{nextAction.description}</p>
                        </div>
                        {nextAction.action && (
                          <div>
                            <Link to={nextAction.action.link}>
                              <Button variant="primary">
                                {nextAction.action.text}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tickets and Recent Payments Section - Only visible for approved tenants */}
          {approvedApplication && (
            <Row className="mb-6">
              {/* Tickets Section */}
              <Col md={6} className="mb-4 mb-md-0">
                <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Card.Body>
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
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center">
                        <FaMoneyBillWave className="text-primary me-2" size={24} />
                        <Card.Title className="mb-0">Recent Payments</Card.Title>
                      </div>
                      <Link to="/payments">
                        <Button variant="primary" size="sm">Make Payment</Button>
                      </Link>
                    </div>
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

          {/* Active Applications Section */}
          <Row className="mb-6">
            <Col md={12}>
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FaHome className="text-primary me-2" size={24} />
                    <Card.Title className="mb-0">Active Applications</Card.Title>
                  </div>
                  {activeApplications.length > 0 ? (
                    activeApplications.map(application => (
                      <div key={application._id} className="mb-4 p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="mb-0">{application.property?.title}</h5>
                          {getStatusBadge(application.status)}
                        </div>
                        <p className="mb-1">
                          <FaMapMarkerAlt className="text-muted me-2" />
                          {application.property?.location?.street}, {application.property?.location?.city}
                        </p>
                        {application.viewingDate && (
                          <>
                            <p className="mb-1">
                              <FaCalendarAlt className="text-muted me-2" />
                              Viewing Date: {new Date(application.viewingDate).toLocaleDateString()}
                            </p>
                            <p className="mb-1">
                              <FaClock className="text-muted me-2" />
                              Viewing Time: {application.viewingTime}
                            </p>
                          </>
                        )}
                        <p className="mb-1">
                          <FaBuilding className="text-muted me-2" />
                          Submitted: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
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
                  <Link to="/applications">
                    <Button variant="outline-primary" className="w-100 mt-3">View All Applications</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Viewings Section */}
          <Row className="mb-6">
            <Col md={12}>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FaCalendarAlt className="text-primary me-2" size={24} />
                    <Card.Title className="mb-0">Upcoming Viewings</Card.Title>
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
    </div>
  );
};

export default TenantDashboard; 