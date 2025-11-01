import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, MapPin, DollarSign, Calendar, User, Phone, Clock, Navigation, AlertCircle, MessageCircle, Key, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';

import { LiveTrackingPage } from './LiveTrackingPage';

const ActiveServicesSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-9 w-56 bg-gray-200 rounded mb-2"></div>
          <div className="h-5 w-80 bg-gray-200 rounded"></div>
        </div>

        {/* Active Count Card Skeleton */}
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl shadow-lg p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-16 bg-gray-400 rounded mb-2"></div>
              <div className="h-5 w-32 bg-gray-400 rounded"></div>
            </div>
            <div className="bg-gray-400 bg-opacity-20 p-4 rounded-lg">
              <div className="w-8 h-8 bg-gray-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Services List Skeleton */}
        <div className="space-y-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-7 w-32 bg-gray-200 rounded"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-5 w-40 bg-gray-200 rounded"></div>
                </div>
                <div className="text-right">
                  <div className="h-8 w-24 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Customer Info Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-3 w-12 bg-gray-200 rounded mb-2"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                      <div className="h-5 w-full bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Problem Description Section */}
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 min-w-[200px] h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-12 w-28 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OTPModal = ({ service, onClose, onResend }) => {
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
  };

  useEffect(() => {
    if (service.completion_otp) {
      setOtp(service.completion_otp);
    }
  }, [service.completion_otp]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Completion OTP</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-3 text-center">Share this OTP with customer</p>
          <div className="bg-white rounded-lg p-4 text-center">
            <p className="text-4xl font-bold text-blue-600 tracking-widest">{otp}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={copyToClipboard}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy OTP
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            {resending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Resend to Notifications
              </>
            )}
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Customer needs this OTP to confirm completion</li>
                <li>Valid for 24 hours</li>
                <li>Don't share until work is done</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ServicerActiveServices = () => {
  const [activeServices, setActiveServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [trackingServiceId, setTrackingServiceId] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchActiveServices();
  }, []);

  // const fetchActiveServices = async () => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(`${API_BASE_URL}/servicer/services/active`, {
  //       headers: { 'Authorization': `Bearer ${token}` }
  //     });
  //     const data = await response.json();
  //     setActiveServices(data.active_services || []);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching active services:', error);
  //     setLoading(false);
  //   }
  // };

  const fetchActiveServices = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/servicer/services/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const servicesData = data.active_services || [];
    
    // ✅ Fetch transaction issues for each service
    const servicesWithIssues = await Promise.all(
      servicesData.map(async (service) => {
        try {
          const issueResponse = await fetch(
            `${API_BASE_URL}/servicer/bookings/${service._id}/transaction-issue`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (issueResponse.ok) {
            const issueData = await issueResponse.json();
            return { ...service, transaction_issue: issueData.issue };
          }
        } catch (err) {
          console.error('Error fetching transaction issue:', err);
        }
        return service;
      })
    );
    
    setActiveServices(servicesWithIssues);
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
            `${API_BASE_URL}/servicer/services/${serviceId}/start-tracking`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            }
          );

          if (response.ok) {
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
        `${API_BASE_URL}/servicer/services/${serviceId}/start`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert('✓ Service started successfully! OTP sent to your notifications.');
        
        // Update the service in the list with the OTP
        setActiveServices(prev => prev.map(service => 
          service._id === serviceId 
            ? { ...service, booking_status: 'in_progress', completion_otp: data.data?.completion_otp }
            : service
        ));
        
        fetchActiveServices();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to start service');
      }
    } catch (error) {
      console.error('Error starting service:', error);
      alert('Failed to start service');
    } finally {
      setActionLoading(null);
    }
  };

  const viewOTP = async (service) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/services/${service._id}/completion-otp`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedService({ ...service, completion_otp: data.otp });
        setShowOTPModal(true);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to fetch OTP');
      }
    } catch (error) {
      console.error('Error fetching OTP:', error);
      alert('Failed to fetch OTP');
    }
  };

  const resendOTP = async () => {
    if (!selectedService) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/services/${selectedService._id}/resend-otp`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert('✓ OTP sent to your notifications!');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      alert('Failed to resend OTP');
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
    return <ActiveServicesSkeletonLoader />;
  }

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
                    <>
                      <button
                        onClick={() => viewOTP(service)}
                        className="flex-1 min-w-[200px] bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Key className="w-5 h-5" />
                        View Completion OTP
                      </button>
                      
                      <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-green-800">
                            <p className="font-medium mb-1">Service In Progress</p>
                            <p>Share the completion OTP with customer when you finish the work. Customer will verify to mark service as completed.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <a
                    href={`/servicer/chat/${service._id}`}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat
                  </a>
                  {service.transaction_issue && (
  <a
    href={`/servicer/chat?issue_id=${service.transaction_issue._id}`}
    className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 relative"
  >
    <DollarSign className="w-5 h-5" />
    Payment Issue Chat
    {service.transaction_issue.unread_messages > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
        {service.transaction_issue.unread_messages}
      </span>
    )}
  </a>
)}
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

      {showOTPModal && selectedService && (
        <OTPModal
          service={selectedService}
          onClose={() => {
            setShowOTPModal(false);
            setSelectedService(null);
          }}
          onResend={resendOTP}
        />
      )}
    </div>
  );
};

export default ServicerActiveServices;