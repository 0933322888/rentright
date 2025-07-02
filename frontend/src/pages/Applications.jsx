import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import { Card, Container, Row, Col, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { 
  FaHome, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBuilding, 
  FaCheckCircle, FaTimesCircle, FaEye, FaHourglassHalf, FaTrash,
  FaFileAlt, FaCalendar
} from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Applications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error.response?.data || error);
      setError('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      await axios.delete(
        `${API_ENDPOINTS.APPLICATIONS}/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      toast.success('Application deleted successfully');
      setApplications(applications.filter(app => app._id !== applicationId));
      setDeleteModalShow(false);
      setApplicationToDelete(null);
    } catch (error) {
      console.error('Error deleting application:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete application. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success" className="px-3 py-2 d-flex align-items-center"><FaCheckCircle className="me-1" />Approved</Badge>;
      case 'rejected':
        return <Badge bg="danger" className="px-3 py-2 d-flex align-items-center"><FaTimesCircle className="me-1" />Rejected</Badge>;
      case 'viewing':
        return <Badge bg="info" className="px-3 py-2 d-flex align-items-center"><FaEye className="me-1" />Viewing</Badge>;
      case 'pending':
        return <Badge bg="warning" className="px-3 py-2 d-flex align-items-center"><FaHourglassHalf className="me-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge bg="secondary" className="px-3 py-2 d-flex align-items-center"><FaTimesCircle className="me-1" />Cancelled</Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2 d-flex align-items-center">{status}</Badge>;
    }
  };

  const CalendarComponent = ({ viewingDate }) => {
    const today = new Date();
    const viewing = viewingDate ? new Date(viewingDate) : null;

    // Helper to get the first day of the calendar grid (start from Sunday)
    const getCalendarStart = (date) => {
      const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const dayOfWeek = firstOfMonth.getDay();
      const start = new Date(firstOfMonth);
      start.setDate(firstOfMonth.getDate() - dayOfWeek);
      return start;
    };

    // Helper to check if two dates are the same day
    const isSameDay = (d1, d2) =>
      d1 && d2 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    // Generate calendar days
    const reference = viewing || today;
    const start = getCalendarStart(reference);
    const days = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const formatDate = (date) =>
      date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const getDaysUntilViewing = () => {
      if (!viewing) return null;
      const diffTime = viewing - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <div className="text-center p-3 rounded" style={{ backgroundColor: '#f8f9fa', minWidth: '220px', border: '1px solid #dee2e6' }}>
        {viewing && (
          <>
            <div className="pt-0 mb-0">
              <div className="fw-bold text-info">Viewing</div>
              <div className="text-muted small">{formatDate(viewing)}</div>
            </div>
            {getDaysUntilViewing() !== null && (
              <div className="small mb-2">
                {getDaysUntilViewing() > 0 ? (
                  <span className="text-success">In {getDaysUntilViewing()} days</span>
                ) : getDaysUntilViewing() === 0 ? (
                  <span className="text-warning fw-bold">Today!</span>
                ) : (
                  <span className="text-muted">Past</span>
                )}
              </div>
            )}
          </>
        )}
        {/* Calendar grid */}
        <div>
          <div className="d-flex justify-content-between mb-1">
            {dayNames.map((name) => (
              <div key={name} style={{ width: 28, fontWeight: 600, color: '#888' }}>{name}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
            {days.map((d, idx) => {
              const isToday = isSameDay(d, today);
              const isViewing = isSameDay(d, viewing);
              const isOtherMonth = d.getMonth() !== reference.getMonth();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              let bg = 'transparent';
              let color = isOtherMonth ? '#bbb' : '#222';
              let fontWeight = 400;
              let border = 'none';
              if (isViewing) {
                bg = '#43c463';
                color = '#fff';
                fontWeight = 700;
              } else if (isToday) {
                bg = '#4f8cff';
                color = '#fff';
                fontWeight = 700;
                border = isViewing ? '2px solid #222' : 'none';
              } else if (isWeekend) {
                bg = '#ffeaea';
                color = '#d32f2f';
              }
              return (
                <div
                  key={d.toISOString()}
                  style={{
                    width: 28,
                    height: 28,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: bg,
                    color: color,
                    fontWeight: fontWeight,
                    border: border,
                    boxSizing: 'border-box',
                    fontSize: 14,
                  }}
                  title={d.toDateString()}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Helper to get status color for header
  const getStatusHeaderColor = (status) => {
    switch (status) {
      case 'approved':
        return 'linear-gradient(to right,rgb(20, 117, 0),rgb(178, 212, 172))'; // green
      case 'rejected':
        return 'linear-gradient(to right,rgb(255, 53, 53),rgb(255, 237, 237))'; // red
      case 'viewing':
        return 'linear-gradient(to right,rgb(0, 128, 255),rgb(193, 237, 255))'; // blue
      case 'pending':
        return 'linear-gradient(to right,rgb(255, 183, 0),rgb(255, 237, 193))'; // yellow
      default:
        return 'linear-gradient(to right,rgb(46, 46, 46),rgb(214, 214, 214))'; // gray
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="w-full d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-4">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  const filteredApplications = applications.filter(app => {
    if (!app || !app.property || !app.tenant || !app.tenant._id || !user || !user._id) return false;
    return app.tenant._id === user._id;
  });

  if (filteredApplications.length === 0) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm border-0 text-center" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(30,34,90,0.04)' }}>
              <Card.Body className="p-5">
                <FaFileAlt className="text-muted mb-3" size={48} />
                <h5 className="mb-3 fw-bold">No Applications Yet</h5>
                <p className="text-muted mb-4">Start your journey by applying for a property.</p>
                <Link to="/properties">
                  <Button variant="primary" className="px-4 py-2">
                    <FaHome className="me-2" />
                    Browse Properties
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <div className="py-4 px-2">
      <Row className="gx-0">
        {filteredApplications.map((application) => (
          <Col xs={12} key={application._id} className="mb-4 px-3">
            <Card className="shadow-sm border-0" style={{ borderRadius: 18, boxShadow: '0 2px 12px rgba(30,34,90,0.04)' }}>
              {/* Card Header */}
              <div
                className="d-flex justify-content-between align-items-center px-4 py-3"
                style={{
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  background: getStatusHeaderColor(application.status),
                }}
              >
                <Link
                  to={`/properties/${application.property._id}`}
                  className="fw-bold text-decoration-none"
                  style={{
                    color: '#fff',
                    fontSize: '1.25rem',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    letterSpacing: 0.2,
                  }}
                >
                  {application.property.title}
                </Link>
                {getStatusBadge(application.status)}
              </div>
              {/* Card Body */}
              <Card.Body className="p-4">
                <div className="d-flex flex-row justify-content-between align-items-center">
                  {/* Left: Details */}
                  <div className="d-flex flex-column justify-content-start flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="d-flex align-items-center mb-2" style={{ fontSize: '1rem', lineHeight: 1 }}>
                      <FaMapMarkerAlt className="me-2" style={{ fontSize: 20, verticalAlign: 'middle' }} />
                      <span className="text-muted" style={{ verticalAlign: 'middle' }}>
                        {application.property?.location?.street}, {application.property?.location?.city}, {application.property?.location?.state}
                      </span>
                    </div>
                    {application.viewingDate && (
                      <>
                        <div className="d-flex align-items-center mb-2" style={{ fontSize: '1rem' }}>
                          <FaCalendarAlt className={`me-2 ${application.status === 'viewing' ? 'text-primary' : 'text-muted'}`} style={{ fontSize: 20 }} />
                          <span className={application.status === 'viewing' ? 'text-primary fw-bold' : 'text-muted'}>
                            Viewing Date: {new Date(application.viewingDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="d-flex align-items-center mb-2" style={{ fontSize: '1rem' }}>
                          <FaClock className={`me-2 ${application.status === 'viewing' ? 'text-primary' : 'text-muted'}`} style={{ fontSize: 20 }} />
                          <span className={application.status === 'viewing' ? 'text-primary fw-bold' : 'text-muted'}>
                            Viewing Time: {application.viewingTime}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="d-flex align-items-center" style={{ fontSize: '1rem' }}>
                      <FaBuilding className="text-muted me-2" style={{ fontSize: 20 }} />
                      <span className="text-muted">
                        Applied: {new Date(application.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {/* Center: Calendar */}
                  {application.viewingDate && (
                    <div className="d-flex align-items-center justify-content-center mx-5" style={{ minWidth: 220 }}>
                      <CalendarComponent viewingDate={application.viewingDate} />
                    </div>
                  )}
                  {/* Right: Delete */}
                  <div className="d-flex flex-column align-items-end justify-content-start ms-3" style={{ minWidth: 120 }}>
                    <Link to={`/properties/${application.property._id}`} className="w-100 mb-2">
                      <Button variant="outline-primary" size="sm" className="w-100 d-flex align-items-center justify-content-center">
                        See Listing
                      </Button>
                    </Link>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setApplicationToDelete(application._id);
                        setDeleteModalShow(true);
                      }}
                      className="mb-2 d-flex align-items-center w-100 justify-content-center"
                    >
                      <FaTrash className="me-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal
        show={deleteModalShow}
        onHide={() => {
          setDeleteModalShow(false);
          setApplicationToDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Application</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this application? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalShow(false);
              setApplicationToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete(applicationToDelete)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}