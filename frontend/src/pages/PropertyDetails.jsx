import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [applicationData, setApplicationData] = useState({
    message: '',
    moveInDate: '',
  });

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/properties/${id}`);
      setProperty(response.data);
    } catch (error) {
      setError('Error fetching property details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/properties/${id}/apply`, applicationData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setError('');
      alert('Application submitted successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting application');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!property) return <div className="text-center py-12">Property not found</div>;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:max-w-none lg:py-32">
          {/* Property Images */}
          <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-gray-200">
            <img
              src={property.images[selectedImage] || 'https://via.placeholder.com/800x600'}
              alt={property.title}
              className="h-full w-full object-cover object-center"
            />
          </div>
          {property.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {property.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-h-1 aspect-w-1 overflow-hidden rounded-lg ${
                    selectedImage === index ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${property.title} - Image ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Property Details */}
          <div className="mt-8">
            <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-2xl font-semibold text-gray-900">${property.price}/month</p>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {property.type}
              </span>
            </div>
            <p className="mt-2 text-gray-600">{property.location}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">Description</h2>
            <p className="mt-4 text-gray-600">{property.description}</p>
          </div>

          {/* Features */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900">Features</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-2 text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          {user?.role === 'tenant' && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Apply for this Property</h2>
              <form onSubmit={handleApplicationSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700">
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    id="moveInDate"
                    value={applicationData.moveInDate}
                    onChange={(e) =>
                      setApplicationData({ ...applicationData, moveInDate: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message to Landlord
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={applicationData.message}
                    onChange={(e) =>
                      setApplicationData({ ...applicationData, message: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Tell the landlord about yourself and why you're interested in this property..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Submit Application
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 