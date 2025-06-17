import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

export default function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    title: '',
    status: 'all',
    landlord: '',
    address: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, properties]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.ADMIN_PROPERTIES, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProperties(response.data);
    } catch (err) {
      setError('Failed to fetch properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.title) {
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(property => 
        property.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.landlord) {
      filtered = filtered.filter(property => 
        property.landlord.name.toLowerCase().includes(filters.landlord.toLowerCase()) ||
        property.landlord.email.toLowerCase().includes(filters.landlord.toLowerCase())
      );
    }

    if (filters.address) {
      filtered = filtered.filter(property => {
        const fullAddress = `${property.location.street}, ${property.location.city}, ${property.location.state} ${property.location.zipCode}`;
        return fullAddress.toLowerCase().includes(filters.address.toLowerCase());
      });
    }

    setFilteredProperties(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApprove = async (propertyId) => {
    try {
      await axios.patch(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${propertyId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Property approved successfully');
      fetchProperties();
    } catch (err) {
      toast.error('Failed to approve property');
      console.error('Error approving property:', err);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${propertyId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (err) {
      toast.error('Failed to delete property');
      console.error('Error deleting property:', err);
    }
  };

  const handleUpdateCommissionStatus = async (propertyId, status) => {
    try {
      await axios.patch(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${propertyId}/commission`,
        { commissionStatus: status },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Commission status updated successfully');
      fetchProperties();
    } catch (err) {
      toast.error('Failed to update commission status');
      console.error('Error updating commission status:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all properties in the system.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={filters.title}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Filter by title"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="review">Review</option>
              <option value="active">Active</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          <div>
            <label htmlFor="landlord" className="block text-sm font-medium text-gray-700">
              Landlord
            </label>
            <input
              type="text"
              name="landlord"
              id="landlord"
              value={filters.landlord}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Filter by landlord name/email"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={filters.address}
              onChange={handleFilterChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Filter by address"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Address
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Landlord
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Tenant
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Lease Period
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Commission
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Price
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProperties.map((property) => (
                  <tr key={property._id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {property.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {property.location.street}, {property.location.city}, {property.location.state} {property.location.zipCode}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {property.type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        property.status === 'active' ? 'bg-green-100 text-green-800' :
                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {property.landlord.name} 
                      <br />
                      {property.landlord.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {property.tenant ? (
                        <>
                          <span className="font-bold">{property.tenant.name}</span>
                          <br />
                          {property.tenant.email}
                        </>
                      ) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {property.leaseStartDate ? (
                        <>
                          {new Date(property.leaseStartDate).toLocaleDateString()}
                          {property.leaseEndDate && (
                            <> - {new Date(property.leaseEndDate).toLocaleDateString()}</>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${property.commissionStatus === 'received' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            property.commissionStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                            'bg-gray-50 text-gray-700 ring-gray-600/20'}">
                          {property.commissionStatus === 'received' ? 'Received' :
                           property.commissionStatus === 'pending' ? 'Pending' :
                           'Not Applicable'}
                          <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateCommissionStatus(property._id, 'received')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                  >
                                    Mark as Received
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateCommissionStatus(property._id, 'pending')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                  >
                                    Mark as Pending
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUpdateCommissionStatus(property._id, 'not_applicable')}
                                    className={`${
                                      active ? 'bg-gray-100' : ''
                                    } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                                  >
                                    Mark as Not Applicable
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${property.price}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex flex-col space-y-2">
                        <Link
                          to={`/admin/properties/${property._id}`}
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          View
                        </Link>
                        {property.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(property._id)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(property._id)}
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 