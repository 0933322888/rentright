import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import { trackPropertyClick } from '../utils/statisticsUtils';
import { getImageUrl } from '../utils/imageUtils';

// Lazy load the map components
const MapComponent = lazy(() => import('../components/MapComponent'));

export default function PropertyList() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [appliedProperties, setAppliedProperties] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(13);
  const [isMapReady, setIsMapReady] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const searchTimeoutRef = useRef(null);

  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    furnished: '',
    search: '',
  });

  const [priceRange, setPriceRange] = useState([0, 5000]);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  useEffect(() => {
    if (user?.role === 'tenant') {
      fetchUserApplications();
    }
  }, [user]);

  useEffect(() => {
    // Filter properties based on selected location and search
    let filtered = properties;
    
    // Apply search filter (client-side)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchTerm) ||
        property.description.toLowerCase().includes(searchTerm) ||
        property.location.city.toLowerCase().includes(searchTerm) ||
        property.location.street.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(property => {
        const propertyLat = property.location?.coordinates?.[1];
        const propertyLng = property.location?.coordinates?.[0];
        if (!propertyLat || !propertyLng) return false;

        // Filter properties within approximately 5km of selected location
        const distance = calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          propertyLat,
          propertyLng
        );
        return distance <= 5;
      });
    }
    
    setFilteredProperties(filtered);
  }, [selectedLocation, properties, filters.search]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchUserApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_ENDPOINTS.APPLICATIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appliedPropertyIds = new Set(
        response.data.map(application => application.property._id)
      );
      setAppliedProperties(appliedPropertyIds);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) queryParams.append('bathrooms', filters.bathrooms);
      if (filters.furnished) queryParams.append('furnished', filters.furnished);

      const response = await axios.get(`${API_ENDPOINTS.AVAILABLE_PROPERTIES}?${queryParams}`);
      setProperties(response.data);
      
      // If we have properties, center the map on the first one
      if (response.data.length > 0 && response.data[0].location?.coordinates) {
        const [lng, lat] = response.data[0].location.coordinates;
        setMapCenter([lat, lng]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Set filtering state for immediate feedback
    setFiltering(true);
    
    // Debounce search input
    if (name === 'search') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        setFiltering(false);
      }, 300);
    } else {
      // For non-search filters, clear filtering state after a short delay
      setTimeout(() => {
        setFiltering(false);
      }, 100);
    }
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update price range for display
    if (name === 'minPrice') {
      setPriceRange([parseInt(value) || 0, priceRange[1]]);
    } else if (name === 'maxPrice') {
      setPriceRange([priceRange[0], parseInt(value) || 5000]);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      bedrooms: '',
      bathrooms: '',
      furnished: '',
      search: '',
    });
    setPriceRange([0, 5000]);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  const handleMarkerClick = (property) => {
    if (property) {
      setSelectedPropertyId(property._id);
      setSelectedLocation({
        lat: property.location.coordinates[1],
        lng: property.location.coordinates[0]
      });
      
      // Scroll to the property in the list
      const propertyElement = document.getElementById(`property-${property._id}`);
      if (propertyElement) {
        propertyElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    } else {
      setSelectedPropertyId(null);
    }
  };

  const handlePropertyCardClick = (propertyId) => {
    setSelectedPropertyId(propertyId);
    
    // Find the property and center map on it
    const property = properties.find(p => p._id === propertyId);
    if (property && property.location?.coordinates) {
      const [lng, lat] = property.location.coordinates;
      setMapCenter([lat, lng]);
      setMapZoom(16); // Zoom in closer when selecting from list
    }
  };

  // Effect to handle map initialization
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      setIsMapReady(true);
    }
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col w-full px-4 mt-2">
      {/* Filter Header */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        {/* Main Filters Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Bedrooms */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Bedrooms
            </label>
            <div className="flex flex-wrap gap-1">
              {['0', '1', '2', '3', '4+'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const currentValues = filters.bedrooms ? filters.bedrooms.split(',').filter(v => v.trim()) : [];
                    const newValues = currentValues.includes(value)
                      ? currentValues.filter(v => v !== value)
                      : [...currentValues, value];
                    setFilters(prev => ({
                      ...prev,
                      bedrooms: newValues.length > 0 ? newValues.join(',') : ''
                    }));
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 ${
                    filters.bedrooms && filters.bedrooms.split(',').includes(value)
                      ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Bathrooms
            </label>
            <div className="flex flex-wrap gap-1">
              {['0', '1', '2', '3', '4+'].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const currentValues = filters.bathrooms ? filters.bathrooms.split(',').filter(v => v.trim()) : [];
                    const newValues = currentValues.includes(value)
                      ? currentValues.filter(v => v !== value)
                      : [...currentValues, value];
                    setFilters(prev => ({
                      ...prev,
                      bathrooms: newValues.length > 0 ? newValues.join(',') : ''
                    }));
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 ${
                    filters.bathrooms && filters.bathrooms.split(',').includes(value)
                      ? 'bg-primary-500 text-white border-primary-500 hover:bg-primary-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price */}
          <div className="relative">
            <label htmlFor="maxPrice" className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Max Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">$</span>
              </div>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handlePriceRangeChange}
                className="block w-full pl-6 pr-3 py-2.5 text-sm text-gray-900 bg-white border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
                placeholder="5000"
                min="0"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="relative">
            <label htmlFor="type" className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Type
            </label>
            <div className="relative">
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="appearance-none block w-full px-3 py-2.5 pr-8 text-sm text-gray-900 bg-white border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
              >
                <option value="">Any</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <label htmlFor="search" className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="block w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-white border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300 placeholder-gray-500"
                placeholder="Search properties..."
              />
            </div>
          </div>

          {/* Show Filters Button */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              &nbsp;
            </label>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full inline-flex items-center justify-center px-3 py-2.5 border-2 border-gray-200 shadow-sm text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              {filtersOpen ? 'Hide' : 'More'}
              {filtersOpen ? (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Additional Filters Panel */}
      {filtersOpen && (
        <div className="px-6 py-6 bg-white border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Min Price */}
            <div className="relative">
              <label htmlFor="minPrice" className="block text-sm font-semibold text-gray-700 mb-3">
                Min Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handlePriceRangeChange}
                  className="block w-full pl-8 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Furnished */}
            <div className="relative">
              <label htmlFor="furnished" className="block text-sm font-semibold text-gray-700 mb-3">
                Furnished
              </label>
              <div className="relative">
                <select
                  id="furnished"
                  name="furnished"
                  value={filters.furnished}
                  onChange={handleFilterChange}
                  className="appearance-none block w-full px-4 py-3 pr-10 text-gray-900 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
                >
                  <option value="">Any furnishing</option>
                  <option value="true">Furnished</option>
                  <option value="false">Unfurnished</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="block w-full pl-12 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-300"
                  placeholder="City, State, or ZIP"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map and Property List Container */}
      <div className="flex flex-row w-full h-full">
        {/* Map Section - even smaller */}
        <div className="flex-[2] h-full pr-2">
          {isMapReady ? (
            <Suspense fallback={
              <div className="h-full w-full flex items-center justify-center bg-gray-100 map-loading">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading map...</p>
                </div>
              </div>
            }>
              <MapComponent
                properties={properties}
                center={mapCenter}
                zoom={mapZoom}
                onMarkerClick={handleMarkerClick}
                selectedPropertyId={selectedPropertyId}
              />
            </Suspense>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 map-loading">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Initializing map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Property List Section - even wider */}
        <div className="w-[850px] max-w-3xl h-full overflow-y-auto bg-gray-50 pl-2">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search ? 
                    `No properties match "${filters.search}"` :
                    getActiveFiltersCount() > 0 ?
                    'Try adjusting your filters or search terms' :
                    'No properties available in this area'
                  }
                </p>
                {(filters.search || getActiveFiltersCount() > 0) && (
                  <div className="mt-6">
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-0">
              {filteredProperties.map(property => (
                <div
                  key={property._id}
                  id={`property-${property._id}`}
                  className={`block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                    selectedPropertyId === property._id 
                      ? 'ring-2 ring-primary-500 shadow-lg transform scale-[1.02]' 
                      : ''
                  }`}
                  onClick={() => handlePropertyCardClick(property._id)}
                >
                  <Link
                    to={`/properties/${property._id}`}
                    className="block p-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackPropertyClick(property._id);
                    }}
                  >
                    <div className="flex gap-10">
                      {/* Property Image - wider */}
                      <div className="w-56 h-56 flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={getImageUrl(property.images[0])}
                            alt={property.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      {/* Property Details */}
                      <div className="flex-1 min-w-0 py-2">
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 truncate mb-2">{property.title}</h3>
                            <p className="text-base text-gray-600 mb-4">
                              {property.location.street}, {property.location.city}
                            </p>
                            
                            {/* Property Features */}
                            <div className="flex items-center space-x-6 mb-4">
                              {property.features?.bedrooms && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                  </svg>
                                  {property.features.bedrooms} bed{property.features.bedrooms !== 1 ? 's' : ''}
                                </div>
                              )}
                              {property.features?.bathrooms && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                  </svg>
                                  {property.features.bathrooms} bath{property.features.bathrooms !== 1 ? 's' : ''}
                                </div>
                              )}
                              {property.features?.squareFootage && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                  {property.features.squareFootage} sq ft
                                </div>
                              )}
                            </div>
                            
                            {/* Property Type and Features */}
                            <div className="flex items-center space-x-4 mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {property.type}
                              </span>
                              {property.features?.furnished && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Furnished
                                </span>
                              )}
                              {property.features?.parking && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Parking
                                </span>
                              )}
                              {property.features?.petsAllowed && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Pet Friendly
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-lg font-semibold text-gray-900">${property.price}/month</p>
                            </div>
                          </div>
                          {user?.role === 'tenant' && appliedProperties.has(property._id) && (
                            <div className="mt-4">
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                Applied
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 