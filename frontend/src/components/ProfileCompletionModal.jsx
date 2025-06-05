import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

const ProfileCompletionModal = ({ show, onHide }) => {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onHide();
    navigate('/profile');
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-b-0 pb-0">
        <Modal.Title className="text-xl font-semibold text-gray-900">
          Complete Your Profile to Apply for Properties
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Why Complete Your Profile?</h3>
            <p className="text-blue-700">
              Completing your profile once will allow you to apply to any property on our platform. 
              This helps streamline the application process and makes it easier for landlords to review your application.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">What You'll Need to Provide:</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Proof of Identity (e.g., driver's license, passport)
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Proof of Income (e.g., pay stubs, bank statements)
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Credit History Report
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Rental History
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Answer a few quick questions about your rental history
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">Note:</span> Your information is securely stored and will only be shared with landlords when you apply for their properties.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="border-t-0 pt-0">
        <Button variant="outline-secondary" onClick={onHide} className="px-4">
          I'll Do This Later
        </Button>
        <Button variant="primary" onClick={handleGoToProfile} className="px-4">
          Complete My Profile Now
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileCompletionModal; 