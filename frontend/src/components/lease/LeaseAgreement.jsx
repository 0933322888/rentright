import React from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LeaseAgreement = ({ leaseDetails }) => {
  const navigate = useNavigate();

  const formatLocation = (location) => {
    if (!location) return '';
    const { street, city, state, zipCode } = location;
    return `${street}, ${city}, ${state} ${zipCode}`;
  };

  const handleTerminate = async () => {
    if (!window.confirm('Are you sure you want to terminate this lease? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.post(
        `${API_ENDPOINTS.APPLICATIONS}/${leaseDetails._id}/terminate`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Lease terminated successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error terminating lease:', err);
      toast.error('Failed to terminate lease');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lease Agreement</h2>
        <button
          onClick={handleTerminate}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Terminate Lease
        </button>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Property Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Property Name</p>
              <p className="font-medium">{leaseDetails.property.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{formatLocation(leaseDetails.property.location)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Rent</p>
              <p className="font-medium">${leaseDetails.property.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lease Start Date</p>
              <p className="font-medium">{new Date(leaseDetails.startDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
          <div className="prose max-w-none">
            <ul className="list-disc pl-5 space-y-2">
              <li>Monthly rent payment is due on the 1st of each month</li>
              <li>A late fee of $50 will be charged for payments received after the 5th of the month</li>
              <li>Tenant is responsible for utilities unless otherwise specified</li>
              <li>Security deposit is equal to one month's rent</li>
              <li>Tenant must provide 30 days notice before moving out</li>
              <li>No smoking allowed on the premises</li>
              <li>Pets are subject to landlord approval and may require additional deposit</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Important Documents</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Lease Agreement PDF</p>
                <p className="text-sm text-gray-600">Download the complete lease agreement</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Download
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Move-in Checklist</p>
                <p className="text-sm text-gray-600">Property condition report</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseAgreement; 