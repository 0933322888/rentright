import { useState } from 'react';

export default function PropertyForm({ 
  initialData = {
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
  },
  onSubmit,
  loading = false,
  error = '',
  isEdit = false
}) {
  const [formData, setFormData] = useState(initialData);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              <option value="">Select property type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price (per month)
            </label>
            <div className="mt-1 relative rounded-md shadow-md">
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
                className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900">Location Information</h2>
        
        <div>
          <label htmlFor="location.street" className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            type="text"
            id="location.street"
            name="location.street"
            value={formData.location.street}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
            placeholder="Enter street address"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
        </div>

        <div>
          <label htmlFor="location.zipCode" className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="text"
            id="location.zipCode"
            name="location.zipCode"
            value={formData.location.zipCode}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
            placeholder="Enter ZIP code"
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900">Features</h2>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="features.bedrooms" className="block text-sm font-medium text-gray-700">
              Number of Bedrooms
            </label>
            <input
              type="number"
              id="features.bedrooms"
              name="features.bedrooms"
              min="0"
              value={formData.features.bedrooms}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
              placeholder="Enter number of bedrooms"
            />
          </div>

          <div>
            <label htmlFor="features.bathrooms" className="block text-sm font-medium text-gray-700">
              Number of Bathrooms
            </label>
            <input
              type="number"
              id="features.bathrooms"
              name="features.bathrooms"
              min="0"
              step="0.5"
              value={formData.features.bathrooms}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
              placeholder="Enter number of bathrooms"
            />
          </div>
        </div>

        <div>
          <label htmlFor="features.squareFootage" className="block text-sm font-medium text-gray-700">
            Square Footage
          </label>
          <input
            type="number"
            id="features.squareFootage"
            name="features.squareFootage"
            min="0"
            value={formData.features.squareFootage}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-md focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 hover:border-gray-400 bg-white py-3 px-4"
            placeholder="Enter square footage"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="features.furnished"
              name="features.furnished"
              checked={formData.features.furnished}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="features.furnished" className="ml-2 block text-sm text-gray-900">
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="features.parking" className="ml-2 block text-sm text-gray-900">
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
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="features.petsAllowed" className="ml-2 block text-sm text-gray-900">
              Pets Allowed
            </label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-900">Images</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Images
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="images"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload files</span>
                  <input
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                {typeof image === 'string' ? (
                  <img
                    src={image.startsWith('http') ? image : `http://localhost:5000/uploads/${image}`}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
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
              {isEdit ? 'Updating Property...' : 'Creating Property...'}
            </>
          ) : (
            isEdit ? 'Update Property' : 'Create Property'
          )}
        </button>
      </div>
    </form>
  );
} 