import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// Lazy load the map components
const MapComponent = lazy(() => import('../components/MapComponent'));

export default function PropertyList() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [appliedProperties, setAppliedProperties] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(13);
  const [isMapReady, setIsMapReady] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  useEffect(() => {
    if (user?.role === 'tenant') {
      fetchUserApplications();
    }
  }, [user]);

  useEffect(() => {
    // Filter properties based on selected location
    if (selectedLocation) {
      const filtered = properties.filter(property => {
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
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [selectedLocation, properties]);

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
  };

  const handleMarkerClick = (property) => {
    setSelectedLocation({
      lat: property.location.coordinates[1],
      lng: property.location.coordinates[0]
    });
  };

  // Effect to handle map initialization
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      setIsMapReady(true);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col w-full">
      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-200 w-full py-4">
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Property Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="studio">Studio</option>
            </select>
          </div>

          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">
              Min Price
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Min price"
            />
          </div>

          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
              Max Price
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Max price"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter location"
            />
          </div>
        </div>
      </div>

      {/* Map and Property List Container */}
      <div className="flex flex-row w-full h-full">
        {/* Map Section - even smaller */}
        <div className="flex-[2] h-full pr-2">
          {isMapReady ? (
            <Suspense fallback={
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
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
              />
            </Suspense>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
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
            <div className="text-center py-8 text-gray-500">
              No properties found in this area
            </div>
          ) : (
            <div className="space-y-6 px-0">
              {filteredProperties.map(property => (
                <Link
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-8">
                    <div className="flex gap-10">
                      {/* Property Image - wider */}
                      <div className="w-56 h-56 flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0]}
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
                            <div className="space-y-2">
                              <p className="text-lg font-semibold text-gray-900">${property.price}/month</p>
                              <p className="text-base text-gray-600 capitalize">{property.type}</p>
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 