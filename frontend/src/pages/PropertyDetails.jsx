import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ImageCarousel from '../components/ImageCarousel';

const PropertyDetails = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${id}`);
        setProperty(response.data);
        
        // Check if the current user has already applied
        if (user && response.data.applications) {
          const userApplication = response.data.applications.find(
            app => app.tenant._id === user._id
          );
          setHasApplied(!!userApplication);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  const handleApply = async () => {
    if (hasApplied) {
      toast.error('You have already applied for this property');
      return;
    }

    if (!user) {
      toast.error('Please log in to apply for this property');
      navigate('/login');
      return;
    }

    if (user.role !== 'tenant') {
      toast.error('Only tenants can apply for properties');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        API_ENDPOINTS.APPLICATIONS,
        { propertyId: id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        toast.success('Application submitted successfully!');
        navigate('/applications');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit application. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!property) return <div className="text-center py-8">Property not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="mb-8">
          <ImageCarousel images={property.images} />
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {property.type}</p>
                <p><span className="font-medium">Price:</span> ${property.price}/month</p>
                <p><span className="font-medium">Bedrooms:</span> {property.features.bedrooms}</p>
                <p><span className="font-medium">Bathrooms:</span> {property.features.bathrooms}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Location</h2>
              <div className="space-y-2">
                <p>{property.location.street}</p>
                <p>{property.location.city}, {property.location.state} {property.location.zipCode}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{property.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {(property.amenities || []).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                </span>
              ))}
              {(!property.amenities || property.amenities.length === 0) && (
                <span className="text-gray-500">No amenities listed</span>
              )}
            </div>
          </div>

          {user?.role === 'tenant' && (
            <button
              onClick={handleApply}
              disabled={hasApplied}
              className={`w-full py-2 px-4 rounded transition-colors ${
                hasApplied 
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasApplied ? 'Already Applied' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails; 