import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Clock,
  Info
} from 'lucide-react';

const ProcessRefund = ({ bookingId, onNavigate }) => {
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [reportingIssue, setReportingIssue] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchRefundDetails();
  }, [bookingId]);

  const fetchRefundDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/servicer/refunds`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch refund details');

      const data = await response.json();
      
      // Find the specific refund - try both string and number comparison
      const allRefunds = [
        ...(data.pending_refunds || []),
        ...(data.overdue_refunds || [])
      ];
      
      console.log('Looking for booking_id:', bookingId);
      console.log('Available refunds:', allRefunds.map(r => ({ id: r.booking_id, number: r.booking_number })));
      
      const foundRefund = allRefunds.find(r => 
        r.booking_id === parseInt(bookingId) || 
        r.booking_id === bookingId ||
        r.booking_id.toString() === bookingId
      );
      
      if (!foundRefund) {
        console.error('Refund not found. BookingId:', bookingId, 'Available IDs:', allRefunds.map(r => r.booking_id));
        alert('Refund not found or already processed');
        onNavigate('/servicer/refunds');
        return;
      }
      
      setRefund(foundRefund);
    } catch (error) {
      console.error('Failed to fetch refund details:', error);
      alert('Failed to load refund details');
      onNavigate('/servicer/refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!window.confirm(`Process refund of ₹${refund.refund_amount?.toFixed(2)}?`)) return;

    try {
      setProcessingRefund(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('refund_amount', refund.refund_amount);
      formData.append('reason', refundReason || 'User cancellation refund');

      const response = await fetch(`${API_BASE_URL}/servicer/bookings/${bookingId}/process-refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to process refund');
      }

      alert('✅ Refund processed successfully! User will receive the amount in their wallet.');
      onNavigate('/servicer/refunds');
    } catch (error) {
      alert(error.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    try {
      setReportingIssue(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('issue_type', 'refund_processing_failed');
      formData.append('description', issueDescription);

      const response = await fetch(`${API_BASE_URL}/servicer/bookings/${bookingId}/report-refund-issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to report issue');

      alert('✅ Issue reported to admin. They will process the refund.');
      setShowIssueModal(false);
      setIssueDescription('');
      onNavigate('/servicer/refunds');
    } catch (error) {
      alert('Failed to report issue: ' + error.message);
    } finally {
      setReportingIssue(false);
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

  if (!refund) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Refund not found</p>
        </div>
      </div>
    );
  }

  const isOverdue = refund.hours_overdue !== undefined && refund.hours_overdue > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/servicer/refunds')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Refunds</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">Process Refund</h1>
          <p className="text-gray-600 mt-1">
            Review and confirm the refund details
          </p>
        </div>

        {/* Overdue Alert */}
        {isOverdue && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-900 mb-1">
                  🚨 OVERDUE REFUND
                </p>
                <p className="text-sm text-red-700">
                  This refund is {Math.floor(refund.hours_overdue)}h overdue! Process immediately to avoid penalties.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Booking Number</p>
              <p className="text-2xl font-bold text-gray-900">#{refund.booking_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Refund Amount</p>
              <p className={`text-3xl font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                ₹{refund.refund_amount?.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {refund.refund_percentage}% of booking amount
              </p>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">User Details</h3>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{refund.user_name}</p>
                {refund.user_phone && (
                  <p className="text-sm text-gray-600">{refund.user_phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Cancelled On</p>
                <p className="font-medium text-gray-900">
                  {new Date(refund.cancelled_at).toLocaleString()}
                </p>
              </div>
            </div>

            {!isOverdue && refund.hours_remaining !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm text-orange-600 font-medium">Time Remaining</p>
                  <p className="font-bold text-orange-900">
                    {Math.floor(refund.hours_remaining)}h {Math.floor((refund.hours_remaining % 1) * 60)}m
                  </p>
                </div>
              </div>
            )}

            {refund.cancellation_reason && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">Cancellation Reason</p>
                    <p className="text-sm text-blue-700">{refund.cancellation_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Important Information
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The refund amount will be credited to the user's wallet immediately</li>
                  <li>• User can use wallet balance for future bookings</li>
                  <li>• This action cannot be undone once confirmed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a Note (Optional)
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Add any additional notes about this refund..."
            />
            <p className="text-xs text-gray-500 mt-2">
              This note will be recorded in the refund history
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleProcessRefund}
              disabled={processingRefund}
              className={`flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isOverdue 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {processingRefund ? 'Processing...' : 'Confirm & Process Refund'}
            </button>
            
            <button
              onClick={() => setShowIssueModal(true)}
              disabled={processingRefund}
              className="flex-1 px-6 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="w-5 h-5" />
              Report Issue to Admin
            </button>
          </div>

          <button
            onClick={() => onNavigate('/servicer/refunds')}
            disabled={processingRefund}
            className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Important:</strong> All refunds must be processed within 48 hours of cancellation. Delays may result in penalties and affect your servicer rating.
          </p>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Report Refund Issue
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Describe the issue preventing you from processing this refund. The admin team will review and handle it.
              </p>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Booking:</span>
                  <span className="font-semibold">#{refund?.booking_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-orange-600">₹{refund?.refund_amount?.toFixed(2)}</span>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="4"
                placeholder="E.g., Payment gateway issue, technical error, verification needed..."
                disabled={reportingIssue}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReportIssue}
                disabled={reportingIssue || !issueDescription.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {reportingIssue ? 'Reporting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueDescription('');
                }}
                disabled={reportingIssue}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRefund;