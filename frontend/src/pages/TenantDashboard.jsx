import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { Card, Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const TenantDashboard = () => {
  const { user } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, applicationsRes] = await Promise.all([
          axios.get(API_ENDPOINTS.TENANT_PROFILE, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(API_ENDPOINTS.APPLICATIONS, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        setTenantData(profileRes.data);
        setApplications(applicationsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const activeApplication = applications.find(app => 
    ['pending', 'approved'].includes(app.status)
  );

  return (
    <Container className="py-4">
      <h1 className="mb-4">Welcome, {user.name}!</h1>
      
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Profile Overview</Card.Title>
              <Card.Text>
                <strong>Email:</strong> {user.email}<br />
                <strong>Phone:</strong> {user.phone || 'Not set'}<br />
                <strong>Status:</strong> {tenantData?.status || 'Active'}
              </Card.Text>
              <Link to="/profile">
                <Button variant="outline-primary">Update Profile</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Application Status</Card.Title>
              {activeApplication ? (
                <Card.Text>
                  <strong>Property:</strong> {activeApplication.property?.name}<br />
                  <strong>Status:</strong> {activeApplication.status}<br />
                  <strong>Submitted:</strong> {new Date(activeApplication.createdAt).toLocaleDateString()}
                </Card.Text>
              ) : (
                <Card.Text>No active applications</Card.Text>
              )}
              <Link to="/applications">
                <Button variant="outline-primary">View Applications</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Quick Actions</Card.Title>
              <div className="d-flex gap-2">
                <Link to="/properties">
                  <Button variant="primary">Browse Properties</Button>
                </Link>
                {activeApplication?.status === 'approved' && (
                  <Link to="/my-lease">
                    <Button variant="success">View Lease</Button>
                  </Link>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TenantDashboard; 