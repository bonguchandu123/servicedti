import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, MapPin, DollarSign, Calendar, User, Phone, Clock, Navigation, AlertCircle, MessageCircle } from 'lucide-react';

// const ServicerActiveServices = () => {
//   const [activeServices, setActiveServices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [trackingActive, setTrackingActive] = useState({});
//   const [locationInterval, setLocationInterval] = useState({});

//   useEffect(() => {
//     fetchActiveServices();
//     return () => {
//       // Cleanup location intervals
//       Object.values(locationInterval).forEach(interval => clearInterval(interval));
//     };
//   }, []);

//   const fetchActiveServices = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:8000/api/servicer/services/active', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       const data = await response.json();
//       setActiveServices(data.active_services || []);
//       setLoading(false);
//     } catch (error) {
//       console.error('Error fetching active services:', error);
//       setLoading(false);
//     }
//   };

//   const startService = async (serviceId) => {
//     try {
//       setActionLoading(serviceId);
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:8000/api/servicer/services/${serviceId}/start`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );

//       if (response.ok) {
//         alert('Service started successfully!');
//         fetchActiveServices();
//       } else {
//         alert('Failed to start service');
//       }
//     } catch (error) {
//       console.error('Error starting service:', error);
//       alert('Failed to start service');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const startTracking = async (serviceId) => {
//     if (!navigator.geolocation) {
//       alert('Geolocation is not supported by your browser');
//       return;
//     }

//     try {
//       // Get initial location
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
          
//           const token = localStorage.getItem('token');
//           const formData = new FormData();
//           formData.append('latitude', latitude);
//           formData.append('longitude', longitude);

//           const response = await fetch(
//             `http://localhost:8000/api/servicer/services/${serviceId}/start-tracking`,
//             {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`
//               },
//               body: formData
//             }
//           );

//           if (response.ok) {
//             setTrackingActive(prev => ({ ...prev, [serviceId]: true }));
//             alert('Tracking started! Your location will be shared with the customer.');
            
//             // Start continuous location updates every 10 seconds
//             const interval = setInterval(() => {
//               updateLocation(serviceId);
//             }, 10000);
            
//             setLocationInterval(prev => ({ ...prev, [serviceId]: interval }));
//           } else {
//             alert('Failed to start tracking');
//           }
//         },
//         (error) => {
//           alert('Unable to get your location. Please enable location services.');
//           console.error('Geolocation error:', error);
//         }
//       );
//     } catch (error) {
//       console.error('Error starting tracking:', error);
//       alert('Failed to start tracking');
//     }
//   };

//   const updateLocation = (serviceId) => {
//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude, speed, heading } = position.coords;
        
//         const token = localStorage.getItem('token');
//         const formData = new FormData();
//         formData.append('latitude', latitude);
//         formData.append('longitude', longitude);
//         if (speed !== null) formData.append('speed', speed * 3.6); // Convert m/s to km/h
//         if (heading !== null) formData.append('heading', heading);

//         try {
//           await fetch(
//             `http://localhost:8000/api/servicer/services/${serviceId}/update-location`,
//             {
//               method: 'POST',
//               headers: {
//                 'Authorization': `Bearer ${token}`
//               },
//               body: formData
//             }
//           );
//         } catch (error) {
//           console.error('Error updating location:', error);
//         }
//       },
//       (error) => {
//         console.error('Error getting location:', error);
//       }
//     );
//   };

//   const markArrived = async (serviceId) => {
//     try {
//       setActionLoading(serviceId);
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:8000/api/servicer/services/${serviceId}/arrived`,
//         {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );

//       if (response.ok) {
//         // Stop location tracking
//         if (locationInterval[serviceId]) {
//           clearInterval(locationInterval[serviceId]);
//           setLocationInterval(prev => {
//             const newState = { ...prev };
//             delete newState[serviceId];
//             return newState;
//           });
//         }
//         setTrackingActive(prev => ({ ...prev, [serviceId]: false }));
        
//         alert('Marked as arrived!');
//         fetchActiveServices();
//       } else {
//         alert('Failed to mark as arrived');
//       }
//     } catch (error) {
//       console.error('Error marking arrived:', error);
//       alert('Failed to mark as arrived');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const completeService = async (serviceId) => {
//     if (!confirm('Are you sure you want to mark this service as completed?')) {
//       return;
//     }

//     try {
//       setActionLoading(serviceId);
//       const token = localStorage.getItem('token');
//       const response = await fetch(
//         `http://localhost:8000/api/servicer/services/${serviceId}/complete`,
//         {
//           method: 'PUT',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         }
//       );

//       if (response.ok) {
//         alert('Service completed successfully!');
//         fetchActiveServices();
//       } else {
//         alert('Failed to complete service');
//       }
//     } catch (error) {
//       console.error('Error completing service:', error);
//       alert('Failed to complete service');
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       accepted: { className: 'bg-blue-100 text-blue-700', text: 'Accepted' },
//       in_progress: { className: 'bg-green-100 text-green-700', text: 'In Progress' }
//     };

//     const badge = badges[status] || badges.accepted;
//     return (
//       <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
//         {badge.text}
//       </span>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Active Services</h1>
//           <p className="text-gray-600 mt-1">Manage your ongoing service bookings</p>
//         </div>

//         {/* Active Services Count */}
//         <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8 text-white">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold">{activeServices.length}</h2>
//               <p className="text-blue-100 mt-1">Active Service(s)</p>
//             </div>
//             <div className="bg-white bg-opacity-20 p-4 rounded-lg">
//               <Clock className="w-8 h-8" />
//             </div>
//           </div>
//         </div>

//         {/* Services List */}
//         {activeServices.length > 0 ? (
//           <div className="space-y-6">
//             {activeServices.map((service) => (
//               <div
//                 key={service._id}
//                 className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
//               >
//                 {/* Header */}
//                 <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
//                   <div>
//                     <div className="flex items-center gap-3 mb-2">
//                       <h3 className="font-bold text-xl text-gray-900">
//                         #{service.booking_number}
//                       </h3>
//                       {getStatusBadge(service.booking_status)}
//                     </div>
//                     <p className="text-gray-600">{service.service_type}</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-2xl font-bold text-green-600">₹{service.total_amount}</p>
//                     <p className="text-sm text-gray-500">
//                       Your Earning: ₹{service.servicer_amount || (service.total_amount * 0.85).toFixed(2)}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Customer Info */}
//                 <div className="bg-blue-50 rounded-lg p-4 mb-4">
//                   <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="flex items-center gap-3">
//                       <User className="w-5 h-5 text-blue-600" />
//                       <div>
//                         <p className="text-xs text-gray-500">Name</p>
//                         <p className="font-medium text-gray-900">{service.user_name}</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <Phone className="w-5 h-5 text-blue-600" />
//                       <div>
//                         <p className="text-xs text-gray-500">Phone</p>
//                         <a href={`tel:${service.user_phone}`} className="font-medium text-blue-600 hover:underline">
//                           {service.user_phone}
//                         </a>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Service Details */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div className="flex items-center gap-3">
//                     <Calendar className="w-5 h-5 text-gray-500" />
//                     <div>
//                       <p className="text-xs text-gray-500">Date & Time</p>
//                       <p className="font-medium text-gray-900">
//                         {service.booking_date} at {service.booking_time}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-3">
//                     <MapPin className="w-5 h-5 text-gray-500" />
//                     <div>
//                       <p className="text-xs text-gray-500">Location</p>
//                       <p className="font-medium text-gray-900 truncate">
//                         {service.service_location?.address || 'Not provided'}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Problem Description */}
//                 {service.problem_description && (
//                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
//                     <div className="flex items-start gap-2">
//                       <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
//                       <div>
//                         <h4 className="font-medium text-yellow-900 mb-1">Problem Details</h4>
//                         <p className="text-yellow-800 text-sm">{service.problem_description}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Tracking Status */}
//                 {trackingActive[service._id] && (
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
//                     <div className="flex items-center gap-2">
//                       <Navigation className="w-5 h-5 text-green-600 animate-pulse" />
//                       <p className="text-green-800 font-medium">
//                         Live tracking active - Customer can see your location
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Action Buttons */}
//                 <div className="flex flex-wrap gap-3">
//                   {service.booking_status === 'accepted' && (
//                     <>
//                       <button
//                         onClick={() => startTracking(service._id)}
//                         disabled={trackingActive[service._id] || actionLoading === service._id}
//                         className="flex-1 min-w-[200px] bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                       >
//                         <Navigation className="w-5 h-5" />
//                         {trackingActive[service._id] ? 'Tracking Active' : 'Start Tracking'}
//                       </button>

//                       <button
//                         onClick={() => markArrived(service._id)}
//                         disabled={actionLoading === service._id}
//                         className="flex-1 min-w-[200px] bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                       >
//                         <MapPin className="w-5 h-5" />
//                         Mark as Arrived
//                       </button>

//                       <button
//                         onClick={() => startService(service._id)}
//                         disabled={actionLoading === service._id}
//                         className="flex-1 min-w-[200px] bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                       >
//                         {actionLoading === service._id ? (
//                           <>
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                             Processing...
//                           </>
//                         ) : (
//                           <>
//                             <Play className="w-5 h-5" />
//                             Start Service
//                           </>
//                         )}
//                       </button>
//                     </>
//                   )}

//                   {service.booking_status === 'in_progress' && (
//                     <button
//                       onClick={() => completeService(service._id)}
//                       disabled={actionLoading === service._id}
//                       className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                     >
//                       {actionLoading === service._id ? (
//                         <>
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                           Processing...
//                         </>
//                       ) : (
//                         <>
//                           <CheckCircle className="w-5 h-5" />
//                           Complete Service
//                         </>
//                       )}
//                     </button>
//                   )}

//                   <a
//                     href={`/servicer/chat/${service._id}`}
//                     className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
//                   >
//                     <MessageCircle className="w-5 h-5" />
//                     Chat
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
//             <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Services</h3>
//             <p className="text-gray-600">
//               You don't have any active services at the moment. Check your pending requests!
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ServicerActiveServices;

import { LiveTrackingPage } from './LiveTrackingPage';

const ServicerActiveServices = () => {
  const [activeServices, setActiveServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [trackingServiceId, setTrackingServiceId] = useState(null);

  useEffect(() => {
    fetchActiveServices();
  }, []);

  const fetchActiveServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/servicer/services/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setActiveServices(data.active_services || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active services:', error);
      setLoading(false);
    }
  };

  const startTracking = async (serviceId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const token = localStorage.getItem('token');
          const formData = new FormData();
          formData.append('latitude', latitude);
          formData.append('longitude', longitude);

          const response = await fetch(
            `http://localhost:8000/api/servicer/services/${serviceId}/start-tracking`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            }
          );

          if (response.ok) {
            // Open full-screen tracking page
            setTrackingServiceId(serviceId);
          } else {
            alert('Failed to start tracking');
          }
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        }
      );
    } catch (error) {
      console.error('Error starting tracking:', error);
      alert('Failed to start tracking');
    }
  };

  const startService = async (serviceId) => {
    try {
      setActionLoading(serviceId);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/servicer/services/${serviceId}/start`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✓ Service started successfully!');
        fetchActiveServices();
      } else {
        alert('Failed to start service');
      }
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Failed to start service');
    } finally {
      setActionLoading(null);
    }
  };

  const completeService = async (serviceId) => {
    if (!confirm('Are you sure you want to mark this service as completed?')) {
      return;
    }

    try {
      setActionLoading(serviceId);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/servicer/services/${serviceId}/complete`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✓ Service completed successfully!');
        fetchActiveServices();
      } else {
        alert('Failed to complete service');
      }
    } catch (error) {
      console.error('Error completing service:', error);
      alert('Failed to complete service');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      accepted: { className: 'bg-blue-100 text-blue-700', text: 'Accepted' },
      in_progress: { className: 'bg-green-100 text-green-700', text: 'In Progress' }
    };
    const badge = badges[status] || badges.accepted;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show tracking page if active
  if (trackingServiceId) {
    return (
      <LiveTrackingPage 
        serviceId={trackingServiceId} 
        onClose={() => {
          setTrackingServiceId(null);
          fetchActiveServices();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Services</h1>
          <p className="text-gray-600 mt-1">Manage your ongoing service bookings</p>
        </div>

        {/* Active Count Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{activeServices.length}</h2>
              <p className="text-blue-100 mt-1">Active Service(s)</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Services List */}
        {activeServices.length > 0 ? (
          <div className="space-y-6">
            {activeServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl text-gray-900">
                        #{service.booking_number}
                      </h3>
                      {getStatusBadge(service.booking_status)}
                    </div>
                    <p className="text-gray-600">{service.service_type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">₹{service.total_amount}</p>
                    <p className="text-sm text-gray-500">
                      Your Earning: ₹{service.servicer_amount || (service.total_amount * 0.85).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{service.user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a href={`tel:${service.user_phone}`} className="font-medium text-blue-600 hover:underline">
                          {service.user_phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {service.booking_date} at {service.booking_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium text-gray-900 truncate">
                        {service.service_location?.address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problem Description */}
                {service.problem_description && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Problem Details</h4>
                        <p className="text-yellow-800 text-sm">{service.problem_description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {service.booking_status === 'accepted' && (
                    <>
                      <button
                        onClick={() => startTracking(service._id)}
                        disabled={actionLoading === service._id}
                        className="flex-1 min-w-[200px] bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-5 h-5" />
                        Start Live Tracking
                      </button>

                      <button
                        onClick={() => startService(service._id)}
                        disabled={actionLoading === service._id}
                        className="flex-1 min-w-[200px] bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {actionLoading === service._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            Start Service
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {service.booking_status === 'in_progress' && (
                    <button
                      onClick={() => completeService(service._id)}
                      disabled={actionLoading === service._id}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      {actionLoading === service._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Complete Service
                        </>
                      )}
                    </button>
                  )}

                  <a
                    href={`/servicer/chat/${service._id}`}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Services</h3>
            <p className="text-gray-600">
              You don't have any active services at the moment. Check your pending requests!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicerActiveServices;