import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export function useProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      console.log('Fetching properties for user:', user._id);
      const response = await axios.get(API_ENDPOINTS.PROPERTIES, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          landlord: user._id
        }
      });
      console.log('Fetched properties:', response.data);
      setProperties(response.data);
    } catch (error) {
      setError('Error fetching properties');
      console.error('Error:', error);
      toast.error('Failed to fetch properties');
    } finally {
      setIsLoading(false);
    }
  };

  const submitProperty = async (propertyId) => {
    try {
      const property = properties.find(p => p._id === propertyId);
      if (!property) return;

      const submitData = new FormData();
      submitData.append('title', property.title);
      submitData.append('description', property.description);
      submitData.append('type', property.type);
      submitData.append('price', property.price);
      submitData.append('status', 'submitted');

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
        submitData.append('existingImages', JSON.stringify(property.images));
      }

      await axios.put(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, submitData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await fetchProperties();
      toast.success('Property submitted successfully');
    } catch (error) {
      console.error('Error submitting property:', error);
      toast.error('Failed to submit property');
    }
  };

  const deleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.PROPERTIES}/${propertyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setProperties(properties.filter(property => property._id !== propertyId));
        toast.success('Property deleted successfully');
      } catch (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property');
      }
    }
  };

  return {
    properties,
    isLoading,
    error,
    fetchProperties,
    submitProperty,
    deleteProperty
  };
} 