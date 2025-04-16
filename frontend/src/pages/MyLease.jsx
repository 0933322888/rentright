import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { Tab } from '@headlessui/react';
import MyTickets from './MyTickets';
import LeaseAgreement from '../components/lease/LeaseAgreement';
import Payments from '../components/lease/Payments';
import { toast } from 'react-hot-toast';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MyLease = () => {
  const { user } = useAuth();
  const [leaseDetails, setLeaseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaseDetails = async () => {
      if (!user) return;

      try {
        const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const approvedApplication = response.data.find(app => app.status === 'approved');
        
        if (approvedApplication) {
          setLeaseDetails(approvedApplication);
        } else {
          setError('No approved application found');
        }
      } catch (err) {
        console.error('Error fetching lease details:', err);
        setError('Failed to fetch lease details. Please try again later.');
        toast.error('Failed to fetch lease details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaseDetails();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!leaseDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-gray-600 text-lg mb-4">No active lease found</div>
        <p className="text-gray-500">You need to have an approved application to view lease details.</p>
      </div>
    );
  }

  const tabs = [
    { name: 'Lease Agreement', icon: '📄' },
    { name: 'Repair Tickets', icon: '🎫' },
    { name: 'Payments', icon: '💰' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Tab.Group>
        <Tab.List className="flex rounded-xl bg-white shadow-md p-1 space-x-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full py-3 px-4 text-sm font-medium leading-5 rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-indigo-300',
                  selected
                    ? 'bg-indigo-600 text-white shadow hover:bg-indigo-700'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6 bg-white rounded-xl shadow-md">
          <Tab.Panel className="focus:outline-none">
            <LeaseAgreement leaseDetails={leaseDetails} />
          </Tab.Panel>
          <Tab.Panel className="focus:outline-none">
            <MyTickets />
          </Tab.Panel>
          <Tab.Panel className="focus:outline-none">
            <Payments leaseDetails={leaseDetails} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default MyLease; 