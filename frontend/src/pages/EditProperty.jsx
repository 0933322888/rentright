import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import PropertyForm from '../components/PropertyForm';

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [propertyData, setPropertyData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProperty();
    }
  }, [id, user]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Check if the property belongs to the current user
      const propertyLandlordId = response.data.landlord._id || response.data.landlord;
      if (propertyLandlordId !== user._id) {
        setError('You are not authorized to edit this property');
        setFetching(false);
        return;
      }
      
      // Transform the data to match our form structure
      const data = {
        title: response.data.title || '',
        description: response.data.description || '',
        type: response.data.type || '',
        price: response.data.price || '',
        location: {
          street: response.data.location?.street || '',
          city: response.data.location?.city || '',
          state: response.data.location?.state || '',
          zipCode: response.data.location?.zipCode || ''
        },
        features: {
          bedrooms: response.data.features?.bedrooms || '',
          bathrooms: response.data.features?.bathrooms || '',
          squareFootage: response.data.features?.squareFootage || '',
          furnished: response.data.features?.furnished || false,
          parking: response.data.features?.parking || false,
          petsAllowed: response.data.features?.petsAllowed || false
        },
        images: response.data.images || []
      };
      
      setPropertyData(data);
    } catch (error) {
      setError('Error fetching property details');
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);

    // Debug: Log user information
    console.log('Current user:', user);
    console.log('Property ID:', id);

    // Prepare JSON data
    const submitData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      price: formData.price,
      status: 'New',
      location: formData.location,
      features: formData.features,
      // Keep existing images (don't send new images in JSON update)
      images: formData.images.filter(image => typeof image === 'string')
    };

    console.log('Submitting data:', submitData);

    try {
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      await axios.patch(`${API_ENDPOINTS.PROPERTIES}/${id}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      navigate('/my-properties');
    } catch (error) {
      console.error('Error updating property:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Error updating property');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'landlord') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-4 text-gray-600">Only landlords can edit properties.</p>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
              <button
                onClick={() => navigate('/my-properties')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
            <PropertyForm 
              initialData={propertyData}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
              isEdit={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 