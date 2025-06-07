import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaCheckCircle, FaCalendarAlt, FaEnvelope, FaPhone } from 'react-icons/fa';

const ApplicationConfirmation = ({ show, onHide, propertyTitle, viewingDate, viewingTime }) => {
  // Format the date safely
  const formattedDate = viewingDate ? new Date(viewingDate).toLocaleDateString() : '';

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="flex items-center gap-2">
          <FaCheckCircle className="text-green-500" />
          Application Submitted Successfully
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800 mb-2">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaCalendarAlt className="text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-green-800">Property Viewing Scheduled</h4>
                  <p className="text-green-700">
                    {formattedDate && viewingTime ? (
                      `Your viewing has been scheduled for ${formattedDate} at ${viewingTime}`
                    ) : (
                      'Your viewing details will be confirmed shortly'
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FaEnvelope className="text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-green-800">Email Confirmation</h4>
                  <p className="text-green-700">
                    You will receive an email confirmation with all the details of your viewing appointment.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaPhone className="text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-green-800">Landlord Contact</h4>
                  <p className="text-green-700">
                    The landlord will contact you within 24 hours to confirm the viewing and provide any additional information.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Important Reminders</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-700">
              <li>Please arrive 5-10 minutes before your scheduled viewing time</li>
              <li>Bring a valid photo ID for verification</li>
              <li>If you need to reschedule, please do so at least 24 hours in advance</li>
              <li>You can view your application status and viewing details in your dashboard</li>
            </ul>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          Go to Dashboard
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ApplicationConfirmation; 