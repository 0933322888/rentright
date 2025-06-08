import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import ImageCarousel from '../../components/ImageCarousel';

export default function AdminPropertyDetails() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProperty(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

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
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    property.status === 'active' ? 'bg-green-100 text-green-800' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {property.status}
                  </span>
                </p>
                <p><span className="font-medium">Bedrooms:</span> {property.features?.bedrooms || 'N/A'}</p>
                <p><span className="font-medium">Bathrooms:</span> {property.features?.bathrooms || 'N/A'}</p>
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

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Owner Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Landlord:</span> {property.landlord.name}</p>
              <p><span className="font-medium">Email:</span> {property.landlord.email}</p>
              {property.landlord.phone && (
                <p><span className="font-medium">Phone:</span> {property.landlord.phone}</p>
              )}
            </div>
          </div>

          {property.tenant && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tenant Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {property.tenant.name}</p>
                <p><span className="font-medium">Email:</span> {property.tenant.email}</p>
                {property.tenant.phone && (
                  <p><span className="font-medium">Phone:</span> {property.tenant.phone}</p>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Property History</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Created:</span> {new Date(property.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(property.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 