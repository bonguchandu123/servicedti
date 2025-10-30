import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, DollarSign, MessageCircle, Star, Package, Wrench, AlertTriangle, RefreshCw } from 'lucide-react';

// ============= SKELETON LOADING COMPONENTS =============
const SkeletonPulse = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

const NotificationCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-start gap-4">
      <SkeletonPulse className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <SkeletonPulse className="h-5 w-3/4" />
          <SkeletonPulse className="w-2 h-2 rounded-full flex-shrink-0 mt-2" />
        </div>
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <SkeletonPulse className="h-3 w-20" />
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-3 w-24" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationsLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-ping-slow opacity-75"></div>
              <div className="absolute inset-2 border-4 border-green-300 rounded-full animate-ping-slower opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Bell className="w-12 h-12 text-green-600 animate-bell-ring" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    !
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Your Notifications
            </h3>
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-gray-500">Fetching your latest updates...</p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <SkeletonPulse className="h-8 w-48 mb-2" />
              <SkeletonPulse className="h-4 w-64" />
            </div>
            <SkeletonPulse className="h-10 w-40 rounded-lg" />
          </div>

          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            {[1, 2, 3].map((i) => (
              <SkeletonPulse key={i} className="flex-1 h-10 rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <NotificationCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        
        .animate-bell-ring {
          animation: bell-ring 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-ping-slower {
          animation: ping-slower 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// ============= MAIN NOTIFICATIONS COMPONENT =============
const ServicerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Not authenticated. Please login.');
        setLoading(false);
        return;
      }

      console.log('📡 Fetching notifications from API...');

      const response = await fetch(
        `${API_BASE_URL}/api/servicer/notifications?page=${page}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Notifications received:', data);

      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
      setTotalPages(data.pages || 1);
      setLoading(false);

    } catch (err) {
      console.error('❌ Failed to fetch notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setLoading(false);
      showToast(err.message || 'Failed to load notifications', 'error');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      
      console.log(`📝 Marking notification ${notificationId} as read...`);

      const response = await fetch(
        `${API_BASE_URL}/api/servicer/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state
      setNotifications(notifications.map(notif => 
        notif._id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log('✅ Marked as read');
      showToast('Marked as read');

    } catch (err) {
      console.error('❌ Failed to mark as read:', err);
      showToast(err.message || 'Failed to mark as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      console.log(`📝 Marking ${unreadNotifications.length} notifications as read...`);

      // Mark all unread notifications
      await Promise.all(
        unreadNotifications.map(notif =>
          fetch(`${API_BASE_URL}/api/servicer/notifications/${notif._id}/read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        )
      );

      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      
      console.log('✅ All marked as read');
      showToast('All notifications marked as read');

    } catch (err) {
      console.error('❌ Failed to mark all as read:', err);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      const token = getAuthToken();
      
      console.log(`🗑️ Deleting notification ${notificationId}...`);

      const response = await fetch(
        `${API_BASE_URL}/api/servicer/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log('✅ Notification deleted');
      showToast('Notification deleted');

    } catch (err) {
      console.error('❌ Failed to delete notification:', err);
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }

    const metadata = notification.metadata || {};
    
    // Handle different notification types
    if (notification.notification_type === 'message' || 
        (notification.notification_type === 'system' && metadata.booking_id)) {
      const bookingId = metadata.booking_id;
      if (bookingId) {
        console.log('📬 Navigate to chat:', bookingId);
        showToast('Opening chat...', 'success');
        // TODO: Navigate to chat with booking
        return;
      }
    }
    
    if (metadata.booking_id) {
      console.log('📋 Navigate to booking:', metadata.booking_id);
      showToast('Opening booking details...', 'success');
      // TODO: Navigate to booking details
      return;
    }
    
    if (notification.notification_type === 'payment' || notification.notification_type === 'payout') {
      console.log('💰 Navigate to earnings');
      showToast('Opening earnings...', 'success');
      // TODO: Navigate to earnings page
      return;
    }
    
    if (notification.notification_type === 'rating' && metadata.booking_id) {
      console.log('⭐ Navigate to reviews');
      showToast('Opening reviews...', 'success');
      // TODO: Navigate to reviews
      return;
    }

    if (notification.notification_type === 'document_verification') {
      console.log('📄 Navigate to documents');
      showToast('Opening documents...', 'success');
      // TODO: Navigate to documents page
      return;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_update':
        return <Calendar className="w-5 h-5" />;
      case 'payment':
      case 'payout':
        return <DollarSign className="w-5 h-5" />;
      case 'message':
      case 'system':
        return <MessageCircle className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      case 'document_verification':
        return <Package className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_update':
        return 'blue';
      case 'payment':
      case 'payout':
        return 'emerald';
      case 'message':
      case 'system':
        return 'purple';
      case 'rating':
        return 'yellow';
      case 'document_verification':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'read') return notif.is_read;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return <NotificationsLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white flex items-center gap-2`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">Error Loading Notifications</h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Wrench className="w-8 h-8 text-green-600" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Read ({notifications.filter(n => n.is_read).length})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 mb-4">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? "No read notifications yet"
                  : "You'll see notifications here"}
              </p>
              {error && (
                <button
                  onClick={fetchNotifications}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const color = getNotificationColor(notification.notification_type);
              const colors = colorClasses[color];
              
              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-lg border transition-all cursor-pointer ${
                    notification.is_read 
                      ? 'border-gray-200' 
                      : 'border-green-200 bg-green-50/30'
                  } hover:shadow-md`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`${colors.bg} p-3 rounded-lg flex-shrink-0`}>
                        <div className={colors.text}>
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicerNotifications;