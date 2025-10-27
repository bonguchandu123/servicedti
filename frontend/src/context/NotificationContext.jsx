import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  const lastNotificationIdRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const checkForNewNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      // Determine the correct endpoint based on user role
      let endpoint = '';
      if (user.role === 'user') {
        endpoint = `${API_BASE_URL}/api/user/notifications?page=1&limit=20`;
      } else if (user.role === 'servicer') {
        endpoint = `${API_BASE_URL}/api/servicer/notifications?page=1&limit=20`;
      } else {
        return; // Admin doesn't need notification polling
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const latestNotifications = data.notifications || [];
      
      if (latestNotifications.length === 0) return;

      const latestId = latestNotifications[0]._id;
      
      // On first load, just store the latest ID without showing toasts
      if (isFirstLoadRef.current) {
        lastNotificationIdRef.current = latestId;
        isFirstLoadRef.current = false;
        console.log('✅ Notification polling initialized. Last notification ID:', latestId);
        return;
      }
      
      // Check if there's a new notification
      if (lastNotificationIdRef.current && latestId !== lastNotificationIdRef.current) {
        console.log('🔔 New notification detected!');
        
        // Find all new notifications
        const newNotifications = [];
        for (const notif of latestNotifications) {
          if (notif._id === lastNotificationIdRef.current) break;
          newNotifications.push(notif);
        }
        
        console.log(`📬 ${newNotifications.length} new notification(s)`);
        
        // Show toast for each new notification
        newNotifications.reverse().forEach((notif, index) => {
          setTimeout(() => {
            showNotificationToast(notif);
          }, index * 500); // Stagger toasts by 500ms
        });
      }
      
      // Update last notification ID
      lastNotificationIdRef.current = latestId;
      
    } catch (error) {
      console.error('❌ Error checking for new notifications:', error);
    }
  };

  const getNavigationPath = (notification) => {
    const metadata = notification.metadata || {};
    
    // Handle chat/message notifications
    if (notification.notification_type === 'message' || 
        (notification.notification_type === 'system' && metadata.booking_id && metadata.message_preview)) {
      
      const bookingId = metadata.booking_id;
      if (bookingId) {
        if (user.role === 'user') {
          return `/user/bookings/${bookingId}/chat`;
        } else if (user.role === 'servicer') {
          return `/servicer/chat/${bookingId}`;
        }
      }
    }
    
    // Handle booking notifications
    if (metadata.booking_id) {
      if (user.role === 'user') {
        return `/user/bookings/${metadata.booking_id}`;
      } else if (user.role === 'servicer') {
        return `/servicer/requests/${metadata.booking_id}`;
      }
    }
    
    // Handle payment notifications
    if (notification.notification_type === 'payment') {
      if (user.role === 'user') {
        return '/user/wallet';
      } else if (user.role === 'servicer') {
        return '/servicer/earnings';
      }
    }
    
    // Handle rating notifications
    if (notification.notification_type === 'rating' && metadata.booking_id) {
      if (user.role === 'user') {
        return `/user/bookings/${metadata.booking_id}`;
      } else if (user.role === 'servicer') {
        return '/servicer/reviews';
      }
    }

    // Handle document verification notifications
    if (notification.notification_type === 'document_verification') {
      if (user.role === 'servicer') {
        return '/servicer/upload-documents';
      }
    }

    // Default: Navigate to notifications page
    if (user.role === 'user') {
      return '/user/notifications';
    } else if (user.role === 'servicer') {
      return '/servicer/notifications';
    }

    return null;
  };

  const showNotificationToast = (notification) => {
    const notificationType = notification.notification_type;
    
    // Map notification types to toast types
    let toastType = 'info';
    
    switch (notificationType) {
      case 'booking_update':
        toastType = 'info';
        break;
      case 'payment':
        toastType = 'success';
        break;
      case 'message':
        toastType = 'info';
        break;
      case 'rating':
        toastType = 'success';
        break;
      case 'document_verification':
        toastType = 'warning';
        break;
      default:
        toastType = 'info';
    }
    
    // Get navigation path
    const navigationPath = getNavigationPath(notification);
    
    // Create click handler
    const handleClick = () => {
      if (navigationPath) {
        console.log(`📍 Navigating to: ${navigationPath}`);
        window.history.pushState({}, '', navigationPath);
        // Trigger a custom event to notify App.js of the navigation
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    
    // Show toast with title and message (and click handler)
    const message = `${notification.title}: ${notification.message}`;
    console.log(`🎉 Showing clickable toast: ${message}`);
    
    // Pass the click handler to the toast
    // Note: This requires the ToastContext to support an onClick parameter
    toast[toastType](message, 5000, handleClick); // Show for 5 seconds with click handler
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!user) {
      console.log('⏸️ No user logged in, skipping notification polling');
      return;
    }

    console.log(`🚀 Starting notification polling for ${user.role}`);

    // Check immediately on mount
    checkForNewNotifications();

    // Then poll every 30 seconds
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for new notifications...');
      checkForNewNotifications();
    }, 30000); // 30 seconds

    return () => {
      console.log('🛑 Stopping notification polling');
      clearInterval(pollInterval);
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
};