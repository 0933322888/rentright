import React from 'react';

const LeaseAgreement = ({ leaseDetails }) => {
  const formatLocation = (location) => {
    if (!location) return '';
    const { street, city, state, zipCode } = location;
    return `${street}, ${city}, ${state} ${zipCode}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Lease Agreement</h2>
      
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