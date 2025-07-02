import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaHome,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaEye,
  FaComment,
  FaPlus
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_ENDPOINTS.TICKETS}/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicket(response.data);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      setError('Failed to load ticket details');
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
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

  const handleStatusUpdate = async () => {
    if (selectedStatus === 'declined' && (!comment || comment.trim().length === 0)) {
      toast.error('Comment is required when declining a ticket');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        API_ENDPOINTS.LANDLORD_TICKET_STATUS(ticketId),
        {
          status: selectedStatus,
          comment: comment.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTicket(response.data.ticket);
      setShowStatusModal(false);
      setSelectedStatus('');
      setComment('');
      toast.success(`Ticket ${selectedStatus} successfully`);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error(error.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setAddingComment(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_ENDPOINTS.TICKETS}/${ticketId}/comments`,
        { text: newComment.trim() },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTicket(response.data);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const canUpdateStatus = () => {
    return user?.role === 'landlord' && ticket?.status === 'new';
  };

  const canAddComment = () => {
    return user?.role === 'landlord' || user?.role === 'admin' || (user?.role === 'tenant' && ticket?.tenant?._id === user?._id);
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

  if (error || !ticket) {
    return (
      <div className="text-center mt-5">
        <h2>Error</h2>
        <p>{error || 'Ticket not found'}</p>
        <Button as={Link} to="/landlord-dashboard" variant="primary">
          <FaArrowLeft className="me-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Button 
              as={Link} 
              to="/landlord-dashboard" 
              variant="outline-secondary"
              className="mb-2"
            >
              <FaArrowLeft className="me-2" />
              Back to Dashboard
            </Button>
            <h2 className="mb-0">Ticket Details</h2>
          </div>
          {canUpdateStatus() && (
            <div className="d-flex gap-2">
              <Button 
                variant="warning" 
                onClick={() => {
                  setSelectedStatus('review');
                  setShowStatusModal(true);
                }}
              >
                <FaEye className="me-2" />
                Mark for Review
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  setSelectedStatus('declined');
                  setShowStatusModal(true);
                }}
              >
                <FaTimes className="me-2" />
                Decline Ticket
              </Button>
            </div>
          )}
        </div>

        <Row>
          <Col lg={8}>
            {/* Ticket Information */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaExclamationTriangle className="me-2 text-warning" />
                    Maintenance Request
                  </h5>
                  {getStatusBadge(ticket.status)}
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h6>Description</h6>
                  <p className="text-muted">{ticket.description}</p>
                </div>

                {ticket.images && ticket.images.length > 0 && (
                  <div className="mb-4">
                    <h6>Attached Images</h6>
                    <div className="d-flex gap-2 flex-wrap">
                      {ticket.images.map((image, index) => (
                        <img
                          key={index}
                          src={`${import.meta.env.VITE_API_URL}${image}`}
                          alt={`Ticket image ${index + 1}`}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: '1px solid #dee2e6'
                          }}
                          onClick={() => handleImageClick(`${import.meta.env.VITE_API_URL}${image}`)}
                          className="hover-opacity"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {ticket.comments && ticket.comments.length > 0 && (
                  <div className="mt-4">
                    <h6 className="d-flex align-items-center">
                      <FaComment className="me-2" />
                      Comments ({ticket.comments.length})
                    </h6>
                    <div className="space-y-3">
                      {ticket.comments.map((comment, index) => (
                        <div key={index} className="border rounded p-3 bg-light">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center">
                              <strong>{comment.user?.name || 'Unknown User'}</strong>
                              <Badge bg="secondary" className="ms-2">
                                {comment.user?.role || 'User'}
                              </Badge>
                            </div>
                            <small className="text-muted">
                              {new Date(comment.createdAt).toLocaleString()}
                            </small>
                          </div>
                          <p className="mb-0">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Comment Section */}
                {canAddComment() && (
                  <div className="mt-4">
                    <h6 className="d-flex align-items-center mb-3">
                      <FaPlus className="me-2" />
                      Add Comment
                    </h6>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add your comment here..."
                          disabled={addingComment}
                        />
                      </Form.Group>
                      <Button
                        variant="primary"
                        onClick={handleAddComment}
                        disabled={addingComment || !newComment.trim()}
                      >
                        {addingComment ? (
                          <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Adding...
                          </>
                        ) : (
                          <>
                            Add Comment
                          </>
                        )}
                      </Button>
                    </Form>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Ticket Details Sidebar */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <h6 className="mb-0">Ticket Information</h6>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <div>
                    <small className="text-muted d-block">Property</small>
                    <div className="d-flex align-items-center">
                      <FaHome className="me-2 text-primary" />
                      <span>{ticket.property?.title || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <small className="text-muted d-block">Tenant</small>
                    <div className="d-flex align-items-center">
                      <FaUser className="me-2 text-primary" />
                      <span>{ticket.tenant?.name || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <small className="text-muted d-block">Created</small>
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2 text-primary" />
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <small className="text-muted d-block">Priority</small>
                    <Badge bg={ticket.priority === 'urgent' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'info'}>
                      {ticket.priority}
                    </Badge>
                  </div>

                  {ticket.updatedAt && (
                    <div>
                      <small className="text-muted d-block">Last Updated</small>
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-primary" />
                        <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Status Update Modal */}
        <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedStatus === 'review' ? 'Mark for Review' : 'Decline Ticket'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedStatus === 'declined' && (
              <Alert variant="warning">
                <FaExclamationTriangle className="me-2" />
                A comment is required when declining a ticket.
              </Alert>
            )}
            
            <Form>
              {selectedStatus === 'declined' && (
                <Form.Group className="mb-3">
                  <Form.Label>Comment (Required)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Please provide a reason for declining this ticket..."
                  />
                </Form.Group>
              )}
              
              {selectedStatus === 'review' && (
                <p className="text-muted">
                  This ticket will be marked for review. You can add a comment if needed.
                </p>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={selectedStatus === 'review' ? 'warning' : 'danger'}
              onClick={handleStatusUpdate}
              disabled={updating || (selectedStatus === 'declined' && !comment.trim())}
            >
              {updating ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Updating...
                </>
              ) : (
                <>
                  {selectedStatus === 'review' ? (
                    <>
                      <FaEye className="me-2" />
                      Mark for Review
                    </>
                  ) : (
                    <>
                      <FaTimes className="me-2" />
                      Decline Ticket
                    </>
                  )}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Image Modal */}
        <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Ticket Image</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center">
            <img
              src={selectedImage}
              alt="Ticket attachment"
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default TicketDetails; 