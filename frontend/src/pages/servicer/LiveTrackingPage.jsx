import React, { useState, useEffect, useRef, use } from 'react';
import { CheckCircle, MapPin, User, Phone, Clock, Navigation, AlertCircle, X, Aperture } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// ============= SKELETON COMPONENTS =============
const SkeletonPulse = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

const HeaderSkeleton = () => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="w-14 h-14 rounded-lg bg-white/20" />
        <div>
          <SkeletonPulse className="h-8 w-48 mb-2 bg-white/30" />
          <SkeletonPulse className="h-4 w-32 bg-white/20" />
        </div>
      </div>
      <SkeletonPulse className="w-10 h-10 rounded-lg bg-white/20" />
    </div>
  </div>
);

const StatsBarSkeleton = () => (
  <div className="bg-white border-b border-gray-200 p-4">
    <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SkeletonPulse className="w-5 h-5 rounded" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
          <SkeletonPulse className="h-9 w-24 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

const MapSkeleton = () => (
  <div className="flex-1 relative bg-gray-200">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading map...</p>
      </div>
    </div>
    
    {/* Legend Skeleton */}
    <div className="absolute top-6 left-6 bg-white rounded-xl shadow-lg p-4 space-y-3 z-[1000]">
      <SkeletonPulse className="h-5 w-20 mb-2" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonPulse className="w-6 h-6 rounded-full" />
          <SkeletonPulse className="h-4 w-32" />
        </div>
      ))}
    </div>
  </div>
);

const BottomPanelSkeleton = () => (
  <div className="bg-white border-t border-gray-200 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Customer Details Skeleton */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-5 border border-gray-200">
        <SkeletonPulse className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonPulse className="w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <SkeletonPulse className="h-3 w-16 mb-2" />
                <SkeletonPulse className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex gap-4">
        <SkeletonPulse className="flex-1 h-16 rounded-xl" />
        <SkeletonPulse className="w-20 h-16 rounded-xl" />
      </div>

      {/* Warning Notice Skeleton */}
      <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <SkeletonPulse className="w-5 h-5 rounded mt-0.5" />
          <div className="flex-1">
            <SkeletonPulse className="h-5 w-40 mb-2" />
            <SkeletonPulse className="h-4 w-full mb-1" />
            <SkeletonPulse className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const FullPageSkeleton = () => (
  <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
    <HeaderSkeleton />
    <StatsBarSkeleton />
    <MapSkeleton />
    <BottomPanelSkeleton />
  </div>
);

// ============= LIVE TRACKING PAGE COMPONENT =============
export const LiveTrackingPage = ({ serviceId, onClose }) => {
  // State management
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs for map and tracking
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const userMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  const toast  = useToast();

  // Initialize on mount
  useEffect(() => {
    loadLeafletLibrary();
    fetchServiceDetails();
    startTracking();
    
    return () => {
      stopTracking();
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [serviceId]);

  // Load Leaflet CSS and JS library dynamically
  const loadLeafletLibrary = () => {
    // Load CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Load JavaScript
    if (!window.L && !document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.async = true;
      document.head.appendChild(script);
    }
  };

  // Fetch service details from API
  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/services/${serviceId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch service details')

      };
      
      const data = await response.json();
      setService(data);
      setLoading(false);
      
      // Initialize map after getting service location
      if (data.service_location?.latitude && data.service_location?.longitude) {
        setTimeout(() => {
          initializeMap(data.service_location.latitude, data.service_location.longitude);
        }, 500);
      }
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Failed to load service details');
     

      setLoading(false);
    }
  };

  // Initialize Leaflet Map
  const initializeMap = (customerLat, customerLng) => {
    if (!mapContainerRef.current || mapRef.current || !window.L) return;
    
    // Create map instance
    const map = window.L.map(mapContainerRef.current, {
      center: [customerLat, customerLng],
      zoom: 14,
      zoomControl: true
    });
    
    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Create customer marker (RED - Destination)
    const customerIcon = window.L.divIcon({
      className: 'custom-marker-customer',
      html: `
        <div style="position: relative; width: 50px; height: 70px;">
          <div style="
            background: #EF4444;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
            border: 4px solid white;
          ">
            <span style="font-size: 26px;">🏠</span>
          </div>
          <div style="
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: #EF4444;
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            white-space: nowrap;
            font-weight: bold;
            font-size: 11px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          ">Customer</div>
        </div>
      `,
      iconSize: [50, 70],
      iconAnchor: [25, 25]
    });
    
    customerMarkerRef.current = window.L.marker([customerLat, customerLng], {
      icon: customerIcon
    }).addTo(map);
    
    // Store map reference
    mapRef.current = map;
  };

  // Update map with current user location
  const updateUserLocationOnMap = (userLat, userLng) => {
    if (!mapRef.current || !window.L) return;
    
    const map = mapRef.current;
    
    // Create or update user marker (BLUE - Current Position)
    if (!userMarkerRef.current) {
      const userIcon = window.L.divIcon({
        className: 'custom-marker-user',
        html: `
          <div style="position: relative; width: 50px; height: 70px;">
            <div style="
              background: #3B82F6;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
              border: 4px solid white;
              animation: pulse 2s infinite;
            ">
              <span style="font-size: 22px;">📍</span>
            </div>
            <div style="
              position: absolute;
              top: 45px;
              left: 50%;
              transform: translateX(-50%);
              background: #3B82F6;
              color: white;
              padding: 4px 10px;
              border-radius: 6px;
              white-space: nowrap;
              font-weight: bold;
              font-size: 11px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">You</div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          </style>
        `,
        iconSize: [50, 70],
        iconAnchor: [20, 20]
      });
      
      userMarkerRef.current = window.L.marker([userLat, userLng], {
        icon: userIcon
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLat, userLng]);
    }
    
    // Create or update route line
    const customerLatLng = customerMarkerRef.current.getLatLng();
    
    if (!routeLineRef.current) {
      routeLineRef.current = window.L.polyline(
        [[userLat, userLng], [customerLatLng.lat, customerLatLng.lng]],
        {
          color: '#3B82F6',
          weight: 5,
          opacity: 0.8,
          dashArray: '15, 10',
          lineJoin: 'round'
        }
      ).addTo(map);
    } else {
      routeLineRef.current.setLatLngs([
        [userLat, userLng],
        [customerLatLng.lat, customerLatLng.lng]
      ]);
    }
    
    // Auto-fit map to show both markers with padding
    const bounds = window.L.latLngBounds([
      [userLat, userLng],
      [customerLatLng.lat, customerLatLng.lng]
    ]);
    map.fitBounds(bounds, { padding: [80, 80] });
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Calculate ETA based on distance (assuming average speed)
  const calculateETA = (distanceKm, currentSpeed = null) => {
    // Use current speed if available, otherwise assume 40 km/h average
    const speed = currentSpeed && currentSpeed > 5 ? currentSpeed : 40;
    return Math.round((distanceKm / speed) * 60); // Convert to minutes
  };
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    console.log('Starting location tracking...');
    toast.info('Starting location tracking...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        
        console.log('Location updated:', { latitude, longitude, speed, heading });
        
        setCurrentLocation({ latitude, longitude, speed, heading });
        updateUserLocationOnMap(latitude, longitude);
        await updateLocationOnServer(latitude, longitude, speed, heading);
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error(`Geolocation error: ${err.message}`);
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Update location on server
  const updateLocationOnServer = async (lat, lng, speed, heading) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      if (speed !== null) formData.append('speed', speed * 3.6); // m/s to km/h
      if (heading !== null) formData.append('heading', heading);

      console.log('Sending location update:', { lat, lng, speed, heading });

      const response = await fetch(
        `${API_BASE_URL}/servicer/services/${serviceId}/update-location`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Server response:', data);
        setDistance(data.distance_km);
        setEta(data.eta_minutes);
       
      } else {


        console.error('Server response not OK:', response.status);
        
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (err) {
      console.error('Error updating location:', err);
    
      setError('Failed to update location on server');
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  // Mark as arrived at customer location
  const handleMarkArrived = async () => {
    if (!confirm('Mark yourself as arrived at customer location?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/services/${serviceId}/arrived`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        toast.success('Marked as arrived! Tracking stopped.');
        alert('✓ Marked as arrived! Tracking stopped.');
        stopTracking();
        if (onClose) onClose();
      } else {
        toast.error('Failed to mark as arrived'); 
        alert('Failed to mark as arrived');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to mark as arrived');
      alert('Failed to mark as arrived');
    }
  };

  // Close tracking page
  const handleClose = () => {
    if (confirm('Stop tracking and go back?')) {
      stopTracking();
      if (onClose) onClose();
    }
  };

  // Loading screen
  if (loading) {
    return <FullPageSkeleton />;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* ========== HEADER ========== */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Navigation className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Tracking Active</h1>
              <p className="text-blue-100">Booking #{service?.booking_number}</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ========== STATS BAR ========== */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-gray-500 uppercase font-semibold">Distance</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {distance !== null ? `${distance.toFixed(1)} km` : (
                <span className="text-gray-400 text-2xl">Calculating...</span>
              )}
            </p>
          </div>
          
          <div className="text-center border-x border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <p className="text-xs text-gray-500 uppercase font-semibold">ETA</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {eta !== null ? `${eta} min` : (
                <span className="text-gray-400 text-2xl">Calculating...</span>
              )}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-purple-600" />
              <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {tracking ? 'ON THE WAY' : 'ARRIVED'}
            </p>
          </div>
        </div>
      </div>

      {/* ========== LEAFLET MAP ========== */}
      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ background: '#f9fafb', minHeight: '400px' }}
        />
        
        {/* Map Legend */}
        <div className="absolute top-6 left-6 bg-white rounded-xl shadow-lg p-4 space-y-3 z-[1000]">
          <h3 className="font-bold text-gray-900 mb-2">Legend</h3>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">📍</div>
            <span className="text-sm text-gray-700 font-medium">Your Location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs">🏠</div>
            <span className="text-sm text-gray-700 font-medium">Customer Location</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-1 bg-blue-500" style={{ borderTop: '4px dashed #3B82F6' }}></div>
            <span className="text-sm text-gray-700 font-medium">Route</span>
          </div>
        </div>

        {/* Current Speed Display */}
        {currentLocation?.speed && (
          <div className="absolute top-6 right-6 bg-blue-600 text-white rounded-xl shadow-lg p-5 z-[1000]">
            <p className="text-xs uppercase mb-2 text-blue-100">Current Speed</p>
            <p className="text-3xl font-bold">
              {(currentLocation.speed * 3.6).toFixed(0)} <span className="text-xl">km/h</span>
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white rounded-lg shadow-lg p-4 max-w-md z-[1000]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========== BOTTOM PANEL ========== */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Customer Details */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 mb-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Name</p>
                  <p className="font-semibold text-gray-900">{service?.user_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <a 
                    href={`tel:${service?.user_phone}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {service?.user_phone}
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Address</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {service?.service_location?.address || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleMarkArrived}
              disabled={!tracking}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              <CheckCircle className="w-6 h-6" />
              Mark as Arrived
            </button>
            
            <a
              href={`tel:${service?.user_phone}`}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg"
            >
              <Phone className="w-6 h-6" />
            </a>
          </div>

          {/* Warning Notice */}
          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900 mb-1">Keep This Page Open</p>
                <p className="text-sm text-yellow-800">
                  Your location is being shared with the customer in real-time. Don't close this page until you arrive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};