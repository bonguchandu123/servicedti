import React, { useState, useEffect } from 'react';
import { Users, Briefcase, DollarSign, Shield, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

const AdminSkeletonLoader = () => (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>

        {/* Stats cards skeleton */}
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="flex justify-between">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue cards skeleton */}
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-8 w-28 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>

      </div>
    </div>)

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminSkeletonLoader/>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Total Servicers',
      value: stats?.total_servicers || 0,
      icon: Briefcase,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50'
    },
    {
      title: 'Total Bookings',
      value: stats?.total_bookings || 0,
      icon: Calendar,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Pending Verifications',
      value: stats?.pending_verifications || 0,
      icon: Shield,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50',
      alert: stats?.pending_verifications > 0
    }
  ];

  const revenueCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.total_revenue?.toLocaleString('en-IN') || 0}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50'
    },
    {
      title: 'Platform Fees',
      value: `₹${stats?.platform_fees_collected?.toLocaleString('en-IN') || 0}`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgLight: 'bg-indigo-50'
    },
    {
      title: 'Pending Payouts',
      value: stats?.pending_payouts || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgLight: 'bg-red-50',
      subtitle: `₹${stats?.pending_payout_amount?.toLocaleString('en-IN') || 0}`,
      alert: stats?.pending_payouts > 0
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and statistics</p>
        </div>

        {/* Platform Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                    stat.alert ? 'ring-2 ring-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bgLight} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                    {stat.alert && (
                      <div className="flex items-center gap-1 text-orange-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Attention</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue & Payouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {revenueCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                    stat.alert ? 'ring-2 ring-red-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.bgLight} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-sm text-gray-500 mt-2">{stat.subtitle}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats?.pending_verifications > 0 && (
              <a
                href="/admin/verify-servicers"
                className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <Shield className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Verify Servicers</p>
                  <p className="text-sm text-gray-600">{stats.pending_verifications} pending</p>
                </div>
              </a>
            )}
            
            {stats?.pending_payouts > 0 && (
              <a
                href="/admin/payouts"
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">Process Payouts</p>
                  <p className="text-sm text-gray-600">{stats.pending_payouts} pending</p>
                </div>
              </a>
            )}

            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">View all users</p>
              </div>
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Database</span>
              </div>
              <span className="text-green-600 text-sm font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Payment Gateway</span>
              </div>
              <span className="text-green-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Notifications</span>
              </div>
              <span className="text-green-600 text-sm font-medium">Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;