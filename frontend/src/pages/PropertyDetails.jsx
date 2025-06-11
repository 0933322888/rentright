import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ImageCarousel from '../components/ImageCarousel';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import { FaBed, FaBath, FaHome, FaMapMarkerAlt, FaDollarSign, FaTimes, FaChevronLeft, FaChevronRight, FaCar, FaPaw, FaDumbbell, FaSwimmer, FaWifi, FaSnowflake, FaUtensils, FaTv, FaLock, FaCheckCircle } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ViewingScheduleModal from '../components/ViewingScheduleModal';
import ApplicationConfirmation from '../components/ApplicationConfirmation';

const PropertyDetails = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasApplied, setHasApplied] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(null);

  useEffect(() => {
    const fetchPropertyAndApplicationStatus = async () => {
      try {
        setLoading(true);
        // Fetch property details
        const propertyResponse = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${id}`);
        setProperty(propertyResponse.data);
        
        // If user is a tenant, check their application status and profile
        if (user && user.role === 'tenant') {
          const token = localStorage.getItem('token');
          const [applicationsResponse, profileResponse] = await Promise.all([
            axios.get(API_ENDPOINTS.APPLICATIONS, {
              headers: { 'Authorization': `Bearer ${token}` }
            }),
            axios.get(API_ENDPOINTS.GET_TENANT_PROFILE, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
          ]);
          
          // Check if user has already applied for this property
          const hasExistingApplication = applicationsResponse.data.some(
            application => application.property._id === id
          );
          setHasApplied(hasExistingApplication);

          // Store tenant profile data
          setTenantProfile(profileResponse.data);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyAndApplicationStatus();
  }, [id, user]);

  const isProfileComplete = () => {
    if (!tenantProfile) {
      console.log('Profile completion check: No tenant profile found');
      return false;
    }
    
    const requirements = {
      proofOfIdentity: tenantProfile.proofOfIdentity?.length > 0,
      proofOfIncome: tenantProfile.proofOfIncome?.length > 0,
      creditHistory: tenantProfile.creditHistory?.length > 0,
      rentalHistory: tenantProfile.rentalHistory?.length > 0,
      hasBeenEvicted: tenantProfile.hasBeenEvicted !== undefined,
      canPayMoreThanOneMonth: tenantProfile.canPayMoreThanOneMonth !== undefined
    };

    console.log('Profile completion requirements:', requirements);
    console.log('Current tenant profile:', tenantProfile);

    const isComplete = Object.values(requirements).every(Boolean);
    if (!isComplete) {
      const missingFields = Object.entries(requirements)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
      console.log('Missing required fields:', missingFields);
    }

    return isComplete;
  };

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

    // Check if profile is complete
    if (!isProfileComplete()) {
      setShowProfileModal(true);
      return;
    }

    // Show viewing modal to let user choose whether they want a viewing
    setShowViewingModal(true);
  };

  const handleViewingSubmit = async (viewingData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in again');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_ENDPOINTS.PROPERTY(id)}/apply`,
        { 
          wantsViewing: viewingData.wantsViewing,
          viewingDate: viewingData.wantsViewing ? viewingData.viewingDate : undefined,
          viewingTime: viewingData.wantsViewing ? viewingData.viewingTime : undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setHasApplied(true);
        setViewingDetails(viewingData.wantsViewing ? viewingData : null);
        setShowViewingModal(false);
        setShowConfirmation(true);
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

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    navigate('/dashboard');
  };

  if (loading) return (
    <div className="w-full flex flex-col md:flex-row gap-8 animate-pulse">
      {/* Skeleton for image section */}
      <div className="w-full md:w-[520px] h-[320px] md:h-[520px] rounded-lg bg-gray-200 mb-6 md:mb-0" />
      {/* Skeleton for right column */}
      <div className="flex-1 flex flex-col gap-8">
        {/* Skeleton for summary bar */}
        <div className="bg-gray-200 rounded-lg h-16 mb-2" />
        {/* Skeleton for cards */}
        <div className="flex-1 space-y-6">
          <div className="bg-gray-200 rounded-lg h-32" />
          <div className="bg-gray-200 rounded-lg h-32" />
          <div className="bg-gray-200 rounded-lg h-32" />
          <div className="bg-gray-200 rounded-lg h-20" />
        </div>
        {/* Skeleton for sidebar */}
        <div className="md:w-[340px] w-full bg-gray-200 rounded-lg h-32 self-start" />
      </div>
    </div>
  );
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!property) return <div className="text-center py-8">Property not found</div>;

  return (
    <div className="w-full relative">
      <ProfileCompletionModal 
        show={showProfileModal} 
        onHide={() => setShowProfileModal(false)} 
      />

      <ViewingScheduleModal
        show={showViewingModal}
        onHide={() => setShowViewingModal(false)}
        onSubmit={handleViewingSubmit}
        propertyTitle={property?.title}
        propertyId={property?._id}
      />

      <ApplicationConfirmation
        show={showConfirmation}
        onHide={handleConfirmationClose}
        propertyTitle={property?.title}
        viewingDate={viewingDetails?.viewingDate}
        viewingTime={viewingDetails?.viewingTime}
      />

      {/* Main Content: Two Columns (Images Left, Info Right) */}
      <div className="flex flex-col md:flex-row gap-8 w-full">
        {/* Left: Images Section and Apply Button */}
        <div className="w-full md:w-[800px] flex flex-col gap-6 mb-6 md:mb-0">
          <div className="h-[500px] md:h-[700px] rounded-lg overflow-hidden shadow-lg relative cursor-pointer group transition-transform duration-200 hover:scale-[1.02] hover:shadow-2xl" onClick={() => { setGalleryOpen(true); setGalleryIndex(0); }}>
            <ImageCarousel images={property.images} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-6 z-20 text-white pointer-events-none">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{property.title}</h1>
              <div className="flex items-center gap-4 mb-2">
                <span className="inline-flex items-center bg-blue-600/80 px-3 py-1 rounded-full text-lg font-semibold"><FaDollarSign className="mr-1" />{property.price}/month</span>
                <span className="inline-flex items-center bg-white/80 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"><FaHome className="mr-1" />{property.type}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center"><FaMapMarkerAlt className="mr-1" />{property.location.city}, {property.location.state}</span>
              </div>
              <span className="hidden md:block mt-2 text-xs text-white/80">Click to view gallery</span>
            </div>
          </div>
          {/* Apply Button/Action Card */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col gap-4 items-center transition-shadow duration-300 hover:shadow-2xl hover:scale-[1.01]">
            <div className="text-2xl font-bold text-blue-700 flex items-center gap-2"><FaDollarSign /> {property.price}/month</div>
            {user?.role === 'tenant' && (
              <button
                onClick={handleApply}
                disabled={hasApplied}
                className={`w-full py-2 px-4 rounded transition-colors text-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                  ${hasApplied 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.03]'}
                `}
              >
                {hasApplied ? 'Already Applied' : 'Apply Now'}
              </button>
            )}
            {user?.role === 'landlord' && (
              <Link
                to={`/properties/${id}/applications`}
                className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                View Applications
              </Link>
            )}
          </div>
        </div>
        {/* Right: Property Info and Actions */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Summary Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-white rounded-lg shadow p-4 mb-2">
            <span className="inline-flex items-center text-2xl font-bold text-blue-700"><FaDollarSign className="mr-1" /> {property.price}/month</span>
            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"><FaHome className="mr-1" />{property.type}</span>
            <span className="inline-flex items-center text-gray-700"><FaMapMarkerAlt className="mr-1" />{property.location.city}, {property.location.state}</span>
            {/* Status Badge */}
            {property.status && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ml-auto
                ${property.status === 'active' ? 'bg-green-100 text-green-800' : 
                  property.status === 'rented' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'}`}
              >
                {property.status}
              </span>
            )}
          </div>
          {/* Details, Location, Description, Amenities */}
          <div className="flex-1 space-y-6">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.01] hover:shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <div className="flex flex-wrap gap-6 text-lg">
                <div className="flex items-center gap-2"><FaBed /> {property.features.bedrooms} Bedrooms</div>
                <div className="flex items-center gap-2"><FaBath /> {property.features.bathrooms} Bathrooms</div>
                <div className="flex items-center gap-2"><FaHome /> {property.type}</div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.01] hover:shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="flex flex-col gap-1 text-gray-700 mb-4">
                <span><FaMapMarkerAlt className="inline mr-1" /> {property.location.street}</span>
                <span>{property.location.city}, {property.location.state} {property.location.zipCode}</span>
              </div>
              {/* Map Preview */}
              {property.location?.coordinates && property.location.coordinates.length === 2 && (
                <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 mt-2">
                  <MapContainer
                    center={[property.location.coordinates[1], property.location.coordinates[0]]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[property.location.coordinates[1], property.location.coordinates[0]]}
                      icon={L.icon({
                        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                    />
                  </MapContainer>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.01] hover:shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-600">{property.description}</p>
            </div>

            {/* Amenities Card */}
            <div className="bg-white rounded-lg shadow p-6 transition-transform duration-200 hover:scale-[1.01] hover:shadow-2xl">
              <h2 className="text-xl font-semibold mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {(property.amenities || []).map((amenity, index) => {
                  const iconMap = {
                    'Parking': <FaCar className="mr-1" />,
                    'Pet Friendly': <FaPaw className="mr-1" />,
                    'Gym': <FaDumbbell className="mr-1" />,
                    'Pool': <FaSwimmer className="mr-1" />,
                    'WiFi': <FaWifi className="mr-1" />,
                    'Air Conditioning': <FaSnowflake className="mr-1" />,
                    'Elevator': <FaCheckCircle className="mr-1" />,
                    'Restaurant': <FaUtensils className="mr-1" />,
                    'TV': <FaTv className="mr-1" />,
                    'Security': <FaLock className="mr-1" />,
                  };
                  const icon = iconMap[amenity] || <FaCheckCircle className="mr-1" />;
                  return (
                    <span
                      key={index}
                      className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
                    >
                      {icon}{amenity}
                    </span>
                  );
                })}
                {(!property.amenities || property.amenities.length === 0) && (
                  <span className="text-gray-500">No amenities listed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal (moved to top level, overlays everything) */}
      {galleryOpen && (
        <>
          <style>{`
            .leaflet-container,
            .leaflet-pane,
            .leaflet-top,
            .leaflet-bottom,
            .leaflet-control {
              z-index: 0 !important;
            }
          `}</style>
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-90 transition-all">
            <button className="absolute top-6 right-8 bg-black bg-opacity-70 rounded-full p-2 text-white text-3xl z-50 hover:text-blue-400 transition-colors" onClick={() => setGalleryOpen(false)}><FaTimes /></button>
            <button className="absolute left-6 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-2 text-white text-3xl z-50 hover:text-blue-400 transition-colors" onClick={() => setGalleryIndex((galleryIndex - 1 + property.images.length) % property.images.length)}><FaChevronLeft /></button>
            <img
              src={property.images[galleryIndex].startsWith('http') 
                ? property.images[galleryIndex] 
                : `http://localhost:10000/uploads/${property.images[galleryIndex]}`}
              alt={`Gallery image ${galleryIndex + 1}`}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-lg border-4 border-white"
            />
            <button className="absolute right-6 top-1/2 -translate-y-1/2 bg-black bg-opacity-70 rounded-full p-2 text-white text-3xl z-50 hover:text-blue-400 transition-colors" onClick={() => setGalleryIndex((galleryIndex + 1) % property.images.length)}><FaChevronRight /></button>
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full border-2 ${galleryIndex === idx ? 'bg-blue-400 border-white' : 'bg-white/50 border-white/50'}`}
                  onClick={() => setGalleryIndex(idx)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyDetails; 