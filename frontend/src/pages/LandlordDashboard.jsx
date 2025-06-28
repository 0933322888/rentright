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
        console.error('Error fetching landlord data:', error);
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
      open: 'danger',
      in_progress: 'warning',
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
      .filter(ticket => ['open', 'in_progress'].includes(ticket.status))
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
    return tickets.filter(ticket => ['open', 'in_progress'].includes(ticket.status)).length;
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
      <Row className="mb-6">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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
                  {tickets.filter(t => t.status === 'in_progress').length} in progress
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        {/* Left Column */}
        <Col lg={8}>
          {/* Properties Overview */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaHome className="me-2 text-primary" />
                  Properties Overview
                </h5>
                <Button as={Link} to="/my-properties" variant="outline-primary" size="sm">
                  View All
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {properties.length === 0 ? (
                <div className="text-center py-4">
                  <FaHome className="text-muted mb-3" size={48} />
                  <h6>No Properties Yet</h6>
                  <p className="text-muted">Start by adding your first property</p>
                  <Button as={Link} to="/properties/create" variant="primary">
                    Add Property
                  </Button>
                </div>
              ) : (
                <div>
                  {properties.slice(0, 3).map(property => (
                    <div key={property._id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{property.title}</h6>
                        <p className="text-muted mb-1">
                          <FaMapMarkerAlt className="me-1" />
                          {property.location?.street}, {property.location?.city}
                        </p>
                        <div className="d-flex gap-2">
                          {getStatusBadge(property.status)}
                          <span className="text-muted">${property.price}/month</span>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button as={Link} to={`/properties/${property._id}`} variant="outline-primary" size="sm">
                          <FaEye />
                        </Button>
                        <Button as={Link} to={`/edit-property/${property._id}`} variant="outline-secondary" size="sm">
                          <FaEdit />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Recent Applications */}
          <Card className="mb-4 border-0 shadow-sm">
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
              {getRecentApplications().length === 0 ? (
                <div className="text-center py-4">
                  <FaUsers className="text-muted mb-3" size={48} />
                  <h6>No Pending Applications</h6>
                  <p className="text-muted">All caught up!</p>
                </div>
              ) : (
                <div>
                  {getRecentApplications().map(application => (
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
        </Col>

        {/* Right Column */}
        <Col lg={4}>
          {/* Quick Actions */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaBell className="me-2 text-primary" />
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button as={Link} to="/properties/create" variant="primary" size="sm">
                  <FaPlus className="me-2" />
                  Add New Property
                </Button>
                <Button as={Link} to="/my-properties" variant="outline-primary" size="sm">
                  <FaHome className="me-2" />
                  Manage Properties
                </Button>
                <Button as={Link} to="/my-tickets" variant="outline-warning" size="sm">
                  <FaTicketAlt className="me-2" />
                  View Tickets
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Recent Tickets */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaExclamationTriangle className="me-2 text-danger" />
                Recent Tickets
              </h5>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Occupancy Rate */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaChartLine className="me-2 text-success" />
                Occupancy Rate
              </h5>
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
    </>
  );

  const FinancesTab = () => (
    <>
      {/* Financial Statistics Cards */}
      <Row className="mb-6">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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
          <Card className="h-100 border-0 shadow-sm">
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

      {/* Financial Content */}
      <Row>
        {/* Left Column */}
        <Col lg={8}>
          {/* Upcoming Payments */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaCalendarAlt className="me-2 text-warning" />
                  Upcoming Payments
                </h5>
                <Button as={Link} to="/my-properties" variant="outline-primary" size="sm">
                  View All
                </Button>
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
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaReceipt className="me-2 text-info" />
                  Recent Payment History
                </h5>
                <Button as={Link} to="/my-properties" variant="outline-primary" size="sm">
                  View All
                </Button>
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

        {/* Right Column */}
        <Col lg={4}>
          {/* Financial Summary */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaChartBar className="me-2 text-primary" />
                Financial Summary
              </h5>
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

          {/* Quick Financial Actions */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaDollarSign className="me-2 text-success" />
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="success" size="sm">
                  <FaCreditCard className="me-2" />
                  Record Payment
                </Button>
                <Button variant="outline-primary" size="sm">
                  <FaReceipt className="me-2" />
                  Generate Report
                </Button>
                <Button variant="outline-warning" size="sm">
                  <FaExclamationTriangle className="me-2" />
                  Send Reminders
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Revenue Chart Placeholder */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">
                <FaChartLine className="me-2 text-success" />
                Monthly Revenue Trend
              </h5>
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
    </>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-8">
        {/* Header Section */}
       

        {/* Tabs */}
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row className="mb-4">
            <Col>
              <div className="bg-light rounded p-3">
                <Nav variant="tabs" className="border-0">
                  <Nav.Item className="me-3">
                    <Nav.Link 
                      eventKey="overview" 
                      className={`border-0 px-3 py-2 fw-medium ${
                        activeTab === 'overview' 
                          ? 'text-primary border-bottom border-2 border-primary' 
                          : 'text-muted'
                      }`}
                    >
                      <FaHome className="me-2" size={14} />
                      Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      eventKey="finances" 
                      className={`border-0 px-3 py-2 fw-medium ${
                        activeTab === 'finances' 
                          ? 'text-primary border-bottom border-2 border-primary' 
                          : 'text-muted'
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