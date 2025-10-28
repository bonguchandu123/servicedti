import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Calendar, DollarSign, MessageCircle, Star, Package, Wrench, AlertTriangle } from 'lucide-react';

// ============= SKELETON LOADING COMPONENTS =============
const SkeletonPulse = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Individual Notification Skeleton Card
const NotificationCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-start gap-4">
      {/* Icon Skeleton */}
      <SkeletonPulse className="w-12 h-12 rounded-lg flex-shrink-0" />
      
      {/* Content Skeleton */}
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

// Enhanced Loading Component with Animation
const NotificationsLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Animated Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-center mb-8">
            {/* Animated Bell with Rings */}
            <div className="relative w-24 h-24">
              {/* Outer Ring 1 */}
              <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-ping-slow opacity-75"></div>
              
              {/* Outer Ring 2 */}
              <div className="absolute inset-2 border-4 border-green-300 rounded-full animate-ping-slower opacity-50"></div>
              
              {/* Center Bell Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Bell Icon with Shake Animation */}
                  <Bell className="w-12 h-12 text-green-600 animate-bell-ring" />
                  
                  {/* Notification Badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    !
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading Your Notifications
            </h3>
            
            {/* Animated Dots */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>

            <p className="text-sm text-gray-500">
              Fetching your latest updates...
            </p>
          </div>

          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <SkeletonPulse className="h-8 w-48 mb-2" />
              <SkeletonPulse className="h-4 w-64" />
            </div>
            <SkeletonPulse className="h-10 w-40 rounded-lg" />
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            {[1, 2, 3].map((i) => (
              <SkeletonPulse key={i} className="flex-1 h-10 rounded-md" />
            ))}
          </div>
        </div>

        {/* Notification Cards Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <NotificationCardSkeleton key={i} />
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <SkeletonPulse className="h-10 w-24 rounded-lg" />
          <SkeletonPulse className="h-4 w-32" />
          <SkeletonPulse className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
          20%, 40%, 60%, 80% { transform: rotate(10deg); }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes ping-slower {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
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
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockNotifications = [
        {
          _id: '1',
          notification_type: 'booking_update',
          title: 'New Booking Request',
          message: 'You have a new booking request for AC Repair service.',
          is_read: false,
          created_at: new Date().toISOString(),
          metadata: { booking_id: 'BK001' }
        },
        {
          _id: '2',
          notification_type: 'payment',
          title: 'Payment Received',
          message: 'Payment of ₹500 has been credited to your account.',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          metadata: {}
        },
        {
          _id: '3',
          notification_type: 'message',
          title: 'New Message',
          message: 'Customer sent you a message regarding the booking.',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          metadata: { booking_id: 'BK002' }
        },
        {
          _id: '4',
          notification_type: 'rating',
          title: 'New Review',
          message: 'You received a 5-star rating from a customer!',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          metadata: { booking_id: 'BK003' }
        },
        {
          _id: '5',
          notification_type: 'document_verification',
          title: 'Document Verification Required',
          message: 'Please upload your documents for verification.',
          is_read: false,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          metadata: {}
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
      setTotalPages(1);
      setLoading(false);
    }, 2000);
  };

  const markAsRead = async (notificationId) => {
    setNotifications(notifications.map(notif => 
      notif._id === notificationId 
        ? { ...notif, is_read: true }
        : notif
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
    showToast('Marked as read');
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    setUnreadCount(0);
    showToast('All notifications marked as read');
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;

    setNotifications(notifications.filter(n => n._id !== notificationId));
    showToast('Notification deleted');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }

    const metadata = notification.metadata || {};
    
    if (notification.notification_type === 'message' || 
        (notification.notification_type === 'system' && metadata.booking_id)) {
      const bookingId = metadata.booking_id;
      if (bookingId) {
        showToast('Navigating to chat...', 'success');
        return;
      }
    }
    
    if (metadata.booking_id) {
      showToast('Navigating to booking...', 'success');
      return;
    }
    
    if (notification.notification_type === 'payment' || notification.notification_type === 'payout') {
      showToast('Navigating to earnings...', 'success');
      return;
    }
    
    if (notification.notification_type === 'rating' && metadata.booking_id) {
      showToast('Navigating to reviews...', 'success');
      return;
    }

    if (notification.notification_type === 'document_verification') {
      showToast('Navigating to documents...', 'success');
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

  // Show enhanced loading animation
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
          } text-white`}>
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
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
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? "No read notifications yet"
                  : "You'll see notifications here"}
              </p>
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