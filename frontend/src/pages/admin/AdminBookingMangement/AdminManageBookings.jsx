import React, { useState, useEffect } from 'react';
import { Calendar, Search, Eye, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';

const AdminSkeletonManageLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
          <div className="h-4 w-80 bg-slate-200 rounded-lg"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-12 bg-slate-200 rounded-xl col-span-2"></div>
            <div className="h-12 bg-slate-200 rounded-xl"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="h-4 w-20 bg-slate-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="flex justify-between items-center px-6 py-4">
                <div className="space-y-2 w-1/5">
                  <div className="h-4 w-24 bg-slate-200 rounded"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                </div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminManageBookings = ({ onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/admin/bookings?page=${currentPage}&limit=20`;
      
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      setBookings(data.bookings || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (bookingId) => {
    onNavigate(`/admin/bookings/${bookingId}/details`);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock
      },
      accepted: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: CheckCircle
      },
      in_progress: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        icon: AlertCircle
      },
      completed: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle
      },
      cancelled: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: XCircle
      }
    };
    return configs[status] || configs.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'text-amber-600',
      completed: 'text-emerald-600',
      failed: 'text-red-600',
      refunded: 'text-blue-600'
    };
    return colors[status] || 'text-slate-600';
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.servicer_name && booking.servicer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusCounts = {
    pending: bookings.filter(b => b.booking_status === 'pending').length,
    accepted: bookings.filter(b => b.booking_status === 'accepted').length,
    in_progress: bookings.filter(b => b.booking_status === 'in_progress').length,
    completed: bookings.filter(b => b.booking_status === 'completed').length,
  };

  if (loading && bookings.length === 0) {
    return <AdminSkeletonManageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Manage Bookings</h1>
              </div>
              <p className="text-slate-600 ml-16">View and monitor all platform bookings</p>
            </div>
            <div className="px-6 py-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700 font-medium mb-1">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-900">{total}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by booking number, user, or servicer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-amber-700 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-900">{statusCounts.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-blue-700 mb-1">Accepted</p>
            <p className="text-2xl font-bold text-blue-900">{statusCounts.accepted}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-purple-700 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-purple-900">{statusCounts.in_progress}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-emerald-700 mb-1">Completed</p>
            <p className="text-2xl font-bold text-emerald-900">{statusCounts.completed}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
              <Calendar className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Bookings Found</h3>
            <p className="text-slate-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Servicer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking) => {
                    const statusConfig = getStatusConfig(booking.booking_status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-900">#{booking.booking_number}</div>
                            <div className="text-sm text-slate-500">{new Date(booking.created_at).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{booking.user_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{booking.servicer_name || 'Not Assigned'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{booking.service_type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-900">₹{booking.total_amount.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {booking.booking_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${getPaymentStatusColor(booking.payment_status)}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewBooking(booking._id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                <div className="text-sm text-slate-600">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> ({total} total bookings)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManageBookings;