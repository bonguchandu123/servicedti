import React, { useState, useEffect } from 'react';
import { ArrowLeft, Info, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const CancelBookingPage = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundEligibility, setRefundEligibility] = useState(null);
  const [showRefundInfo, setShowRefundInfo] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [result, setResult] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    if (bookingId && bookingId !== 'create' && bookingId !== 'stats' && bookingId !== 'history') {
      console.log('🔍 Fetching booking:', bookingId);
      fetchBookingDetails();
      checkRefundEligibility();
    } else {
      console.error('❌ Invalid booking ID:', bookingId);
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📡 Fetching booking details...');
      
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch booking');
      }
      
      const data = await response.json();
      console.log('✅ Booking data:', data);
      setBooking(data.booking || data);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      alert('Failed to load booking details: ' + err.message);
      onNavigate('/user/bookings');
    } finally {
      setLoading(false);
    }
  };

  const checkRefundEligibility = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('💰 Checking refund eligibility...');
      
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/refund-eligibility`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Refund eligibility:', data);
        setRefundEligibility(data);
      }
    } catch (err) {
      console.error('⚠️ Refund check failed:', err);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

    setCancelLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('cancellation_reason', cancellationReason);

      console.log('🔄 Cancelling booking:', bookingId);
      console.log('📝 Reason:', cancellationReason);

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const resultData = await response.json();
      console.log('📦 Response:', resultData);

      if (!response.ok) {
        throw new Error(resultData.detail || resultData.message || 'Failed to cancel booking');
      }

      // Handle successful response
      setResult({
        success: true,
        booking: booking,
        refund: resultData.data?.refund || resultData.refund || null
      });
    } catch (err) {
      console.error('❌ Cancel error:', err);
      setResult({
        success: false,
        error: err.message || 'Failed to cancel booking'
      });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img
        src="/newmg.svg"
        alt="Loading..."
        className="w-40 h-40 animate-logo"
      />
    </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            {result.success ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Booking Cancelled Successfully
                  </h2>
                  <p className="text-gray-600">
                    Booking #{result.booking?.booking_number}
                  </p>
                </div>

                {result.refund && (
                  <div className="space-y-3 mb-6">
                    {result.refund.status === 'pending_servicer_approval' || result.refund.method === 'pending_servicer_approval' ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-blue-900 mb-2">⏳ Refund Pending</p>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p><strong>Amount:</strong> ₹{result.refund.amount}</p>
                          <p><strong>Percentage:</strong> {result.refund.percentage}%</p>
                          <p><strong>Servicer Deadline:</strong> 48 hours</p>
                          <p className="text-xs mt-2 pt-2 border-t border-blue-200">
                            💡 Servicer has 48 hours to process your refund. If they miss the deadline, you can report the issue to admin.
                          </p>
                        </div>
                      </div>
                    ) : result.refund.status === 'no_refund' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-900 mb-2">⚠️ No Refund</p>
                        <p className="text-sm text-yellow-700">
                          {result.refund.message || 'No refund applicable as per cancellation policy'}
                        </p>
                      </div>
                    ) : result.refund.status === 'no_payment_to_refund' ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-900 mb-2">ℹ️ No Payment Made</p>
                        <p className="text-sm text-gray-700">
                          No payment was processed for this booking, so no refund is needed.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                <button
                  onClick={() => onNavigate('/user/bookings')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Back to My Bookings
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Cancellation Failed
                  </h2>
                  <p className="text-red-600 text-sm mt-2">
                    {result.error}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setResult(null)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => onNavigate('/user/bookings')}
                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Back to My Bookings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('/user/bookings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Cancel Booking</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Booking Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {booking?.service_type}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Booking Number:</span>
                <span className="ml-2 font-medium text-gray-900">#{booking?.booking_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_date}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_time}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">₹{booking?.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Refund Eligibility */}
          {refundEligibility && refundEligibility.eligible && (
            <div className={`mb-6 p-4 rounded-lg border ${
              refundEligibility.refund_percentage > 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start mb-2">
                <Info className={`w-5 h-5 mr-2 mt-0.5 ${
                  refundEligibility.refund_percentage > 0 ? 'text-blue-600' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className={`font-semibold ${
                    refundEligibility.refund_percentage > 0 ? 'text-blue-900' : 'text-yellow-900'
                  }`}>
                    {refundEligibility.refund_percentage > 0 ? 'Refund Available' : 'No Refund Available'}
                  </p>
                  {refundEligibility.refund_percentage > 0 && (
                    <>
                      <p className="text-sm text-blue-700 mt-1">
                        <strong>Amount:</strong> ₹{refundEligibility.refund_amount}
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Percentage:</strong> {refundEligibility.refund_percentage}%
                      </p>
                      <p className="text-sm text-blue-700">
                        <strong>Servicer Deadline:</strong> 48 hours to process
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowRefundInfo(!showRefundInfo)}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                {showRefundInfo ? 'Hide policy details' : 'View refund policy'}
              </button>
              
              {showRefundInfo && (
                <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700 space-y-1">
                  <p>• 24+ hours: 100% refund</p>
                  <p>• 12-24 hours: 75% refund</p>
                  <p>• 6-12 hours: 50% refund</p>
                  <p>• 2-6 hours: 25% refund</p>
                  <p>• Less than 2 hours: No refund</p>
                  <p className="mt-2 font-semibold">Servicer has 48 hours to process refund</p>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Are you sure you want to cancel this booking?
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This action cannot be undone. Please provide a reason for cancellation.
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason *
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              disabled={cancelLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('/user/bookings')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={cancelLoading}
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancelBooking}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Cancelling...
                </span>
              ) : (
                'Cancel Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingPage;