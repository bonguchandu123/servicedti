import React, { useState, useEffect } from 'react';
import { Home, DollarSign, Star, Briefcase, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, MapPin, Phone, User } from 'lucide-react';

const ServicerDashboardSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-48 bg-green-100 rounded mb-2"></div>
              <div className="h-5 w-64 bg-green-100 rounded"></div>
            </div>
            
            {/* Availability Toggle Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 bg-green-100 rounded"></div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-24 bg-green-100 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-28 bg-green-100 rounded mb-3"></div>
                  <div className="h-8 w-20 bg-green-100 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Bookings Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 bg-green-100 rounded"></div>
            <div className="h-5 w-24 bg-green-100 rounded"></div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-5 w-24 bg-green-100 rounded"></div>
                      <div className="h-6 w-28 bg-green-100 rounded-full"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-100 rounded"></div>
                          <div className="h-4 flex-1 bg-green-100 rounded"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-10 w-32 bg-green-100 rounded-lg ml-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border-2 border-green-100 rounded-xl p-6">
              <div className="w-8 h-8 bg-green-100 rounded mb-3"></div>
              <div className="h-6 w-32 bg-green-100 rounded mb-2"></div>
              <div className="h-4 w-28 bg-green-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ServicerDashboard = ({ onNavigate }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
    }
  };

  const updateAvailabilityStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', status);

      const response = await fetch(`${API_BASE_URL}/servicer/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setAvailabilityStatus(status);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return <ServicerDashboardSkeletonLoader />;
  }

  const stats = [
    {
      title: 'Pending Requests',
      value: dashboardData?.pending_requests || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      navigateTo: '/servicer/requests'
    },
    {
      title: "Today's Bookings",
      value: dashboardData?.today_bookings?.length || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      navigateTo: '/servicer/active-services'
    },
    {
      title: 'Wallet Balance',
      value: `₹${dashboardData?.wallet_balance?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      navigateTo: '/servicer/earnings'
    },
    {
      title: 'Average Rating',
      value: `${dashboardData?.average_rating?.toFixed(1) || '0.0'} ⭐`,
      icon: Star,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      navigateTo: '/servicer/reviews'
    },
    {
      title: 'Total Jobs',
      value: dashboardData?.total_jobs_completed || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      navigateTo: '/servicer/active-services'
    },
    {
      title: 'Total Ratings',
      value: dashboardData?.total_ratings || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      navigateTo: '/servicer/reviews'
    }
  ];

  const statusColors = {
    available: 'bg-green-500',
    busy: 'bg-yellow-500',
    offline: 'bg-gray-500'
  };

  const statusLabels = {
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
            </div>
            
            {/* Availability Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Availability:</span>
              <div className="flex gap-2">
                {['available', 'busy', 'offline'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateAvailabilityStatus(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      availabilityStatus === status
                        ? `${statusColors[status]} text-white shadow-lg`
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - ALL CLICKABLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                onClick={() => onNavigate && onNavigate(stat.navigateTo)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Today's Bookings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <span className="text-sm text-gray-600">
              {dashboardData?.today_bookings?.length || 0} booking(s)
            </span>
          </div>

          {dashboardData?.today_bookings && dashboardData.today_bookings.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.today_bookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">#{booking.booking_number}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.booking_status === 'accepted' 
                            ? 'bg-blue-100 text-blue-700'
                            : booking.booking_status === 'in_progress'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.booking_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{booking.service_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{booking.booking_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{booking.service_location?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium text-gray-900">₹{booking.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {booking.booking_status === 'accepted' && (
                        <button 
                          onClick={() => onNavigate && onNavigate(`/servicer/requests/${booking._id}`)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Start Service
                        </button>
                      )}
                      {booking.booking_status === 'in_progress' && (
                        <button 
                          onClick={() => onNavigate && onNavigate(`/servicer/requests/${booking._id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No bookings scheduled for today</p>
            </div>
          )}
        </div>

        {/* Quick Actions - ALL CLICKABLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button 
            onClick={() => onNavigate && onNavigate('/servicer/requests')}
            className="bg-white border-2 border-blue-600 text-blue-600 rounded-xl p-6 hover:bg-blue-50 transition-colors"
          >
            <AlertCircle className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg">View Requests</h3>
            <p className="text-sm text-gray-600 mt-1">
              {dashboardData?.pending_requests || 0} pending
            </p>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('/servicer/earnings')}
            className="bg-white border-2 border-green-600 text-green-600 rounded-xl p-6 hover:bg-green-50 transition-colors"
          >
            <DollarSign className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg">Request Payout</h3>
            <p className="text-sm text-gray-600 mt-1">
              Available: ₹{dashboardData?.wallet_balance?.toFixed(2) || '0.00'}
            </p>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('/servicer/reviews')}
            className="bg-white border-2 border-purple-600 text-purple-600 rounded-xl p-6 hover:bg-purple-50 transition-colors"
          >
            <Star className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg">View Reviews</h3>
            <p className="text-sm text-gray-600 mt-1">
              {dashboardData?.total_ratings || 0} total reviews
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicerDashboard;