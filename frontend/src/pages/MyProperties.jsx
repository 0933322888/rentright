import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function MyProperties() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (user.role !== 'landlord') {
        navigate('/');
        return;
      }
      fetchProperties();
    }
  }, [user, loading, navigate]);

  const fetchProperties = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PROPERTIES, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          landlord: user._id
        }
      });
      setProperties(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Error fetching properties');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (propertyId) => {
    try {
      const property = properties.find(p => p._id === propertyId);
      if (!property) return;

      const submitData = new FormData();
      submitData.append('title', property.title);
      submitData.append('description', property.description);
      submitData.append('type', property.type);
      submitData.append('price', property.price);
      submitData.append('status', 'Submitted');

      // Add location fields
      submitData.append('location[street]', property.location.street);
      submitData.append('location[city]', property.location.city);
      submitData.append('location[state]', property.location.state);
      submitData.append('location[zipCode]', property.location.zipCode);

      // Add features fields
      submitData.append('features[bedrooms]', property.features.bedrooms);
      submitData.append('features[bathrooms]', property.features.bathrooms);
      submitData.append('features[squareFootage]', property.features.squareFootage);
      submitData.append('features[furnished]', property.features.furnished);
      submitData.append('features[parking]', property.features.parking);
      submitData.append('features[petsAllowed]', property.features.petsAllowed);

      // Add existing images
      if (property.images && property.images.length > 0) {
        property.images.forEach(image => {
          submitData.append('existingImages', image);
        });
      }

      await axios.put(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, submitData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchProperties();
    } catch (error) {
      console.error('Error submitting property:', error);
    }
  };

  const handleDelete = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProperties(properties.filter(property => property._id !== propertyId));
      } catch (error) {
        console.error('Error deleting property:', error);
        alert('Failed to delete property. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Submitted':
        return 'bg-green-100 text-green-800';
      case 'Rented':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchProperties}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">My Properties</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all your properties and their current status.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              to="/add-property"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Property
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Property
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Tenant
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {properties.map((property) => (
                      <tr key={property._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-6 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                              <img
                                src={property.images && property.images.length > 0 
                                  ? property.images[0].startsWith('http') 
                                    ? property.images[0] 
                                    : `http://localhost:5000/uploads/${property.images[0]}`
                                  : 'https://via.placeholder.com/400x300'}
                                alt={property.title}
                                className="h-16 w-16 object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 text-base">{property.title}</div>
                              <div className="text-gray-500">{property.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-6 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-5 ${getStatusColor(property.status)}`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-6 text-sm text-gray-500">
                          ${property.price}/month
                        </td>
                        <td className="whitespace-nowrap px-3 py-6 text-sm text-gray-500">
                          {property.location.city}, {property.location.state}
                        </td>
                        <td className="whitespace-nowrap px-3 py-6 text-sm text-gray-500">
                          {property.tenant ? property.tenant.name : 'No tenant'}
                        </td>
                        <td className="relative whitespace-nowrap py-6 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-3">
                            <Link
                              to={`/properties/${property._id}/edit`}
                              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Link>
                            {property.status === 'New' && (
                              <button
                                onClick={() => handleSubmit(property._id)}
                                className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Submit
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(property._id)}
                              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
      </div>
    </div>
  );
} 