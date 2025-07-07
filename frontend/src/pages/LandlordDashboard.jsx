import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Badge, ProgressBar, Nav, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaKey,
  FaFileContract,
  FaMoneyBillWave,
  FaUsers,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaEye,
  FaEdit,
  FaPlus,
  FaTicketAlt,
  FaBell,
  FaChartBar,
  FaDollarSign,
  FaCreditCard,
  FaReceipt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const LandlordDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchLandlordData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch all data in parallel
        const [propertiesRes, applicationsRes, ticketsRes, paymentsRes, statsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.MY_PROPERTIES, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(API_ENDPOINTS.LANDLORD_APPLICATIONS, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.LANDLORD_TICKETS, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.LANDLORD_PAYMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(API_ENDPOINTS.LANDLORD_STATISTICS, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: {} }))
        ]);

        setProperties(propertiesRes.data);
        setApplications(applicationsRes.data);
        setTickets(ticketsRes.data);
        setPayments(paymentsRes.data);
        setStatistics(statsRes.data);
      } catch (error) {
        // Error fetching landlord data
        toast.error('Failed to load landlord data');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'landlord') {
      fetchLandlordData();
    }
  }, [user]);

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      pending: 'warning',
      rented: 'info',
      inactive: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getApplicationStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      viewing: 'info'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTicketStatusBadge = (status) => {
    const variants = {
      new: 'danger',
      review: 'warning',
      approved: 'info',
      declined: 'secondary',
      resolved: 'success',
      closed: 'secondary'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const calculateOccupancyRate = () => {
    if (properties.length === 0) return 0;
    const rentedProperties = properties.filter(p => p.status === 'rented').length;
    return Math.round((rentedProperties / properties.length) * 100);
  };

  const getRecentApplications = () => {
    return applications
      .filter(app => ['pending', 'viewing'].includes(app.status))
      .slice(0, 5);
  };

  const getRecentTickets = () => {
    return tickets
      .filter(ticket => !['closed', 'resolved'].includes(ticket.status))
      .slice(0, 5);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return payments
      .filter(payment =>
        payment.status === 'pending' &&
        new Date(payment.dueDate) <= nextWeek
      )
      .slice(0, 5);
  };

  const getTotalMonthlyRent = () => {
    return properties
      .filter(p => p.status === 'rented')
      .reduce((total, property) => total + (property.price || 0), 0);
  };

  const getPendingApplicationsCount = () => {
    return applications.filter(app => app.status === 'pending').length;
  };

  const getOpenTicketsCount = () => {
    return tickets.filter(ticket => !['closed', 'resolved'].includes(ticket.status)).length;
  };

  const getTotalAnnualRent = () => {
    return getTotalMonthlyRent() * 12;
  };

  const getOverduePayments = () => {
    const today = new Date();
    return payments.filter(payment =>
      payment.status === 'pending' &&
      new Date(payment.dueDate) < today
    );
  };

  const getPaymentStatusCount = (status) => {
    return payments.filter(payment => payment.status === status).length;
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

  if (user && user.role !== 'landlord') {
    return (
      <div className="text-center mt-5">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const OverviewTab = () => (
    <>
      {/* Statistics Cards */}
      <Row className="mb-6 mx-2">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <FaHome className="text-primary" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{properties.length}</h3>
              <p className="text-muted mb-0">Total Properties</p>
              <div className="mt-2">
                <small className="text-muted">
                  {properties.filter(p => p.status === 'active').length} available
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <FaMoneyBillWave className="text-success" size={24} />
                </div>
              </div>
              <h3 className="mb-1">${getTotalMonthlyRent().toLocaleString()}</h3>
              <p className="text-muted mb-0">Monthly Rent</p>
              <div className="mt-2">
                <small className="text-muted">
                  {calculateOccupancyRate()}% occupancy rate
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                  <FaUsers className="text-warning" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{getPendingApplicationsCount()}</h3>
              <p className="text-muted mb-0">Pending Applications</p>
              <div className="mt-2">
                <small className="text-muted">
                  {applications.filter(app => app.status === 'viewing').length} viewing
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                  <FaTicketAlt className="text-danger" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{getOpenTicketsCount()}</h3>
              <p className="text-muted mb-0">Open Tickets</p>
              <div className="mt-2">
                <small className="text-muted">
                  {tickets.filter(t => t.status === 'review').length} in review
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* New row for Quick Actions, Recent Tickets, Occupancy Rate */}
      <Row className="mb-6 mx-2">
 
        <Col md={4} className="mb-3">
          {/* Recent Tickets card */}
          <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12, background: '' }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaExclamationTriangle className="me-2 text-danger" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Recent Tickets</span>
              </div>
            </Card.Header>
            <Card.Body>
              {getRecentTickets().length === 0 ? (
                <div className="text-center py-3">
                  <FaCheckCircle className="text-success mb-2" size={24} />
                  <p className="text-muted mb-0">No open tickets</p>
                </div>
              ) : (
                <div>
                  {getRecentTickets().map(ticket => (
                    <div key={ticket._id} className="py-2 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{ticket.title}</h6>
                          <p className="text-muted mb-1 small">{ticket.property?.title}</p>
                          <div className="d-flex gap-2 align-items-center">
                            {getTicketStatusBadge(ticket.status)}
                            <small className="text-muted">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <Button
                          as={Link}
                          to={`/tickets/${ticket._id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View Ticket
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          {/* Quick Actions card */}
          <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12, background: '' }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaBell className="me-2 text-primary" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Quick Actions</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/properties/create" variant="success" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaPlus className="me-2" />
                    <span>Add New Property</span>
                  </div>
                </Button>
                <Button as={Link} to="/my-properties" variant="primary" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaHome className="me-2" />
                    <span>Manage Properties</span>
                  </div>
                </Button>
                <Button as={Link} to="/my-properties" variant="warning" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaTicketAlt className="me-2" />
                    <span>View Tickets</span>
                  </div>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          {/* Occupancy Rate card */}
          <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12, background: '' }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaChartLine className="me-2 text-success" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Occupancy Rate</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <h2 className="mb-3">{calculateOccupancyRate()}%</h2>
                <ProgressBar
                  now={calculateOccupancyRate()}
                  variant="success"
                  className="mb-3"
                />
                <p className="text-muted mb-0">
                  {properties.filter(p => p.status === 'rented').length} of {properties.length} properties occupied
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row className="mx-2">
        <Col lg={12}>
          {/* Recent Applications */}
          {applications.filter(
            app => app.status !== 'cancelled' && app.status !== 'rejected' && app.status !== 'approved'
          ).length > 0 && (
              <Card className="mb-4 border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Header className="bg-white border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <FaUsers className="me-2 text-warning" />
                      Recent Applications
                    </h5>
                    <Button as={Link} to="/my-properties" variant="outline-primary" size="sm">
                      View All
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {applications.filter(
                    app => app.status !== 'cancelled' && app.status !== 'rejected'
                  ).length === 0 ? (
                    <div className="text-center py-4">
                      <FaUsers className="text-muted mb-3" size={48} />
                      <h6>No Pending Applications</h6>
                      <p className="text-muted">All caught up!</p>
                    </div>
                  ) : (
                    <div>
                      {applications.filter(
                        app => app.status !== 'cancelled' && app.status !== 'rejected'
                      ).slice(0, 5).map(application => (
                        <div key={application._id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{application.property?.title}</h6>
                            <p className="text-muted mb-1">
                              Applicant: {application.tenant?.name}
                            </p>
                            <div className="d-flex gap-2 align-items-center">
                              {getApplicationStatusBadge(application.status)}
                              <small className="text-muted">
                                <FaCalendarAlt className="me-1" />
                                {new Date(application.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                          <Button as={Link} to={`/my-properties`} variant="outline-primary" size="sm">
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
        </Col>
      </Row>
    </>
  );

  const FinancesTab = () => (
    <>
      {/* Financial Statistics Cards */}
      <Row className="mb-6 mx-2">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <FaMoneyBillWave className="text-success" size={24} />
                </div>
              </div>
              <h3 className="mb-1">${getTotalMonthlyRent().toLocaleString()}</h3>
              <p className="text-muted mb-0">Monthly Rent</p>
              <div className="mt-2">
                <small className="text-muted">
                  ${getTotalAnnualRent().toLocaleString()} annually
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                  <FaClock className="text-warning" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{getPaymentStatusCount('pending')}</h3>
              <p className="text-muted mb-0">Pending Payments</p>
              <div className="mt-2">
                <small className="text-muted">
                  ${getUpcomingPayments().reduce((total, p) => total + (p.amount || 0), 0).toLocaleString()} due
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-danger bg-opacity-10 rounded-circle p-3">
                  <FaExclamationTriangle className="text-danger" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{getOverduePayments().length}</h3>
              <p className="text-muted mb-0">Overdue Payments</p>
              <div className="mt-2">
                <small className="text-muted">
                  ${getOverduePayments().reduce((total, p) => total + (p.amount || 0), 0).toLocaleString()} overdue
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: 12, background: '' }}>
            <Card.Body className="text-center">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                  <FaCheckCircle className="text-info" size={24} />
                </div>
              </div>
              <h3 className="mb-1">{getPaymentStatusCount('completed')}</h3>
              <p className="text-muted mb-0">Completed Payments</p>
              <div className="mt-2">
                <small className="text-muted">
                  This month
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* New row for Financial Summary, Quick Actions, Monthly Revenue Trend */}
      <Row className="mb-6 mx-2">
        <Col md={4} className="mb-3">
          {/* Financial Summary card */}
          <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12 }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center" >
                <FaChartBar className="me-2 text-primary" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Financial Summary</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Monthly Revenue</span>
                  <span className="fw-bold text-success">${getTotalMonthlyRent().toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Annual Revenue</span>
                  <span className="fw-bold">${getTotalAnnualRent().toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Occupancy Rate</span>
                  <span className="fw-bold text-info">{calculateOccupancyRate()}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Pending Payments</span>
                  <span className="fw-bold text-warning">{getPaymentStatusCount('pending')}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Overdue Amount</span>
                  <span className="fw-bold text-danger">${getOverduePayments().reduce((total, p) => total + (p.amount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          {/* Quick Actions card */}
          <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12, background: '' }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaDollarSign className="me-2 text-success" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Quick Actions</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="success" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaCreditCard className="me-2" />
                    <span>Record Payment</span>
                  </div>
                </Button>
                <Button variant="primary" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaReceipt className="me-2" />
                    <span>Generate Report</span>
                  </div>
                </Button>
                <Button variant="warning" size="sm">
                  <div className="d-flex align-items-center gap-1 justify-content-center py-2">
                    <FaExclamationTriangle className="me-2" />
                    <span>Send Reminders</span>
                  </div>
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          {/* Monthly Revenue Trend card */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300" style={{ borderRadius: 12 }}>
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaChartLine className="me-2 text-success" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Monthly Revenue Trend</span>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4">
                <FaChartLine className="text-muted mb-3" size={48} />
                <h6>Revenue Chart</h6>
                <p className="text-muted mb-0">Monthly revenue visualization will be displayed here.</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Financial Content */}
      <Row className="mx-2">
        {/* Left Column */}
        <Col lg={12}>
          {/* Upcoming Payments */}
          <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center" style={{ borderRadius: 12 }}>
                <FaCalendarAlt className="me-2 text-warning" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Upcoming Payments</span>
              </div>
            </Card.Header>
            <Card.Body>
              {getUpcomingPayments().length === 0 ? (
                <div className="text-center py-4">
                  <FaCheckCircle className="text-success mb-3" size={48} />
                  <h6>No Upcoming Payments</h6>
                  <p className="text-muted">All payments are up to date!</p>
                </div>
              ) : (
                <div>
                  {getUpcomingPayments().map(payment => (
                    <div key={payment._id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{payment.property?.title || 'Property Payment'}</h6>
                        <p className="text-muted mb-1">
                          Tenant: {payment.tenant?.name || 'N/A'}
                        </p>
                        <div className="d-flex gap-2 align-items-center">
                          <Badge bg="warning">Due: ${payment.amount?.toLocaleString()}</Badge>
                          <small className="text-muted">
                            <FaCalendarAlt className="me-1" />
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button variant="outline-success" size="sm">
                          <FaCreditCard className="me-1" />
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Payment History */}
          <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <Card.Header className="bg-white border-bottom" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center">
                <FaReceipt className="me-2 text-info" />
                <span className="fw-bold" style={{ fontSize: '1.1rem' }}>Recent Payment History</span>
              </div>
            </Card.Header>
            <Card.Body>
              {payments.length === 0 ? (
                <div className="text-center py-4">
                  <FaReceipt className="text-muted mb-3" size={48} />
                  <h6>No Payment History</h6>
                  <p className="text-muted">Payment history will appear here once payments are made.</p>
                </div>
              ) : (
                <div>
                  {payments.slice(0, 5).map(payment => (
                    <div key={payment._id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{payment.property?.title || 'Property Payment'}</h6>
                        <p className="text-muted mb-1">
                          Tenant: {payment.tenant?.name || 'N/A'}
                        </p>
                        <div className="d-flex gap-2 align-items-center">
                          <Badge bg={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'secondary'}>
                            {payment.status}
                          </Badge>
                          <span className="text-muted">${payment.amount?.toLocaleString()}</span>
                          <small className="text-muted">
                            {new Date(payment.date || payment.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  return (
    <div style={{ background: '#f7f7f9', minHeight: '100vh', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
      <div className="px-6 py-8">

        {/* Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row className="mb-4 mx-2">
            <Col>
              <div className="bg-light rounded p-0" style={{ background: 'linear-gradient(to right, rgb(74 100 173), rgb(240, 247, 244))' }}>
                <Nav variant="tabs" className="border-0" >
                  <Nav.Item className="me-3">
                    <Nav.Link
                      eventKey="overview"
                      className={`border-0 px-3 py-2 fw-medium ${activeTab === 'overview'
                          ? 'text-primary border-bottom border-2 border-primary'
                          : 'text-white'
                        }`}
                    >
                      <FaHome className="me-2" size={14} />
                      Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="finances"
                      className={`border-0 px-3 py-2 fw-medium ${activeTab === 'finances'
                          ? 'text-primary border-bottom border-2 border-primary'
                          : 'text-white'
                        }`}
                    >
                      <FaMoneyBillWave className="me-2" size={14} />
                      Finances
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
            </Col>
          </Row>

          <Tab.Content>
            <Tab.Pane eventKey="overview">
              <OverviewTab />
            </Tab.Pane>
            <Tab.Pane eventKey="finances">
              <FinancesTab />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </div>
  );
};

export default LandlordDashboard;