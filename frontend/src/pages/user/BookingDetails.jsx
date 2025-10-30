import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Mail, User, DollarSign, CreditCard, Star, MessageSquare, Navigation, XCircle, CheckCircle, Aperture, Key, AlertCircle } from 'lucide-react';

const BookingDetails = () => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const bookingId = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch booking details');

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setRatingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('overall_rating', rating);
      formData.append('review_text', reviewText);
      formData.append('quality_rating', rating);
      formData.append('professionalism_rating', rating);
      formData.append('timeliness_rating', rating);

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/rate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) throw new Error('Failed to submit rating');

      alert('Rating submitted successfully!');
      setShowRatingModal(false);
      fetchBookingDetails();
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingLoading(false);
    }
  };

  const verifyOTPAndComplete = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('otp', otpValue);

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/verify-and-complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to verify OTP');
      }

      alert('✓ Service completed successfully!');
      setShowOTPModal(false);
      setOtpValue('');
      fetchBookingDetails();
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const requestOTPFromServicer = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/request-completion-otp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to request OTP');

      alert('✓ Request sent to servicer. They will share the OTP with you.');
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmCashPayment = async () => {
    if (!window.confirm('Confirm that you have paid cash to the servicer?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/confirm-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to confirm payment');

      alert('Payment confirmed successfully!');
      fetchBookingDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error || 'Booking not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Accepted' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
    };
    const s = config[status] || config.pending;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bookings
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{booking.service_type}</h1>
              <p className="text-gray-600 mt-1">Booking #{booking.booking_number}</p>
            </div>
            {getStatusBadge(booking.booking_status)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Servicer Details */}
            {booking.servicer_details && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h2>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {booking.servicer_details.image ? (
                      <img
                        src={booking.servicer_details.image}
                        alt={booking.servicer_details.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.servicer_details.name}
                    </h3>
                    <div className="flex items-center mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="font-semibold text-gray-900">
                        {booking.servicer_details.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 mt-2">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{booking.servicer_details.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-600 mt-1">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{booking.servicer_details.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OTP Verification Notice for In Progress Status */}
            {booking.booking_status === 'in_progress' && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 mb-2">Service In Progress</h3>
                    <p className="text-purple-800 text-sm mb-4">
                      When the servicer completes the work, they will share a 6-digit OTP with you. 
                      Enter that OTP to mark the service as completed and release payment.
                    </p>
                    <button
                      onClick={requestOTPFromServicer}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Request OTP from Servicer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-gray-900">{booking.booking_date}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-gray-900">{booking.booking_time}</p>
                  </div>
                </div>
                {booking.service_location?.address && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{booking.service_location.address}</p>
                    </div>
                  </div>
                )}
                {booking.problem_description && (
                  <div className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="font-medium text-gray-900">{booking.problem_description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking Info */}
            {booking.tracking && (
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Tracking</h2>
                <div className="space-y-3">
                  {booking.tracking.distance_remaining_km && (
                    <p className="text-gray-700">
                      <span className="font-medium">Distance:</span> {booking.tracking.distance_remaining_km} km away
                    </p>
                  )}
                  {booking.tracking.eta_minutes && (
                    <p className="text-gray-700">
                      <span className="font-medium">ETA:</span> {booking.tracking.eta_minutes} minutes
                    </p>
                  )}
                  <button
                    onClick={() => window.location.href = `/user/bookings/${booking._id}/track`}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    View Live Location
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {booking.messages_count > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Chat Messages</h2>
                  <span className="text-sm text-gray-600">{booking.messages_count} messages</span>
                </div>
                <button
                  onClick={() => window.location.href = `/user/bookings/${booking._id}/chat`}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Chat
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Service Amount</span>
                  <span>₹{booking.total_amount?.toFixed(2)}</span>
                </div>
                {booking.platform_fee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹{booking.platform_fee?.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-semibold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>₹{booking.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Payment Method</span>
                </div>
                <span className="text-sm font-medium text-gray-900 uppercase">
                  {booking.payment_method}
                </span>
              </div>

              <div className={`p-3 rounded-lg ${
                booking.payment_status === 'completed' ? 'bg-green-50' :
                booking.payment_status === 'failed' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <p className={`text-sm font-medium ${
                  booking.payment_status === 'completed' ? 'text-green-700' :
                  booking.payment_status === 'failed' ? 'text-red-700' :
                  'text-yellow-700'
                }`}>
                  {booking.payment_status === 'completed' ? '✓ Payment Completed' :
                   booking.payment_status === 'failed' ? '✗ Payment Failed' :
                   '⏳ Payment Pending'}
                </p>
              </div>

              {/* Confirm Cash Payment */}
              {booking.payment_method === 'cash' && 
               booking.payment_status === 'pending' && 
               booking.booking_status === 'completed' && (
                <button
                  onClick={confirmCashPayment}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Cash Payment
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {booking.booking_status === 'in_progress' && (
                  <button
                    onClick={() => setShowOTPModal(true)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center font-medium"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Enter Completion OTP
                  </button>
                )}

                {['accepted', 'in_progress'].includes(booking.booking_status) && (
                  <button
                    onClick={() => window.location.href = `/user/bookings/${booking._id}/track`}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Track Service
                  </button>
                )}

                <button
                  onClick={() => window.location.href = `/user/bookings/${booking._id}/chat`}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with Servicer
                </button>

                {booking.booking_status === 'completed' && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Rate Service
                  </button>
                )}

                {['pending', 'accepted'].includes(booking.booking_status) && (
                  <button
                    onClick={() => window.location.href = `/user/bookings`}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Verify Completion OTP</h3>
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtpValue('');
                  setOtpError('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Enter the 6-digit OTP</p>
                    <p>Ask the servicer to share their completion OTP with you. This verifies that the service has been completed.</p>
                  </div>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion OTP
              </label>
              <input
                type="text"
                value={otpValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpValue(value);
                  setOtpError('');
                }}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className={`w-full px-4 py-3 text-center text-2xl tracking-widest font-bold border-2 rounded-lg focus:outline-none focus:ring-2 ${
                  otpError 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
              />
              {otpError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  {otpError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtpValue('');
                  setOtpError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={otpLoading}
              >
                Cancel
              </button>
              <button
                onClick={verifyOTPAndComplete}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={otpLoading || otpValue.length !== 6}
              >
                {otpLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Verify & Complete
                  </>
                )}
              </button>
            </div>

            <button
              onClick={requestOTPFromServicer}
              className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Don't have OTP? Request from Servicer
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Rate Your Experience</h3>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3 text-center">How would you rate this service?</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReviewText('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={ratingLoading}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={ratingLoading}
              >
                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;