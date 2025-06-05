import React, { useEffect, useState, Component } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom marker icon
const customIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : null;

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
          <p className="text-red-600">Error loading map. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return children;
}

MapErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

// Map markers component
function MapMarkers({ properties, onMarkerClick }) {
  if (!properties || !Array.isArray(properties)) return null;

  return properties.map(property => {
    if (!property?.location?.coordinates) return null;
    
    const [lng, lat] = property.location.coordinates;
    if (!lat || !lng) return null;

    return (
      <Marker
        key={property._id}
        position={[lat, lng]}
        icon={customIcon}
        eventHandlers={{
          click: () => onMarkerClick(property)
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{property.title}</h3>
            <p className="text-sm text-gray-600">${property.price}/month</p>
            <Link 
              to={`/properties/${property._id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </Link>
          </div>
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
      coordinates: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  })).isRequired,
  onMarkerClick: PropTypes.func.isRequired
};

export default function MapComponent({ properties, center, zoom, onMarkerClick }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!center || !Array.isArray(center) || center.length !== 2) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600">Invalid map center coordinates</p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          // Ensure the map is properly initialized
          map.invalidateSize();
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapController center={center} zoom={zoom} />
        <MapMarkers properties={properties} onMarkerClick={onMarkerClick} />
      </MapContainer>
    </MapErrorBoundary>
  );
}

MapComponent.propTypes = {
  properties: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    location: PropTypes.shape({
      coordinates: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  })).isRequired,
  center: PropTypes.arrayOf(PropTypes.number).isRequired,
  zoom: PropTypes.number.isRequired,
  onMarkerClick: PropTypes.func.isRequired
}; 