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
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
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

    const submitData = new FormData();
    
    // Add basic fields
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('type', formData.type);
    submitData.append('price', formData.price);
    submitData.append('status', 'New');

    // Add location fields
    submitData.append('location[street]', formData.location.street);
    submitData.append('location[city]', formData.location.city);
    submitData.append('location[state]', formData.location.state);
    submitData.append('location[zipCode]', formData.location.zipCode);

    // Add features fields
    submitData.append('features[bedrooms]', formData.features.bedrooms);
    submitData.append('features[bathrooms]', formData.features.bathrooms);
    submitData.append('features[squareFootage]', formData.features.squareFootage);
    submitData.append('features[furnished]', formData.features.furnished);
    submitData.append('features[parking]', formData.features.parking);
    submitData.append('features[petsAllowed]', formData.features.petsAllowed);

    // Handle images
    const existingImages = [];
    const newImages = [];

    formData.images.forEach(image => {
      if (typeof image === 'string') {
        existingImages.push(image);
      } else if (image instanceof File) {
        newImages.push(image);
      }
    });

    // Add existing images as a single array
    if (existingImages.length > 0) {
      submitData.append('existingImages', JSON.stringify(existingImages));
    }

    // Add new images
    newImages.forEach(image => {
      submitData.append('images', image);
    });

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_ENDPOINTS.PROPERTIES}/${id}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/my-properties');
    } catch (error) {
      console.error('Error updating property:', error);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Property</h1>
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