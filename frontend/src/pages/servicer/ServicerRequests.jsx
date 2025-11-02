import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, MapPin, DollarSign, Calendar, User, Phone, Briefcase, AlertCircle, Filter } from 'lucide-react';

const ServicerRequestsSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 animate-pulse">
          <div className="h-9 w-56 bg-gray-200 rounded mb-2"></div>
          <div className="h-5 w-80 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
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
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchRequests();
  }, [filter, page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/requests?status=${filter}&page=${page}&limit=10`,
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
        `${API_BASE_URL}/servicer/requests/${requestId}/accept`,
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
        `${API_BASE_URL}/servicer/requests/${selectedRequest._id}/reject`,
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
      pending: { className: 'bg-amber-50 text-amber-800', text: 'Pending' },
      accepted: { className: 'bg-sky-50 text-sky-800', text: 'Accepted' },
      rejected: { className: 'bg-rose-50 text-rose-800', text: 'Rejected' },
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
      low: { className: 'bg-emerald-50 text-emerald-800', text: 'Low' },
      medium: { className: 'bg-amber-50 text-amber-800', text: 'Medium' },
      high: { className: 'bg-rose-50 text-rose-800', text: 'High' }
    };

    const badge = badges[urgency] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return <ServicerRequestsSkeletonLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
              <p className="text-gray-600 mt-1">Review and manage incoming service requests</p>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {requests.length}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['pending', 'accepted', 'rejected', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {requests.length > 0 ? (
          <div className="space-y-6">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                  {/* Left Side - Main Details */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Service Title & Booking Number */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {request.service_type}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <p className="text-sm text-gray-600 font-medium">
                          Booking #{request.booking_number}
                        </p>
                        {getUrgencyBadge(request.urgency_level)}
                        {getStatusBadge(request.booking_status)}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 font-medium mb-1">Customer</p>
                        <p className="font-bold text-gray-900">{request.user_name || 'N/A'}</p>
                        {request.user_phone && (
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Phone className="w-4 h-4 mr-1" />
                            {request.user_phone}
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
                            {request.booking_date} at {request.booking_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Location</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {request.service_location?.address || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Problem Description */}
                    {request.problem_description && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-amber-700 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-amber-900 mb-1">Problem Description</p>
                            <p className="text-sm text-amber-800">{request.problem_description}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Payment Method:</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                        {request.payment_method?.toUpperCase() || 'CASH'}
                      </span>
                    </div>

                    {/* Accepted Info */}
                    {request.booking_status === 'accepted' && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                        <div className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-sky-700 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-sky-900">Request Accepted</p>
                            <p className="text-sm text-sky-800">Go to Active Services to start work.</p>
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
                      <p className="text-2xl font-bold text-gray-900">₹{request.total_amount}</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      {request.booking_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(request._id)}
                            disabled={actionLoading === request._id}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition"
                          >
                            {actionLoading === request._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Accept Request</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleRejectClick(request)}
                            disabled={actionLoading === request._id}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Request</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? "You don't have any pending requests at the moment"
                : `No ${filter} requests found`}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || actionLoading}
                className="flex-1 bg-rose-600 text-white py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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