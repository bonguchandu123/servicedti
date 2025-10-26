import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, MapPin, DollarSign, Calendar, User, Phone, Briefcase, AlertCircle, Filter } from 'lucide-react';

const ServicerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [filter, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/servicer/requests?status=${filter}&page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setRequests(data.requests || []);
      setTotalPages(data.pages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      setActionLoading(requestId);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/servicer/requests/${requestId}/accept`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        alert('Request accepted successfully!');
        fetchRequests();
      } else {
        alert('Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(selectedRequest._id);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('rejection_reason', rejectionReason);

      const response = await fetch(
        `http://localhost:8000/api/servicer/requests/${selectedRequest._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        alert('Request rejected successfully');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { className: 'bg-yellow-100 text-yellow-700', text: 'Pending' },
      accepted: { className: 'bg-blue-100 text-blue-700', text: 'Accepted' },
      rejected: { className: 'bg-red-100 text-red-700', text: 'Rejected' },
      cancelled: { className: 'bg-gray-100 text-gray-700', text: 'Cancelled' }
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      low: { className: 'bg-green-100 text-green-700', text: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-700', text: 'Medium' },
      high: { className: 'bg-red-100 text-red-700', text: 'High' }
    };

    const badge = badges[urgency] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
              <p className="text-gray-600 mt-1">Review and manage incoming service requests</p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {requests.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <div className="flex gap-2">
              {['pending', 'accepted', 'rejected', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        #{request.booking_number}
                      </h3>
                      <p className="text-sm text-gray-600">{request.service_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(request.urgency_level)}
                    {getStatusBadge(request.booking_status)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Customer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{request.user_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{request.user_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Date & Time</p>
                      <p className="text-gray-900 font-medium">
                        {request.booking_date} at {request.booking_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Location</p>
                      <p className="text-gray-900 font-medium truncate">
                        {request.service_location?.address || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Amount</p>
                      <p className="text-gray-900 font-bold text-lg">₹{request.total_amount}</p>
                    </div>
                  </div>
                </div>

                {/* Problem Description */}
                {request.problem_description && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900 mb-1">Problem Description</h4>
                        <p className="text-yellow-800 text-sm">{request.problem_description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span className="font-medium">Payment Method:</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {request.payment_method?.toUpperCase() || 'CASH'}
                  </span>
                </div>

                {/* Action Buttons */}
                {request.booking_status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(request._id)}
                      disabled={actionLoading === request._id}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionLoading === request._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Accept Request
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleRejectClick(request)}
                      disabled={actionLoading === request._id}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Request
                    </button>
                  </div>
                )}

                {request.booking_status === 'accepted' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm font-medium">
                      ✓ You have accepted this request. Go to Active Services to start work.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? "You don't have any pending requests at the moment"
                : `No ${filter} requests found`}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Schedule conflict, Outside service area, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicerRequests;