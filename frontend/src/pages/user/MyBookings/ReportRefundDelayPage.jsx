import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

const ReportRefundDelayPage = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [result, setResult] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api`;

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

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

      if (!response.ok) throw new Error('Failed to fetch booking');
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Error:', err);
      setResult({
        success: false,
        error: 'Failed to load booking details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReportRefundDelay = async () => {
    if (!reportReason.trim()) {
      alert('Please describe the issue');
      return;
    }

    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('issue_description', reportReason);

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/report-refund-delay`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const resultData = await response.json();

      if (!response.ok) {
        throw new Error(resultData.detail || 'Failed to report issue');
      }

      setResult({
        success: true,
        message: resultData.message || 'Issue reported successfully',
        data: resultData.data
      });
    } catch (err) {
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setReportLoading(false);
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
            <div className="text-center mb-6">
              <div className={`w-20 h-20 ${result.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {result.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.success ? 'Report Submitted Successfully' : 'Report Failed'}
              </h2>
              <p className={`text-lg ${result.success ? 'text-gray-600' : 'text-red-600'}`}>
                {result.success ? result.message : result.error}
              </p>
              
              {result.success && result.data && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-1">
                    Reference Number
                  </p>
                  <p className="text-lg font-mono text-blue-700">
                    {result.data.reference_number}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('/user/bookings')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('/user/bookings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Report Refund Delay</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Warning Header */}
          <div className="mb-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Report Servicer Refund Delay
            </h2>
            <p className="text-sm text-gray-600">
              Booking #{booking?.booking_number}
            </p>
          </div>

          {/* Booking Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Service:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.service_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_date}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">₹{booking?.total_amount?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium text-red-600">Refund Overdue</span>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  Servicer Missed the 48-Hour Refund Deadline
                </p>
                <p className="text-xs text-red-700">
                  Admin will process your refund immediately and take appropriate action against the servicer.
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Issue Description (Optional)
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe any additional details about the delay..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              What happens next:
            </p>
            <ul className="text-xs text-blue-700 space-y-1.5 ml-5">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Admin will be notified immediately</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Your refund will be processed within 24 hours</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Servicer will receive a penalty for missing the deadline</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll receive a confirmation once the refund is initiated</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate('/user/bookings')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              disabled={reportLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleReportRefundDelay}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              disabled={reportLoading}
            >
              {reportLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reporting...
                </span>
              ) : (
                'Report to Admin'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportRefundDelayPage;