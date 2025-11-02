import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, MapPin, DollarSign, Calendar, User, Phone, Clock, Navigation, AlertCircle, MessageCircle, Key, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';

import { LiveTrackingPage } from './LiveTrackingPage';

const ActiveServicesSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse">
          <div className="h-9 w-56 bg-gray-200 rounded mb-2"></div>
          <div className="h-5 w-80 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        <div className="space-y-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-4">
                  <div className="h-7 w-40 bg-gray-200 rounded"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
                <div className="lg:col-span-4 space-y-3">
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                </div>
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

        <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
          <p className="text-sm text-gray-600 mb-3 text-center">Share this OTP with customer</p>
          <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
            <p className="text-4xl font-bold text-slate-900 tracking-widest">{otp}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={copyToClipboard}
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 font-medium"
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
            className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
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

  const fetchActiveServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/services/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const servicesData = data.active_services || [];
      
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
      accepted: { className: 'bg-sky-50 text-sky-800', text: 'Accepted' },
      in_progress: { className: 'bg-emerald-50 text-emerald-800', text: 'In Progress' }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Active Services</h1>

          {/* Active Count Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeServices.length}</h2>
                <p className="text-gray-600 mt-1">Active Service(s)</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-slate-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeServices.length > 0 ? (
          <div className="space-y-6">
            {activeServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                  {/* Left Side - Main Details */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Service Title & Booking Number */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {service.service_type}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <p className="text-sm text-gray-600 font-medium">
                          Booking #{service.booking_number}
                        </p>
                        {getStatusBadge(service.booking_status)}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 font-medium mb-1">Customer</p>
                        <p className="font-bold text-gray-900">{service.user_name}</p>
                        {service.user_phone && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Phone className="w-4 h-4 mr-1" />
                            {service.user_phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date, Time & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {service.booking_date} at {service.booking_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Location</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {service.service_location?.address || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Problem Description */}
                    {service.problem_description && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-amber-700 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-900 mb-1">Problem Details</p>
                            <p className="text-sm text-amber-800">{service.problem_description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* In Progress Info */}
                    {service.booking_status === 'in_progress' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-emerald-700 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-emerald-900 mb-1">Service In Progress</p>
                            <p className="text-sm text-emerald-800">Share the completion OTP with customer when you finish the work.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Amount & Primary Actions */}
                  <div className="lg:col-span-4 space-y-3">
                    {/* Amount Card */}
                    <div className="bg-white border border-gray-300 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">₹{service.total_amount}</p>
                      <p className="text-xs text-gray-600">
                        Your Earning: ₹{service.servicer_amount || (service.total_amount * 0.85).toFixed(2)}
                      </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      {service.booking_status === 'accepted' && (
                        <>
                          <button
                            onClick={() => startTracking(service._id)}
                            disabled={actionLoading === service._id}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Start Live Tracking</span>
                          </button>

                          <button
                            onClick={() => startService(service._id)}
                            disabled={actionLoading === service._id}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition"
                          >
                            {actionLoading === service._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                <span>Start Service</span>
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {service.booking_status === 'in_progress' && (
                        <button
                          onClick={() => viewOTP(service)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition"
                        >
                          <Key className="w-4 h-4" />
                          <span>View Completion OTP</span>
                        </button>
                      )}

                      <button
                        onClick={() => window.location.href = `/servicer/chat/${service._id}`}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat</span>
                      </button>

                      {service.transaction_issue && (
                        <button
                          onClick={() => window.location.href = `/servicer/chat?issue_id=${service.transaction_issue._id}`}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition relative"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Payment Issue</span>
                          {service.transaction_issue.unread_messages > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {service.transaction_issue.unread_messages}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Services
            </h3>
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