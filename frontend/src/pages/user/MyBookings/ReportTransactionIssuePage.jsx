import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Upload, X, CheckCircle, XCircle, AlertCircle, MessageSquare } from 'lucide-react';

const ReportTransactionIssuePage = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState(null);
  const [existingIssue, setExistingIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [transactionIssueForm, setTransactionIssueForm] = useState({
    issue_type: '',
    description: '',
    evidence_images: []
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : 'http://localhost:8000/api';

  useEffect(() => {
    fetchBookingDetails();
    checkExistingIssue();
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
      setBooking(data.booking || data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingIssue = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/transaction-issue`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setExistingIssue(data.issue);
      }
    } catch (err) {
      console.error('Error checking existing issue:', err);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setTransactionIssueForm(prev => ({
      ...prev,
      evidence_images: [...prev.evidence_images, ...files].slice(0, 5)
    }));
  };

  const removeFile = (index) => {
    setTransactionIssueForm(prev => ({
      ...prev,
      evidence_images: prev.evidence_images.filter((_, i) => i !== index)
    }));
  };

  const handleReportTransactionIssue = async () => {
    if (!transactionIssueForm.issue_type || !transactionIssueForm.description.trim()) {
      alert('Please select issue type and provide description');
      return;
    }

    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('issue_type', transactionIssueForm.issue_type);
      formData.append('description', transactionIssueForm.description);
      formData.append('amount', booking?.total_amount || 0);
      formData.append('booking_id', bookingId);
      
      transactionIssueForm.evidence_images.forEach((file) => {
        formData.append('evidence_images', file);
      });

      const response = await fetch(
        `${API_BASE_URL}/user/transaction-issues/report`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const resultData = await response.json();

      if (!response.ok) throw new Error(resultData.detail || 'Failed to report transaction issue');

      setResult({
        success: true,
        referenceNumber: resultData.data?.reference_number || 'N/A',
        issueId: resultData.data?.issue_id
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

  // If there's already an existing issue, show it
  if (existingIssue) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Issue Already Reported
              </h2>
              <p className="text-gray-600 mb-4">
                You have already reported a payment issue for this booking
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-900">Reference Number</p>
                <p className="text-lg font-bold text-blue-600">{existingIssue.reference_number}</p>
                <div className="mt-3 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Issue Type:</span>
                    <span className="font-medium text-blue-900">
                      {existingIssue.issue_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Status:</span>
                    <span className={`font-medium px-2 py-1 rounded ${
                      existingIssue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      existingIssue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {existingIssue.status?.charAt(0).toUpperCase() + existingIssue.status?.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Reported On:</span>
                    <span className="font-medium text-blue-900">
                      {existingIssue.created_at ? new Date(existingIssue.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {existingIssue.unread_messages > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700 font-medium">
                        🔔 You have {existingIssue.unread_messages} unread message(s) from admin
                      </p>
                    </div>
                  )}
                </div>
              </div>

               <button
                onClick={() => onNavigate(`/user/chat?issue_id=${existingIssue._id}`)}
                className="mt-6 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Go to Payment Issues Chat
              </button>
            </div>

            <button
              onClick={() => onNavigate('/user/bookings')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
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
                {result.success ? 'Payment Issue Reported' : 'Report Failed'}
              </h2>
              {result.success ? (
                <div>
                  <p className="text-gray-600 mb-2">Your payment issue has been submitted</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-blue-900">Reference Number</p>
                    <p className="text-lg font-bold text-blue-600">{result.referenceNumber}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      You can now chat with admin about this payment issue
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('/user/transaction-issues')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 mx-auto"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Go to Payment Issues Chat
                  </button>
                </div>
              ) : (
                <p className="text-red-600">{result.error}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate('/user/bookings')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('/user/bookings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Report Payment Issue</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-12 h-12 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Report a Payment or Transaction Issue
            </h2>
            <p className="text-sm text-gray-600">
              Booking #{booking?.booking_number || 'N/A'}
            </p>
          </div>

          {/* Booking & Payment Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Service:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.service_type || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">
                  ₹{booking?.total_amount ? booking.total_amount.toFixed(2) : '0.00'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Payment Status:</span>
                <span className={`ml-2 font-medium ${
                  booking?.payment_status === 'completed' ? 'text-green-600' :
                  booking?.payment_status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {booking?.payment_status ? 
                    booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1) : 
                    'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-pink-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-pink-900">
                  Payment Issues Are Resolved Directly with Admin
                </p>
                <p className="text-xs text-pink-700 mt-1">
                  After submitting, you'll be able to chat with admin to resolve this issue quickly.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Issue Type *
              </label>
              <select
                value={transactionIssueForm.issue_type}
                onChange={(e) => setTransactionIssueForm({ ...transactionIssueForm, issue_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select issue type</option>
                <option value="payment_failed">Payment Failed but Amount Deducted</option>
                <option value="duplicate_charge">Duplicate Charge</option>
                <option value="wrong_amount">Wrong Amount Charged</option>
                <option value="payment_not_received">Payment Made but Not Received</option>
                <option value="unauthorized_charge">Unauthorized Charge</option>
                <option value="refund_not_received">Refund Not Received</option>
                <option value="incorrect_refund">Incorrect Refund Amount</option>
                <option value="other">Other Payment Issue</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={transactionIssueForm.description}
                onChange={(e) => setTransactionIssueForm({ ...transactionIssueForm, description: e.target.value })}
                placeholder="Describe the payment issue in detail... Include transaction IDs, dates, amounts, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="5"
              />
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Screenshots - Max 5 images)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="transaction-evidence"
                  disabled={transactionIssueForm.evidence_images.length >= 5}
                />
                <label
                  htmlFor="transaction-evidence"
                  className={`flex flex-col items-center ${
                    transactionIssueForm.evidence_images.length >= 5 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center">
                    Upload payment screenshots, bank statements, transaction confirmations
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {transactionIssueForm.evidence_images.length}/5 images uploaded
                  </span>
                </label>
              </div>

              {/* Preview uploaded files */}
              {transactionIssueForm.evidence_images.length > 0 && (
                <div className="mt-4 space-y-2">
                  {transactionIssueForm.evidence_images.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-3 text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>💡 For faster resolution, include:</strong>
              </p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1 list-disc list-inside">
                <li>Screenshots of payment confirmation</li>
                <li>Bank statement showing the transaction</li>
                <li>Transaction ID or reference number</li>
                <li>Exact date and time of the payment</li>
                <li>Any error messages you received</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => onNavigate('/user/bookings')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={reportLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleReportTransactionIssue}
              className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium"
              disabled={reportLoading}
            >
              {reportLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTransactionIssuePage;