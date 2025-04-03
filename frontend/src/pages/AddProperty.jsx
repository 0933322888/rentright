import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import PropertyForm from '../components/PropertyForm';

export default function AddProperty() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Add new images
    formData.images.forEach(image => {
      if (image instanceof File) {
        submitData.append('images', image);
      }
    });

    try {
      const token = localStorage.getItem('token');
      await axios.post(API_ENDPOINTS.PROPERTIES, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/my-properties');
    } catch (error) {
      console.error('Error creating property:', error);
      setError(error.response?.data?.message || 'Error creating property');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'landlord') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-4 text-gray-600">Only landlords can add properties.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Property</h1>
            <PropertyForm 
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 