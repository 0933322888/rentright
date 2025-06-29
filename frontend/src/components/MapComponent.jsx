import React, { useEffect, useState, Component, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import { getImageUrl } from '../utils/imageUtils';

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom marker icons with different states
const createCustomIcon = (isSelected = false, price = 0) => {
  const baseSize = isSelected ? 35 : 30;
  const color = isSelected ? '#3B82F6' : '#10B981';
  
  return new L.DivIcon({
    html: `
      <div class="custom-marker ${isSelected ? 'selected' : ''}" style="
        background: ${color};
        color: white;
        border: 3px solid white;
        border-radius: 50%;
        width: ${baseSize}px;
        height: ${baseSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${isSelected ? '14px' : '12px'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        $${Math.floor(price / 1000)}k
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [baseSize, baseSize],
    iconAnchor: [baseSize / 2, baseSize / 2],
    popupAnchor: [0, -baseSize / 2]
  });
};

// Component to handle map view changes
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

MapController.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired
};

// Component to handle map events
function MapEventHandler({ onMapClick, onMapMove }) {
  const map = useMapEvents({
    click: (e) => {
      if (onMapClick) onMapClick(e);
    },
    moveend: (e) => {
      if (onMapMove) onMapMove(e);
    }
  });
  return null;
}

MapEventHandler.propTypes = {
  onMapClick: PropTypes.func,
  onMapMove: PropTypes.func
};

// Error boundary component for the map
function MapErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      console.error('Map Error:', error, errorInfo);
      setHasError(true);
    };

    // Add error event listener
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-2 text-red-600 font-medium">Error loading map</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return children;
}

MapErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

// Enhanced popup component
function PropertyPopup({ property, onClose }) {
  return (
    <div className="property-popup">
      <div className="relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Property image */}
        <div className="w-full h-32 mb-3 rounded-lg overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <img
              src={getImageUrl(property.images[0])}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Property details */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{property.title}</h3>
          <p className="text-xs text-gray-600">{property.location.street}, {property.location.city}</p>
          
          {/* Property features */}
          <div className="flex items-center space-x-3 text-xs text-gray-600">
            {property.features?.bedrooms && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                {property.features.bedrooms}
              </span>
            )}
            {property.features?.bathrooms && (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                {property.features.bathrooms}
              </span>
            )}
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-600">${property.price}/month</span>
            <Link 
              to={`/properties/${property._id}`}
              className="px-3 py-1 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

PropertyPopup.propTypes = {
  property: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

// Map markers component with enhanced functionality
function MapMarkers({ properties, onMarkerClick, selectedPropertyId }) {
  const [hoveredMarker, setHoveredMarker] = useState(null);
  
  if (!properties || !Array.isArray(properties)) return null;

  return properties.map(property => {
    if (!property?.location?.coordinates) return null;
    
    const [lng, lat] = property.location.coordinates;
    if (!lat || !lng) return null;

    const isSelected = selectedPropertyId === property._id;
    const isHovered = hoveredMarker === property._id;
    const icon = createCustomIcon(isSelected || isHovered, property.price);

    return (
      <Marker
        key={property._id}
        position={[lat, lng]}
        icon={icon}
        eventHandlers={{
          click: () => onMarkerClick(property),
          mouseover: () => setHoveredMarker(property._id),
          mouseout: () => setHoveredMarker(null)
        }}
      >
        <Popup
          className="custom-popup"
          closeButton={false}
          maxWidth={300}
          minWidth={250}
        >
          <PropertyPopup 
            property={property} 
            onClose={() => {
              // Close popup by clicking on map
              const map = document.querySelector('.leaflet-container');
              if (map) {
                map.click();
              }
            }}
          />
        </Popup>
      </Marker>
    );
  });
}

MapMarkers.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    location: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
      street: PropTypes.string,
      city: PropTypes.string
    }),
    images: PropTypes.array,
    features: PropTypes.object
  })).isRequired,
  onMarkerClick: PropTypes.func.isRequired,
  selectedPropertyId: PropTypes.string
};

// Map Controls Component
function MapControls({ onLocateMe, onFullscreen }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2 map-controls-container">
      {/* Locate me button */}
      <button
        onClick={onLocateMe}
        className="map-control-button bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        title="Find my location"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* Fullscreen button */}
      <button
        onClick={onFullscreen}
        className="map-control-button bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        title="Toggle fullscreen"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>
  );
}

MapControls.propTypes = {
  onLocateMe: PropTypes.func.isRequired,
  onFullscreen: PropTypes.func.isRequired
};

// Map Legend Component
function MapLegend({ propertyCount, selectedCount }) {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 p-4 max-w-xs map-legend">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
          <span className="text-xs text-gray-600">{propertyCount} total</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs text-gray-700">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs text-gray-700">Selected</span>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {selectedCount} property{selectedCount !== 1 ? 'ies' : 'y'} selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

MapLegend.propTypes = {
  propertyCount: PropTypes.number.isRequired,
  selectedCount: PropTypes.number.isRequired
};

// Property Count Badge
function PropertyCountBadge({ count, isFiltered }) {
  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 property-count-badge">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium text-gray-900">
          {count} propert{count === 1 ? 'y' : 'ies'}
        </span>
        {isFiltered && (
          <span className="text-xs text-gray-500">(filtered)</span>
        )}
      </div>
    </div>
  );
}

PropertyCountBadge.propTypes = {
  count: PropTypes.number.isRequired,
  isFiltered: PropTypes.bool.isRequired
};

// Map Search Component
function MapSearch({ onSearch, onClear }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    onSearch([lat, lon], result.display_name);
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    onClear();
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-80 map-search-container">
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
              }
            }}
            placeholder="Search for a location..."
            className="w-full h-12 px-5 pl-10 pr-10 text-base bg-white border border-gray-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 map-search-input"
          />
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              style={{
                border: 'none',
                padding: '10px',
                margin: '0',
                height: '90%',
                top: '2px',
                right: '2px',
                cursor: 'pointer'
              }}
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 map-search-results">
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none map-search-result-item"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name}
                    </div>
                    {result.address && (
                      <div className="text-xs text-gray-500 truncate">
                        {result.address.city || result.address.town || result.address.village || ''}
                        {result.address.state && `, ${result.address.state}`}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600">No results found</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

MapSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default function MapComponent({ properties, center, zoom, onMarkerClick, selectedPropertyId }) {
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your browser settings.');
        }
      );
    }
  };

  const handleFullscreen = () => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      if (!isFullscreen) {
        if (mapContainer.requestFullscreen) {
          mapContainer.requestFullscreen();
        } else if (mapContainer.webkitRequestFullscreen) {
          mapContainer.webkitRequestFullscreen();
        } else if (mapContainer.msRequestFullscreen) {
          mapContainer.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleSearch = (coordinates, locationName) => {
    if (mapRef.current) {
      mapRef.current.setView(coordinates, 15);
    }
  };

  const handleSearchClear = () => {
    // Reset to original center if needed
    if (mapRef.current && center) {
      mapRef.current.setView(center, zoom);
    }
  };

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 map-loading-state">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!center || !Array.isArray(center) || center.length !== 2) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 map-loading-state">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-2 text-red-600 font-medium">Invalid map center coordinates</p>
        </div>
      </div>
    );
  }

  const validProperties = properties.filter(p => p?.location?.coordinates);
  const selectedCount = selectedPropertyId ? 1 : 0;

  return (
    <MapErrorBoundary>
      <div className="relative h-full w-full enhanced-map-container map-fade-in">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={zoom}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          whenCreated={(map) => {
            map.invalidateSize();
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ZoomControl position="bottomright" />
          <MapController center={center} zoom={zoom} />
          <MapEventHandler 
            onMapClick={() => {
              // Clear selection when clicking on map
              if (onMarkerClick) onMarkerClick(null);
            }}
          />
          <MapMarkers 
            properties={properties} 
            onMarkerClick={onMarkerClick}
            selectedPropertyId={selectedPropertyId}
          />
        </MapContainer>
        
        <MapSearch 
          onSearch={handleSearch}
          onClear={handleSearchClear}
        />
        
        <MapControls 
          onLocateMe={handleLocateMe}
          onFullscreen={handleFullscreen}
        />
        
        <PropertyCountBadge 
          count={validProperties.length}
          isFiltered={false}
        />
        
        <MapLegend 
          propertyCount={validProperties.length}
          selectedCount={selectedCount}
        />
      </div>
    </MapErrorBoundary>
  );
}

MapComponent.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    location: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
      street: PropTypes.string,
      city: PropTypes.string
    }),
    images: PropTypes.array,
    features: PropTypes.object
  })).isRequired,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  onMarkerClick: PropTypes.func.isRequired,
  selectedPropertyId: PropTypes.string
}; 