import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

export default function EditProperty() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    price: '',
    location: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    features: {
      bedrooms: '',
      bathrooms: '',
      squareFootage: '',
      furnished: false,
      parking: false,
      petsAllowed: false
    },
    images: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
      const propertyData = {
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
      
      setFormData(propertyData);
    } catch (error) {
      setError('Error fetching property details');
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    // Add existing images
    formData.images.forEach(image => {
      if (typeof image === 'string') {
        submitData.append('existingImages', image);
      }
    });

    // Add new images
    formData.images.forEach(image => {
      if (image instanceof File) {
        submitData.append('images', image);
      }
    });

    try {
      const token = localStorage.getItem('token');
      await axios.put(API_ENDPOINTS.PROPERTY_BY_ID(id), submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/my-properties');
    } catch (error) {
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Property Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                    placeholder="Enter property title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4 resize-none"
                    placeholder="Describe your property in detail"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Property Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Monthly Price ($)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900">Location</h2>
                
                <div>
                  <label htmlFor="location.street" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="location.street"
                    name="location.street"
                    required
                    value={formData.location.street}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="location.city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="location.city"
                      name="location.city"
                      required
                      value={formData.location.city}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label htmlFor="location.state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      id="location.state"
                      name="location.state"
                      required
                      value={formData.location.state}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label htmlFor="location.zipCode" className="block text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="location.zipCode"
                      name="location.zipCode"
                      required
                      value={formData.location.zipCode}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900">Features</h2>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="features.bedrooms" className="block text-sm font-medium text-gray-700">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      id="features.bedrooms"
                      name="features.bedrooms"
                      required
                      min="0"
                      value={formData.features.bedrooms}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="Number of bedrooms"
                    />
                  </div>

                  <div>
                    <label htmlFor="features.bathrooms" className="block text-sm font-medium text-gray-700">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      id="features.bathrooms"
                      name="features.bathrooms"
                      required
                      min="0"
                      step="0.5"
                      value={formData.features.bathrooms}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                      placeholder="Number of bathrooms"
                    />
                  </div>

                  <div>
                    <label htmlFor="features.squareFootage" className="block text-sm font-medium text-gray-700">
                      Area (sq ft)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="features.squareFootage"
                        name="features.squareFootage"
                        required
                        min="0"
                        value={formData.features.squareFootage}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                        placeholder="Square footage"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">sq ft</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="features.furnished"
                      name="features.furnished"
                      checked={formData.features.furnished}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                    />
                    <label htmlFor="features.furnished" className="ml-2 block text-sm text-gray-700">
                      Furnished
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="features.parking"
                      name="features.parking"
                      checked={formData.features.parking}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                    />
                    <label htmlFor="features.parking" className="ml-2 block text-sm text-gray-700">
                      Parking Available
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="features.petsAllowed"
                      name="features.petsAllowed"
                      checked={formData.features.petsAllowed}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-colors duration-200"
                    />
                    <label htmlFor="features.petsAllowed" className="ml-2 block text-sm text-gray-700">
                      Pets Allowed
                    </label>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">Property Images</label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="images"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-1 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                      </div>
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group w-24 h-24">
                        <img
                          src={typeof image === 'string' 
                            ? image.startsWith('http') 
                              ? image 
                              : `http://localhost:5000/uploads/${image}`
                            : URL.createObjectURL(image)}
                          alt={`Property ${index + 1}`}
                          className="h-24 w-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                          className="absolute top-2 right-2 inline-flex items-center rounded-full bg-red-600 p-1 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-sm font-medium text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Property...
                    </>
                  ) : (
                    'Update Property'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 