import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Container, Row, Col, Button, Badge, Modal } from 'react-bootstrap';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import { FaUser, FaHome, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBuilding, FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import ViewingScheduleModal from '../components/ViewingScheduleModal';
import 'bootstrap/dist/css/bootstrap.min.css';
import toast from 'react-hot-toast';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
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

      // Check if profile is complete
      const isProfileComplete = profileRes.data && 
        profileRes.data.proofOfIdentity?.length > 0 &&
        profileRes.data.proofOfIncome?.length > 0 &&
        profileRes.data.creditHistory?.length > 0 &&
        profileRes.data.rentalHistory?.length > 0 &&
        profileRes.data.hasBeenEvicted !== undefined &&
        profileRes.data.canPayMoreThanOneMonth !== undefined;

      if (!isProfileComplete) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setShowProfileModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const activeApplication = applications.find(app => 
    ['pending', 'approved'].includes(app.status)
  );

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

  return (
    <div className="w-full">
      <ProfileCompletionModal 
        show={showProfileModal} 
        onHide={() => setShowProfileModal(false)} 
      />
      
      <div className="bg-white">
        <div className="py-8">
          
          <Row className="mb-6">
            <Col md={4}>
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FaUser className="text-primary me-2" size={24} />
                    <Card.Title className="mb-0">Profile Overview</Card.Title>
                  </div>
                  <div className="mb-3">
                    <p className="mb-1"><strong>Email:</strong> {user.email}</p>
                    <p className="mb-1"><strong>Phone:</strong> {user.phone || 'Not set'}</p>
                    <p className="mb-1"><strong>Status:</strong> {tenantData?.status || 'Active'}</p>
                  </div>
                  <Link to="/profile">
                    <Button variant="outline-primary" className="w-100">Update Profile</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>

            <Col md={8}>
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FaHome className="text-primary me-2" size={24} />
                    <Card.Title className="mb-0">Active Applications</Card.Title>
                  </div>
                  {activeApplication ? (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">{activeApplication.property?.title}</h5>
                        {getStatusBadge(activeApplication.status)}
                      </div>
                      <p className="mb-1">
                        <FaMapMarkerAlt className="text-muted me-2" />
                        {activeApplication.property?.location?.street}, {activeApplication.property?.location?.city}
                      </p>
                      {activeApplication.viewingDate && (
                        <>
                          <p className="mb-1">
                            <FaCalendarAlt className="text-muted me-2" />
                            Viewing Date: {new Date(activeApplication.viewingDate).toLocaleDateString()}
                          </p>
                          <p className="mb-1">
                            <FaClock className="text-muted me-2" />
                            Viewing Time: {activeApplication.viewingTime}
                          </p>
                        </>
                      )}
                      <p className="mb-1">
                        <FaBuilding className="text-muted me-2" />
                        Submitted: {new Date(activeApplication.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-3">No active applications</p>
                      <Link to="/properties">
                        <Button variant="primary">Find Properties</Button>
                      </Link>
                    </div>
                  )}
                  <Link to="/applications">
                    <Button variant="outline-primary" className="w-100">View All Applications</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <FaCalendarAlt className="text-primary me-2" size={24} />
                    <Card.Title className="mb-0">Upcoming Viewings</Card.Title>
                  </div>
                  {applications.filter(app => (app.status === 'pending' || app.status === 'viewing') && app.viewingDate).length > 0 ? (
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
                          {applications
                            .filter(app => (app.status === 'pending' || app.status === 'viewing') && app.viewingDate)
                            .map(app => (
                              <tr key={app._id}>
                                <td>
                                  <Link to={`/properties/${app.property._id}`} className="text-decoration-none">
                                    {app.property.title}
                                  </Link>
                                </td>
                                <td>{new Date(app.viewingDate).toLocaleDateString()}</td>
                                <td>{app.viewingTime}</td>
                                <td>
                                  {getStatusBadge(app.status)}
                                </td>
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

      {/* Reschedule Modal */}
      <ViewingScheduleModal
        show={showRescheduleModal}
        onHide={() => setShowRescheduleModal(false)}
        onSubmit={async (viewingData) => {
          try {
            const token = localStorage.getItem('token');
            await axios.patch(
              `${API_ENDPOINTS.APPLICATIONS}/${selectedApplication._id}`,
              {
                viewingDate: new Date(viewingData.viewingDate).toISOString(),
                viewingTime: viewingData.viewingTime
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            setApplications(prev =>
              prev.map(app =>
                app._id === selectedApplication._id
                  ? { ...app, viewingDate: viewingData.viewingDate, viewingTime: viewingData.viewingTime }
                  : app
              )
            );
            setShowRescheduleModal(false);
            toast.success('Viewing rescheduled successfully!');
            try {
              await fetchDashboardData();
            } catch (err) {
              // Optionally show a warning toast here
            }
          } catch (err) {
            toast.error('Failed to reschedule viewing');
            setShowRescheduleModal(false);
          }
        }}
        propertyTitle={selectedApplication?.property?.title}
        propertyId={selectedApplication?.property?._id}
      />

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Application</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel your application for <b>{selectedApplication?.property?.title}</b>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            No, Keep Application
          </Button>
          <Button variant="danger" onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              await axios.delete(
                `${API_ENDPOINTS.APPLICATIONS}/${selectedApplication._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              toast.success('Application cancelled successfully!');
              setShowCancelModal(false);
              fetchDashboardData();
            } catch (err) {
              toast.error('Failed to cancel application');
            }
          }}>
            Yes, Cancel Application
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TenantDashboard; 