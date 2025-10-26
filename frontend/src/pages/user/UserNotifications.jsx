import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, AlertCircle, Calendar, DollarSign, MessageCircle, Star, Package, X } from 'lucide-react';

const UserNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/notifications?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(data.pages || 1);
      setUnreadCount(data.unread || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(notif => 
          notif._id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotifs = notifications.filter(n => !n.is_read);
      
      // Mark all unread notifications
      await Promise.all(
        unreadNotifs.map(notif => 
          fetch(`${API_BASE_URL}/user/notifications/${notif._id}/read`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        )
      );

      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_update':
        return <Calendar className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      case 'document_verification':
        return <Package className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_update':
        return 'blue';
      case 'payment':
        return 'emerald';
      case 'message':
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
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
                  className={`bg-white rounded-lg border transition-all ${
                    notification.is_read 
                      ? 'border-gray-200' 
                      : 'border-blue-200 bg-blue-50/30'
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
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
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
                                onClick={() => markAsRead(notification._id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
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

export default UserNotifications;