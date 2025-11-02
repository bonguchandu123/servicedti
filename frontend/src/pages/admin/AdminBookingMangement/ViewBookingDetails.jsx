import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, MapPin, User, Briefcase, Calendar, Loader } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const ViewBookingDetails = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch booking details');

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock
      },
      accepted: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: CheckCircle
      },
      in_progress: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: AlertCircle
      },
      completed: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle
      },
      cancelled: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'text-amber-600',
      completed: 'text-emerald-600',
      failed: 'text-red-600',
      refunded: 'text-blue-600'
    };
    return colors[status] || 'text-slate-600';
  };

  // Helper function to get user name - handles both direct and nested structures
  const getUserName = (data) => {
    if (data.user_name) return data.user_name;
    if (data.user_details?.name) return data.user_details.name;
    return 'N/A';
  };

  // Helper function to get user ID
  const getUserId = (data) => {
    if (data.user_id) return data.user_id;
    if (data.user_details?._id) return data.user_details._id;
    return 'N/A';
  };

  // Helper function to get servicer name
  const getServicerName = (data) => {
    if (data.servicer_name) return data.servicer_name;
    if (data.servicer_details?.name) return data.servicer_details.name;
    return 'Not Assigned';
  };

  // Helper function to get servicer ID
  const getServicerId = (data) => {
    if (data.servicer_id) return data.servicer_id;
    if (data.servicer_details?._id) return data.servicer_details._id;
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/bookings')}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </button>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Booking</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/bookings')}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Bookings
          </button>
          <div className="bg-white rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Not Found</h3>
            <p className="text-slate-600">The requested booking could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.booking_status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/admin/bookings')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Bookings
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Details</h1>
              <p className="text-lg text-slate-600">#{booking.booking_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Created On</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(booking.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-2xl p-6 mb-6`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${statusConfig.bg} rounded-xl`}>
                <StatusIcon className={`w-8 h-8 ${statusConfig.text}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Current Status</p>
                <p className={`text-2xl font-bold ${statusConfig.text} capitalize`}>
                  {booking.booking_status.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600 mb-1">Service Type</p>
              <p className="text-xl font-semibold text-slate-900">{booking.service_type}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User Details */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-200 rounded-xl">
                <User className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">User Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-slate-900">{getUserName(booking)}</p>
              </div>
              {booking.user_details && (
                <>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-sm text-slate-700">{booking.user_details.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Phone</p>
                    <p className="text-sm text-slate-700">{booking.user_details.phone || 'N/A'}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-slate-600 mb-1">User ID</p>
                <p className="text-sm font-mono text-slate-700">{getUserId(booking)}</p>
              </div>
            </div>
          </div>

          {/* Servicer Details */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-200 rounded-xl">
                <Briefcase className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Servicer Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-slate-900">{getServicerName(booking)}</p>
              </div>
              {booking.servicer_details && booking.servicer_details.name !== 'N/A' && (
                <>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Email</p>
                    <p className="text-sm text-slate-700">{booking.servicer_details.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Phone</p>
                    <p className="text-sm text-slate-700">{booking.servicer_details.phone || 'N/A'}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-slate-600 mb-1">Servicer ID</p>
                <p className="text-sm font-mono text-slate-700">{getServicerId(booking)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Location */}
        {booking.service_location && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-200 rounded-xl">
                <MapPin className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Service Location</h3>
            </div>
            <p className="text-slate-800 text-lg">{booking.service_location.address || 'N/A'}</p>
            {booking.service_location.city && (
              <p className="text-slate-600 mt-2">{booking.service_location.city}, {booking.service_location.state} {booking.service_location.pincode}</p>
            )}
          </div>
        )}

        {/* Problem Description */}
        {booking.problem_description && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Problem Description</h3>
            <p className="text-slate-700 leading-relaxed text-lg">{booking.problem_description}</p>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-200 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Payment Details</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-green-200">
              <span className="text-slate-700 font-medium">Service Amount:</span>
              <span className="text-xl font-bold text-slate-900">₹{booking.total_amount?.toLocaleString('en-IN') || '0'}</span>
            </div>
            {booking.platform_fee && (
              <div className="flex justify-between items-center py-3 border-b border-green-200">
                <span className="text-slate-700 font-medium">Platform Fee:</span>
                <span className="text-lg font-semibold text-slate-900">₹{booking.platform_fee.toLocaleString('en-IN')}</span>
              </div>
            )}
            {booking.servicer_amount && (
              <div className="flex justify-between items-center py-3 border-b border-green-200">
                <span className="text-slate-700 font-medium">Servicer Amount:</span>
                <span className="text-lg font-semibold text-slate-900">₹{booking.servicer_amount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-700 font-medium">Payment Method:</span>
              <span className="font-semibold text-slate-900 capitalize">{booking.payment_method || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-700 font-medium">Payment Status:</span>
              <span className={`font-bold text-lg capitalize ${getPaymentStatusColor(booking.payment_status)}`}>
                {booking.payment_status || 'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl">
              <Clock className="w-6 h-6 text-slate-700" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Booking Timeline</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                {(booking.accepted_at || booking.started_at || booking.completed_at) && (
                  <div className="w-0.5 h-12 bg-slate-300 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">Booking Created</p>
                    <p className="text-sm text-slate-600 mt-1">Booking was initiated by the user</p>
                  </div>
                  <span className="text-sm text-slate-600 font-medium">
                    {new Date(booking.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {booking.accepted_at && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  {(booking.started_at || booking.completed_at) && (
                    <div className="w-0.5 h-12 bg-blue-300 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">Booking Accepted</p>
                      <p className="text-sm text-slate-600 mt-1">Servicer accepted the booking</p>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      {new Date(booking.accepted_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {booking.started_at && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  {booking.completed_at && (
                    <div className="w-0.5 h-12 bg-purple-300 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">Service Started</p>
                      <p className="text-sm text-slate-600 mt-1">Servicer began working on the service</p>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      {new Date(booking.started_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {booking.completed_at && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">Service Completed</p>
                      <p className="text-sm text-slate-600 mt-1">Service was successfully completed</p>
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      {new Date(booking.completed_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBookingDetails;