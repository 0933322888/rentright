import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaCheckCircle, FaClock, FaFileAlt, FaEnvelope } from 'react-icons/fa';

const PropertySubmissionModal = ({ show, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-b-0 pb-0">
        <Modal.Title className="text-xl font-semibold text-gray-900">
          Property Submitted Successfully!
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4">
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800 mb-2">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FaClock className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">Review Process</p>
                  <p className="text-green-700">
                    Your property will be reviewed within 24 hours. We'll verify all the information and documents you've provided.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FaFileAlt className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">Document Verification</p>
                  <p className="text-green-700">
                    Our team will verify your ownership documents and other submitted materials. Make sure all documents are clear and valid.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FaEnvelope className="text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-green-800">Email Notifications</p>
                  <p className="text-green-700">
                    You'll receive email updates about the status of your property listing. Keep an eye on your inbox!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Need Help?</h3>
            <p className="text-blue-700">
              If you have any questions about your property listing or the review process, 
              please don't hesitate to contact our support team.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-t-0">
        <Button 
          variant="primary" 
          onClick={onHide}
          className="px-6 py-2"
        >
          Got it!
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PropertySubmissionModal; 