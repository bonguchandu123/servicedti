import React, { useState, useEffect } from 'react';
import { Home, Calendar, Star, Wallet, Bell, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-9 w-48 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-5 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="mt-4 h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Recent Bookings Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 w-16 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-5 w-28 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your overview</p>
          </div>
          
          {/* Notifications Button */}
          <button
            onClick={() => onNavigate && onNavigate('/user/notifications')}
            className="relative flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-900">Notifications</span>
            {dashboardData?.unread_notifications > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-rose-600 rounded-full">
                {dashboardData.unread_notifications > 9 ? '9+' : dashboardData.unread_notifications}
              </span>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Bookings Card */}
          <div 
            onClick={() => onNavigate && onNavigate('/user/bookings')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.active_bookings || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-slate-700" />
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              <span>In progress</span>
            </div>
          </div>

          {/* Favorites Card */}
          <div 
            onClick={() => onNavigate && onNavigate('/user/favorites')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Favorites</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.favorites_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Saved servicers
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div 
            onClick={() => onNavigate && onNavigate('/user/wallet')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Wallet Balance</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₹{dashboardData?.wallet_balance?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-teal-700" />
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate && onNavigate('/user/wallet');
              }}
              className="text-sm text-slate-700 hover:text-slate-900 font-medium"
            >
              Add Money →
            </button>
          </div>

          {/* Notifications Card */}
          <button
            onClick={() => onNavigate && onNavigate('/user/notifications')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Notifications</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData?.unread_notifications || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <Bell className="w-6 h-6 text-rose-700" />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Unread messages</span>
              <ArrowRight className="w-4 h-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
              <button 
                onClick={() => onNavigate && onNavigate('/user/bookings')}
                className="text-slate-700 hover:text-slate-900 text-sm font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {dashboardData?.recent_bookings?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recent_bookings.map((booking) => (
                  <div
                    key={booking._id}
                    onClick={() => onNavigate && onNavigate(`/user/bookings/${booking._id}`)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        booking.booking_status === 'completed' ? 'bg-emerald-100' :
                        booking.booking_status === 'in_progress' ? 'bg-indigo-100' :
                        booking.booking_status === 'accepted' ? 'bg-amber-100' :
                        'bg-gray-100'
                      }`}>
                        {booking.booking_status === 'completed' ? (
                          <CheckCircle className={`w-5 h-5 text-emerald-700`} />
                        ) : (
                          <Clock className={`w-5 h-5 ${
                            booking.booking_status === 'in_progress' ? 'text-indigo-700' :
                            booking.booking_status === 'accepted' ? 'text-amber-700' :
                            'text-gray-600'
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.service_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          Booking #{booking.booking_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900 mb-1">
                        ₹{booking.total_amount?.toFixed(2)}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        booking.booking_status === 'completed' ? 'bg-emerald-50 text-emerald-800' :
                        booking.booking_status === 'in_progress' ? 'bg-indigo-50 text-indigo-800' :
                        booking.booking_status === 'accepted' ? 'bg-amber-50 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.booking_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bookings yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start booking services to see them here
                </p>
                <button 
                  onClick={() => onNavigate && onNavigate('/user/search')}
                  className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                >
                  Browse Services
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => onNavigate && onNavigate('/user/search')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Home className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Book Service</h3>
                  <p className="text-sm text-gray-600">Find & book services</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('/user/favorites')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Favorites</h3>
                  <p className="text-sm text-gray-600">View saved servicers</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('/user/wallet')}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Wallet className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Wallet</h3>
                  <p className="text-sm text-gray-600">Manage payments</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;