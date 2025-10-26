import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Navigation, Phone, User, MapPin, Clock, AlertCircle, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

const LiveTracking = () => {
  const [trackingData, setTrackingData] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const servicerMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  // Get booking ID from URL
  const getBookingId = () => {
    const path = window.location.pathname;
    const match = path.match(/\/user\/bookings\/([^\/]+)\/track/);
    return match ? match[1] : null;
  };

  const bookingId = getBookingId();

  // Load Leaflet CSS dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      console.log('Leaflet loaded successfully');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }

    fetchTrackingData();
    fetchTrackingHistory();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (isTracking) {
        fetchTrackingData();
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      // Cleanup map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [bookingId, isTracking]);

  useEffect(() => {
    if (trackingData && trackingData.tracking_active && trackingData.servicer_location && trackingData.user_location) {
      // Wait for Leaflet to be loaded
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          initializeMap();
        }
      }, 100);

      return () => clearInterval(checkLeaflet);
    }
  }, [trackingData]);

  const fetchTrackingData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/live-tracking`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch tracking data');
      }

      const data = await response.json();
      setTrackingData(data);
      setIsTracking(data.tracking_active);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tracking data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTrackingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/tracking-history?limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrackingHistory(data.route || []);
      }
    } catch (err) {
      console.error('Error fetching tracking history:', err);
    }
  };

  const initializeMap = () => {
    if (!window.L || !trackingData || !mapRef.current) return;

    const { servicer_location, user_location } = trackingData;
    
    if (!servicer_location?.lat || !user_location?.lat) return;

    // Remove existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Center between servicer and user
    const centerLat = (servicer_location.lat + user_location.lat) / 2;
    const centerLng = (servicer_location.lng + user_location.lng) / 2;

    // Initialize map
    const map = window.L.map(mapRef.current).setView([centerLat, centerLng], 13);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Custom icon for servicer
    const servicerIcon = window.L.divIcon({
      html: `<div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Custom icon for user
    const userIcon = window.L.divIcon({
      html: `<div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Add servicer marker
    const servicerMarker = window.L.marker([servicer_location.lat, servicer_location.lng], { icon: servicerIcon })
      .addTo(map)
      .bindPopup(`<b>Service Provider</b><br>${trackingData.servicer_info?.name || 'On the way'}`);
    servicerMarkerRef.current = servicerMarker;

    // Add user marker
    const userMarker = window.L.marker([user_location.lat, user_location.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b><br>Destination');
    userMarkerRef.current = userMarker;

    // Draw route line
    const routeLine = window.L.polyline([
      [servicer_location.lat, servicer_location.lng],
      [user_location.lat, user_location.lng]
    ], {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map);
    routeLineRef.current = routeLine;

    // Add tracking history path if available
    if (trackingHistory.length > 1) {
      const historyPath = trackingHistory.map(point => [point.lat, point.lng]);
      window.L.polyline(historyPath, {
        color: '#60a5fa',
        weight: 3,
        opacity: 0.5,
        dashArray: '5, 5'
      }).addTo(map);
    }

    // Fit bounds to show both markers
    const bounds = window.L.latLngBounds([
      [servicer_location.lat, servicer_location.lng],
      [user_location.lat, user_location.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  const updateMapPosition = () => {
    if (!mapInstanceRef.current || !trackingData || !window.L) return;

    const { servicer_location, user_location } = trackingData;
    
    if (!servicer_location?.lat || !user_location?.lat) return;

    // Update servicer marker position
    if (servicerMarkerRef.current) {
      servicerMarkerRef.current.setLatLng([servicer_location.lat, servicer_location.lng]);
    }

    // Update route line
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        [servicer_location.lat, servicer_location.lng],
        [user_location.lat, user_location.lng]
      ]);
    }

    // Optionally recenter map
    const bounds = window.L.latLngBounds([
      [servicer_location.lat, servicer_location.lng],
      [user_location.lat, user_location.lng]
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
  };

  useEffect(() => {
    if (trackingData && mapInstanceRef.current) {
      updateMapPosition();
    }
  }, [trackingData]);

  const handleRefresh = () => {
    fetchTrackingData();
    fetchTrackingHistory();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-800 mb-2 text-center">Error</h3>
          <p className="text-red-600 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-3 bg-white border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium"
            >
              Go Back
            </button>
            <button
              onClick={handleRefresh}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData || !trackingData.tracking_active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tracking Not Active</h3>
          <p className="text-gray-700 mb-6">
            {trackingData?.message || 'Live tracking has not started yet. The service provider will start tracking when they begin their journey to your location.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Go Back
            </button>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-white border-2 border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-3 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Booking</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
              <p className="text-sm text-gray-600 mt-1">Track your service provider in real-time</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div 
                ref={mapRef} 
                style={{ height: '500px', width: '100%' }}
                className="rounded-2xl"
              />
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Distance</p>
                    <p className="text-3xl font-bold">
                      {trackingData.distance_km?.toFixed(1) || '0'} km
                    </p>
                  </div>
                  <MapPin className="w-10 h-10 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">ETA</p>
                    <p className="text-3xl font-bold">
                      {trackingData.eta_minutes || '0'} min
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-purple-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Servicer Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Service Provider</h2>
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {trackingData.servicer_info?.image ? (
                    <img
                      src={trackingData.servicer_info.image}
                      alt={trackingData.servicer_info.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {trackingData.servicer_info?.name || 'Service Provider'}
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500 mr-1">⭐</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {trackingData.servicer_info?.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  {trackingData.servicer_info?.phone && (
                    <a
                      href={`tel:${trackingData.servicer_info.phone}`}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700 mt-3 font-medium"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Provider
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={`rounded-2xl shadow-lg border p-6 ${
              trackingData.servicer_arrived
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
            }`}>
              <div className="flex items-center mb-3">
                {trackingData.servicer_arrived ? (
                  <CheckCircle className="w-7 h-7 text-green-600 mr-3" />
                ) : (
                  <Navigation className="w-7 h-7 text-blue-600 mr-3 animate-pulse" />
                )}
                <h3 className="font-bold text-gray-900 text-lg">
                  {trackingData.servicer_arrived ? 'Provider Arrived!' : 'On The Way'}
                </h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {trackingData.servicer_arrived
                  ? 'The service provider has arrived at your location and is ready to begin the service.'
                  : `Your service provider is currently ${trackingData.distance_km?.toFixed(1) || 0} km away and will arrive in approximately ${trackingData.eta_minutes || 0} minutes.`}
              </p>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Location Details</h2>
              
              {trackingData.servicer_location?.last_updated && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Last Update</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(trackingData.servicer_location.last_updated).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {trackingData.servicer_location?.speed && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Current Speed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {trackingData.servicer_location.speed?.toFixed(1)} km/h
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-bold flex items-center justify-center shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Location'}
            </button>

            <button
              onClick={() => window.location.href = `/user/bookings/${bookingId}/chat`}
              className="w-full px-4 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold flex items-center justify-center shadow-lg transition"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat with Provider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;