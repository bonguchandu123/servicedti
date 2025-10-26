import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Star, TrendingUp, Award, Filter, Search, Download, Eye, MapPin, CheckCircle, XCircle, AlertCircle, Aperture } from 'lucide-react';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchBookingHistory();
    fetchBookingStats();
  }, [currentPage]);

  const fetchBookingHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/history?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch booking history');

      const data = await response.json();
      setBookings(data.bookings || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/stats` ,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || booking.booking_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        icon: CheckCircle,
        color: 'text-green-700',
        bg: 'bg-green-100',
        label: 'Completed'
      },
      cancelled: {
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
        label: 'Cancelled'
      }
    };
    
    const config = statusConfig[status] || { icon: AlertCircle, color: 'text-gray-700', bg: 'bg-gray-100', label: status };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking History</h1>
              <p className="text-sm text-gray-600 mt-1">View all your past bookings</p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_bookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed_bookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Cancelled</p>
                    <p className="text-3xl font-bold text-red-600">{stats.cancelled_bookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-purple-600">₹{stats.total_spent?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Favorite Service */}
          {stats?.favorite_service && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Most Used Service</p>
                  <p className="text-lg font-bold text-yellow-700">{stats.favorite_service}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by service or booking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2 px-4 py-3 border-2 border-gray-300 rounded-lg">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent focus:outline-none font-medium text-gray-700"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 font-medium">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || filterStatus ? 'No matching bookings' : 'No booking history'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus ? 'Try adjusting your filters' : 'Your completed and cancelled bookings will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {booking.service_type}
                        </h3>
                        {getStatusBadge(booking.booking_status)}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        Booking #{booking.booking_number}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        ₹{booking.total_amount?.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 font-medium uppercase mt-1">
                        {booking.payment_method}
                      </p>
                    </div>
                  </div>

                  {/* Servicer Info */}
                  {booking.servicer_name && (
                    <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        {booking.servicer_image ? (
                          <img
                            src={booking.servicer_image}
                            alt={booking.servicer_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-bold text-lg">
                            {booking.servicer_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{booking.servicer_name}</p>
                        <p className="text-sm text-gray-600">Service Provider</p>
                      </div>
                      {booking.servicer_phone && (
                        <a
                          href={`tel:${booking.servicer_phone}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Contact
                        </a>
                      )}
                    </div>
                  )}

                  {/* Booking Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Date</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.booking_date}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Time</p>
                        <p className="text-sm font-semibold text-gray-900">{booking.booking_time}</p>
                      </div>
                    </div>
                    {booking.completed_at && (
                      <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                        <Award className="w-5 h-5 text-purple-600 mr-3" />
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Completed</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(booking.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => window.location.href = `/user/bookings/${booking._id}`}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    {booking.booking_status === 'completed' && (
                      <button
                        onClick={() => window.location.href = `/user/bookings/${booking._id}`}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                      >
                        <Star className="w-4 h-4" />
                        <span>Rate Service</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        alert('This will create a new booking with the same servicer and service type');
                      }}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Book Again</span>
                    </button>
                  </div>

                  {/* Cancellation Info */}
                  {booking.booking_status === 'cancelled' && booking.cancellation_reason && (
                    <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-start">
                        <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason</p>
                          <p className="text-sm text-red-700">{booking.cancellation_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistory;