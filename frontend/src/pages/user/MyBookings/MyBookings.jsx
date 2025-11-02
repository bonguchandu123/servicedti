import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, User, DollarSign, XCircle, 
  MessageSquare, Navigation, Eye, CheckCircle, AlertTriangle,
  AlertCircle, Timer, FileText, MessageCircle, ChevronRight,
  Package
} from 'lucide-react';

const MyBookings = ({ onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `${API_BASE_URL}/user/bookings?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      const bookingsData = data.bookings || [];
      
      const bookingsWithIssues = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const issueResponse = await fetch(
              `${API_BASE_URL}/user/bookings/${booking._id}/transaction-issue`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            
            if (issueResponse.ok) {
              const issueData = await issueResponse.json();
              return { ...booking, transaction_issue: issueData.issue };
            }
          } catch (err) {
            console.error('Error fetching transaction issue:', err);
          }
          return booking;
        })
      );
      
      setBookings(bookingsWithIssues);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-800', label: 'Pending' },
      accepted: { bg: 'bg-sky-50', text: 'text-sky-800', label: 'Accepted' },
      in_progress: { bg: 'bg-indigo-50', text: 'text-indigo-800', label: 'In Progress' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Completed' },
      cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-800', label: 'Pending' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Paid' },
      failed: { bg: 'bg-rose-50', text: 'text-rose-800', label: 'Failed' },
      refunded: { bg: 'bg-violet-50', text: 'text-violet-800', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const canCancelBooking = (booking) => {
    return ['pending', 'accepted'].includes(booking.booking_status);
  };

  const canTrackBooking = (booking) => {
    return ['accepted', 'in_progress'].includes(booking.booking_status);
  };

  const canReportRefundDelay = (booking) => {
    return booking.booking_status === 'cancelled' &&
           booking.requires_servicer_refund &&
           !booking.refund_processed &&
           booking.deadline_passed &&
           !booking.issue_reported_by_user;
  };

  const canReportBookingIssue = (booking) => {
    return ['in_progress', 'completed'].includes(booking.booking_status);
  };

  const canReportTransactionIssue = (booking) => {
    return booking.payment_status === 'completed' || booking.payment_status === 'failed';
  };

  const getRefundStatus = (booking) => {
    if (!booking.requires_servicer_refund) return null;

    if (booking.issue_reported_by_user) {
      return {
        type: 'reported',
        message: 'Issue reported to admin',
        color: 'orange'
      };
    }

    if (booking.refund_processed) {
      return {
        type: 'processed',
        message: `Refunded: ₹${booking.refund_amount?.toFixed(2)}`,
        color: 'green'
      };
    }

    if (booking.deadline_passed) {
      return {
        type: 'overdue',
        message: 'Servicer missed deadline - You can report',
        color: 'red'
      };
    }

    if (booking.servicer_refund_deadline) {
      const deadline = new Date(booking.servicer_refund_deadline);
      const now = new Date();
      const hoursRemaining = Math.max(0, (deadline - now) / (1000 * 60 * 60));
      
      return {
        type: 'pending',
        message: `Waiting for servicer (${Math.floor(hoursRemaining)}h remaining)`,
        color: 'yellow'
      };
    }

    return null;
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Bookings</h1>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {['', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-slate-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === '' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600">
              {statusFilter ? 'No bookings with this status' : 'You haven\'t made any bookings yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const refundStatus = getRefundStatus(booking);
              
              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Main Content - 2 Column Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                    {/* Left Side - Main Details (70%) */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Service Title & Booking Number */}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {booking.service_type}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <p className="text-sm text-gray-600 font-medium">
                            Booking #{booking.booking_number}
                          </p>
                          {getStatusBadge(booking.booking_status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>

                      {/* Refund Status Banner */}
                      {refundStatus && (
                        <div className={`rounded-lg p-3 border ${
                          refundStatus.color === 'green' ? 'bg-emerald-50 border-emerald-200' :
                          refundStatus.color === 'red' ? 'bg-rose-50 border-rose-200' :
                          refundStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center">
                            {refundStatus.type === 'processed' && <CheckCircle className="w-4 h-4 text-emerald-700 mr-2" />}
                            {refundStatus.type === 'overdue' && <AlertTriangle className="w-4 h-4 text-rose-700 mr-2" />}
                            {refundStatus.type === 'reported' && <AlertCircle className="w-4 h-4 text-orange-700 mr-2" />}
                            {refundStatus.type === 'pending' && <Timer className="w-4 h-4 text-amber-700 mr-2" />}
                            <span className={`text-sm font-medium ${
                              refundStatus.color === 'green' ? 'text-emerald-900' :
                              refundStatus.color === 'red' ? 'text-rose-900' :
                              refundStatus.color === 'orange' ? 'text-orange-900' :
                              'text-amber-900'
                            }`}>
                              {refundStatus.message}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Date, Time & Location in Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-slate-700" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{booking.booking_date}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="w-5 h-5 text-slate-700" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Time</p>
                            <p className="text-sm font-semibold text-gray-900">{booking.booking_time}</p>
                          </div>
                        </div>
                      </div>

                      {booking.service_location?.address && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-slate-700 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium mb-1">Service Location</p>
                            <p className="text-sm text-gray-900">{booking.service_location.address}</p>
                          </div>
                        </div>
                      )}

                      {/* Servicer Info */}
                      {booking.servicer_name && (
                        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {booking.servicer_image ? (
                              <img
                                src={booking.servicer_image}
                                alt={booking.servicer_name}
                                className="w-12 h-12 object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 font-medium mb-1">Service Provider</p>
                            <p className="font-bold text-gray-900">{booking.servicer_name}</p>
                            {booking.servicer_phone && (
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <Phone className="w-4 h-4 mr-1" />
                                {booking.servicer_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Amount & Primary Actions (30%) */}
                    <div className="lg:col-span-4 space-y-3">
                      {/* Amount Card */}
                      <div className="bg-white border border-gray-300 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-600 mb-1">
                          {booking.refund_processed ? 'Original Amount' : 'Total Amount'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mb-1">₹{booking.total_amount?.toFixed(2)}</p>
                        {booking.refund_processed && (
                          <div className="inline-flex items-center space-x-1 bg-emerald-100 rounded-full px-2 py-0.5">
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                            <span className="text-xs font-semibold text-emerald-700">Refunded</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}`)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm transition"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>

                        {canTrackBooking(booking) && (
                          <button
                            onClick={() => onNavigate(`/user/bookings/${booking._id}/track`)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition"
                          >
                            <Navigation className="w-4 h-4" />
                            <span>Track Service</span>
                          </button>
                        )}

                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}/chat`)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat</span>
                        </button>

                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => onNavigate(`/user/bookings/${booking._id}/cancel`)}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Booking</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Additional Actions */}
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canReportRefundDelay(booking) && (
                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}/report-refund-delay`)}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition animate-pulse"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Report Refund Delay</span>
                        </button>
                      )}

                      {canReportBookingIssue(booking) && (
                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}/report-booking-issue`)}
                          className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Report Issue</span>
                        </button>
                      )}

                      {canReportTransactionIssue(booking) && (
                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}/report-transaction-issue`)}
                          className="flex items-center space-x-2 px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 text-sm font-medium transition"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Payment Issue</span>
                        </button>
                      )}

                      {booking.transaction_issue && (
                        <button
                          onClick={() => onNavigate(`/user/chat?issue_id=${booking.transaction_issue._id}`)}
                          className="flex items-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium relative transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Payment Chat</span>
                          {booking.transaction_issue.unread_messages > 0 && (
                            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {booking.transaction_issue.unread_messages}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;