import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Phone, User, DollarSign, XCircle, 
  MessageSquare, Navigation, Eye, Info, CheckCircle, AlertTriangle,
  AlertCircle, Timer, FileText, Upload, X
} from 'lucide-react';
import { MessageCircle } from 'lucide-react'

const MyBookings = ({ onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundInfo, setShowRefundInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBookingIssueModal, setShowBookingIssueModal] = useState(false);
  const [showTransactionIssueModal, setShowTransactionIssueModal] = useState(false);
  const [showRefundResultModal, setShowRefundResultModal] = useState({ show: false });
  
  // Form states
  const [cancellationReason, setCancellationReason] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [refundEligibility, setRefundEligibility] = useState(null);
  
  // Booking Issue Form
  const [bookingIssueForm, setBookingIssueForm] = useState({
    issue_type: '',
    description: '',
    evidence_images: [],
    resolution_expected: ''
  });
  const [bookingIssueLoading, setBookingIssueLoading] = useState(false);
  
  // Transaction Issue Form
  const [transactionIssueForm, setTransactionIssueForm] = useState({
    issue_type: '',
    description: '',
    evidence_images: []
  });
  const [transactionIssueLoading, setTransactionIssueLoading] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, currentPage]);

  // const fetchBookings = async () => {
  //   setLoading(true);
  //   try {
  //     const token = localStorage.getItem('token');
  //     const params = new URLSearchParams({
  //       page: currentPage,
  //       limit: 10
  //     });

  //     if (statusFilter) params.append('status', statusFilter);

  //     const response = await fetch(
  //       `${API_BASE_URL}/user/bookings?${params}`,
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       }
  //     );

  //     if (!response.ok) throw new Error('Failed to fetch bookings');

  //     const data = await response.json();
  //     setBookings(data.bookings || []);
  //     setTotalPages(data.pages || 1);
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  

// In the fetchBookings function, add this after fetching bookings:
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
    
    // ✅ Fetch transaction issues for each booking
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
  const checkRefundEligibility = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
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
        setRefundEligibility(data);
      }
    } catch (err) {
      console.error('Refund check failed:', err);
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

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${selectedBooking._id}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || 'Failed to cancel booking');

      setShowRefundResultModal({
        show: true,
        success: true,
        booking: selectedBooking,
        refund: result.data?.refund
      });

      setShowCancelModal(false);
      setCancellationReason('');
      setSelectedBooking(null);
      setRefundEligibility(null);
      
      setTimeout(() => {
        fetchBookings();
      }, 2000);
    } catch (err) {
      setShowRefundResultModal({
        show: true,
        success: false,
        error: err.message
      });
    } finally {
      setCancelLoading(false);
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
        `${API_BASE_URL}/user/bookings/${selectedBooking._id}/report-refund-delay`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || 'Failed to report issue');

      alert('✅ Issue reported to admin. They will process your refund and take action against the servicer.');
      setShowReportModal(false);
      setReportReason('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    } finally {
      setReportLoading(false);
    }
  };

 const handleReportBookingIssue = async () => {
  if (
    !bookingIssueForm.issue_type ||
    !bookingIssueForm.description.trim() ||
    !bookingIssueForm.resolution_expected.trim()

  ) {
    alert('Please select issue type, resolution, and provide description');
    return;
  }

  setBookingIssueLoading(true);
  try {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('issue_type', bookingIssueForm.issue_type);
    formData.append('description', bookingIssueForm.description);
    formData.append('resolution_expected', bookingIssueForm.resolution_expected);

    bookingIssueForm.evidence_images.forEach((file) => {
      formData.append('evidence_images', file);
    });

    const response = await fetch(
      `${API_BASE_URL}/user/bookings/${selectedBooking._id}/report-issue`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) throw new Error(result.detail || 'Failed to report issue');

    alert(`✅ Booking issue reported successfully!\nReference: ${result.data.reference_number}`);
    setShowBookingIssueModal(false);
    setBookingIssueForm({
      issue_type: '',
      description: '',
      evidence_images: [],
      resolution_expected: '',
    });
    setSelectedBooking(null);
    fetchBookings();
  } catch (err) {
    alert(err.message);
  } finally {
    setBookingIssueLoading(false);
  }
};


  const handleReportTransactionIssue = async () => {
    if (!transactionIssueForm.issue_type || !transactionIssueForm.description.trim()) {
      alert('Please select issue type and provide description');
      return;
    }

    setTransactionIssueLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('issue_type', transactionIssueForm.issue_type);
      formData.append('description', transactionIssueForm.description);
      formData.append('amount', selectedBooking.total_amount);
      formData.append('booking_id', selectedBooking._id);
      
      transactionIssueForm.evidence_images.forEach((file, index) => {
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

      const result = await response.json();

      if (!response.ok) throw new Error(result.detail || 'Failed to report transaction issue');

      alert(`✅ Transaction issue reported successfully!\nReference: ${result.data.reference_number}`);
      setShowTransactionIssueModal(false);
      setTransactionIssueForm({ issue_type: '', description: '', evidence_images: [] });
      setSelectedBooking(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setTransactionIssueLoading(false);
    }
  };

  const handleFileChange = (e, formType) => {
    const files = Array.from(e.target.files);
    if (formType === 'booking') {
      setBookingIssueForm(prev => ({
        ...prev,
        evidence_images: [...prev.evidence_images, ...files].slice(0, 5)
      }));
    } else {
      setTransactionIssueForm(prev => ({
        ...prev,
        evidence_images: [...prev.evidence_images, ...files].slice(0, 5)
      }));
    }
  };

  const removeFile = (index, formType) => {
    if (formType === 'booking') {
      setBookingIssueForm(prev => ({
        ...prev,
        evidence_images: prev.evidence_images.filter((_, i) => i !== index)
      }));
    } else {
      setTransactionIssueForm(prev => ({
        ...prev,
        evidence_images: prev.evidence_images.filter((_, i) => i !== index)
      }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      accepted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Accepted' },
      in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' }
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
      refunded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Refunded' }
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
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
                    ? 'bg-blue-600 text-white'
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
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {booking.service_type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Booking #{booking.booking_number}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.booking_status)}
                        <div className="mt-2">
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                      </div>
                    </div>

                    {/* Refund Status Banner */}
                    {refundStatus && (
                      <div className={`mb-4 rounded-lg p-3 border ${
                        refundStatus.color === 'green' ? 'bg-green-50 border-green-200' :
                        refundStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                        refundStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center">
                          {refundStatus.type === 'processed' && <CheckCircle className="w-4 h-4 text-green-600 mr-2" />}
                          {refundStatus.type === 'overdue' && <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                          {refundStatus.type === 'reported' && <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />}
                          {refundStatus.type === 'pending' && <Timer className="w-4 h-4 text-yellow-600 mr-2" />}
                          <span className={`text-sm font-medium ${
                            refundStatus.color === 'green' ? 'text-green-900' :
                            refundStatus.color === 'red' ? 'text-red-900' :
                            refundStatus.color === 'orange' ? 'text-orange-900' :
                            'text-yellow-900'
                          }`}>
                            {refundStatus.message}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Servicer Info */}
                    {booking.servicer_name && (
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {booking.servicer_image ? (
                            <img
                              src={booking.servicer_image}
                              alt={booking.servicer_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{booking.servicer_name}</p>
                          {booking.servicer_phone && (
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Phone className="w-4 h-4 mr-1" />
                              {booking.servicer_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{booking.booking_date}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{booking.booking_time}</span>
                      </div>
                      {booking.service_location?.address && (
                        <div className="flex items-center text-sm text-gray-600 md:col-span-2">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{booking.service_location.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                      <span className="text-gray-600">
                        {booking.refund_processed ? 'Original Amount' : 'Total Amount'}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{booking.total_amount?.toFixed(2)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onNavigate(`/user/bookings/${booking._id}`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>

                      {canTrackBooking(booking) && (
                        <button
                          onClick={() => onNavigate(`/user/bookings/${booking._id}/track`)}
                          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Track Service</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate(`/user/bookings/${booking._id}/chat`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat</span>
                      </button>

                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowCancelModal(true);
                            checkRefundEligibility(booking._id);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {canReportRefundDelay(booking) && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowReportModal(true);
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 animate-pulse"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>Report Refund Delay</span>
                        </button>
                      )}

                      {canReportBookingIssue(booking) && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowBookingIssueModal(true);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Report Issue</span>
                        </button>
                      )}

                      {canReportTransactionIssue(booking) && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowTransactionIssueModal(true);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                        >
                          <DollarSign className="w-4 h-4" />
                          <span>Payment Issue</span>
                        </button>
                      )}

                      {booking.transaction_issue && (
  <button
    onClick={() => onNavigate(`/user/chat?issue_id=${booking.transaction_issue._id}`)}
    className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 relative"
  >
    <MessageCircle className="w-4 h-4" />
    <span>Payment Chat</span>
    {booking.transaction_issue.unread_messages > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            
            {refundEligibility && refundEligibility.eligible && (
              <div className={`mb-4 p-4 rounded-lg border ${
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
                          <strong>Servicer Deadline:</strong> 48 hours
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
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel booking #{selectedBooking.booking_number}?
            </p>
            
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="4"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                  setSelectedBooking(null);
                  setRefundEligibility(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={cancelLoading}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Refund Delay Modal */}
      {showReportModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Report Refund Delay
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Booking #{selectedBooking.booking_number}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-900">
                <strong>Servicer missed the 48-hour refund deadline</strong>
              </p>
              <p className="text-xs text-red-700 mt-1">
                Admin will process your refund and take action against the servicer.
              </p>
            </div>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows="4"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setSelectedBooking(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={reportLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReportRefundDelay}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={reportLoading}
              >
                {reportLoading ? 'Reporting...' : 'Report to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Issue Modal */}
      {showBookingIssueModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Report Booking Issue
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Booking #{selectedBooking.booking_number}
              </p>
            </div>

            <div className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  value={bookingIssueForm.issue_type}
                  onChange={(e) => setBookingIssueForm({ ...bookingIssueForm, issue_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select issue type</option>
                  <option value="late_arrival">Late Arrival</option>
                  <option value="poor_quality">Poor Quality Work</option>
                  <option value="incomplete_work">Incomplete Work</option>
                  <option value="unprofessional">Unprofessional Behavior</option>
                  <option value="safety_concern">Safety Concern</option>
                  <option value="different_servicer">Different Servicer Arrived</option>
                  <option value="damaged_property">Property Damage</option>
                  <option value="overcharging">Overcharging/Hidden Fees</option>
                  <option value="no_show">Servicer Did Not Show</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={bookingIssueForm.description}
                  onChange={(e) => setBookingIssueForm({ ...bookingIssueForm, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="4"
                />
              </div>

              <select
  value={bookingIssueForm.resolution_expected}
  onChange={(e) =>
    setBookingIssueForm((prev) => ({
      ...prev,
      resolution_expected: e.target.value
    }))
  }
  className="w-full border rounded p-2"
>
  <option value="">Select Resolution</option>
  <option value="refund">Refund</option>
  <option value="redo">Redo Work</option>
  <option value="discount">Discount</option>
  <option value="apology">Apology</option>
</select>


              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence (Optional - Max 5 images)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, 'booking')}
                    className="hidden"
                    id="booking-evidence"
                    disabled={bookingIssueForm.evidence_images.length >= 5}
                  />
                  <label
                    htmlFor="booking-evidence"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload images
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      ({bookingIssueForm.evidence_images.length}/5)
                    </span>
                  </label>
                </div>

                {/* Preview uploaded files */}
                {bookingIssueForm.evidence_images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {bookingIssueForm.evidence_images.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index, 'booking')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBookingIssueModal(false);
                  setBookingIssueForm({ issue_type: '', description: '', evidence_images: [] });
                  setSelectedBooking(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={bookingIssueLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReportBookingIssue}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                disabled={bookingIssueLoading}
              >
                {bookingIssueLoading ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Issue Modal */}
      {showTransactionIssueModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Report Payment Issue
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Booking #{selectedBooking.booking_number}
              </p>
              <p className="text-sm font-medium text-gray-900 text-center mt-1">
                Amount: ₹{selectedBooking.total_amount?.toFixed(2)}
              </p>
            </div>

            <div className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Issue Type *
                </label>
                <select
                  value={transactionIssueForm.issue_type}
                  onChange={(e) => setTransactionIssueForm({ ...transactionIssueForm, issue_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  placeholder="Describe the payment issue in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows="4"
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence (Screenshots - Max 5 images)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, 'transaction')}
                    className="hidden"
                    id="transaction-evidence"
                    disabled={transactionIssueForm.evidence_images.length >= 5}
                  />
                  <label
                    htmlFor="transaction-evidence"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Upload payment screenshots
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      ({transactionIssueForm.evidence_images.length}/5)
                    </span>
                  </label>
                </div>

                {/* Preview uploaded files */}
                {transactionIssueForm.evidence_images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {transactionIssueForm.evidence_images.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(index, 'transaction')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>💡 Tip:</strong> Include screenshots of payment confirmation, bank statement, or transaction ID for faster resolution.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTransactionIssueModal(false);
                  setTransactionIssueForm({ issue_type: '', description: '', evidence_images: [] });
                  setSelectedBooking(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={transactionIssueLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReportTransactionIssue}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                disabled={transactionIssueLoading}
              >
                {transactionIssueLoading ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Result Modal */}
      {showRefundResultModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {showRefundResultModal.success ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Booking Cancelled Successfully
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Booking #{showRefundResultModal.booking?.booking_number}
                  </p>
                </div>

                {showRefundResultModal.refund && (
                  <div className="space-y-3 mb-4">
                    {showRefundResultModal.refund.status === 'pending_servicer_approval' ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-blue-900 mb-2">⏳ Refund Pending</p>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p><strong>Amount:</strong> ₹{showRefundResultModal.refund.amount}</p>
                          <p><strong>Percentage:</strong> {showRefundResultModal.refund.percentage}%</p>
                          <p><strong>Servicer Deadline:</strong> 48 hours</p>
                          <p className="text-xs mt-2 pt-2 border-t border-blue-200">
                            💡 Servicer has 48 hours to process your refund. If they miss the deadline, you can report the issue to admin.
                          </p>
                        </div>
                      </div>
                    ) : showRefundResultModal.refund.status === 'no_refund' ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-900 mb-2">⚠️ No Refund</p>
                        <p className="text-sm text-yellow-700">
                          {showRefundResultModal.refund.message}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}

                <button
                  onClick={() => setShowRefundResultModal({ show: false })}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Got it!
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Cancellation Failed
                  </h3>
                  <p className="text-red-600 text-sm">
                    {showRefundResultModal.error}
                  </p>
                </div>

                <button
                  onClick={() => setShowRefundResultModal({ show: false })}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;