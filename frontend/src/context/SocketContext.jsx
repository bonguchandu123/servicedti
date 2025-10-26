import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [locationUpdate, setLocationUpdate] = useState(null);

  const SOCKET_URL = 'http://localhost:8000';

  // Initialize Socket Connection
  useEffect(() => {
    if (token && !socket) {
      // Create WebSocket connection (simulating socket.io)
      const ws = new WebSocket(`ws://localhost:8000/ws`);
      
      ws.onopen = () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Authenticate socket
        ws.send(JSON.stringify({
          event: 'authenticate',
          data: { token }
        }));
      };

      ws.onclose = () => {
        console.log('Socket disconnected');
        setConnected(false);
      };

      ws.onerror = (error) => {
        console.error('Socket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleSocketEvent(message);
        } catch (error) {
          console.error('Error parsing socket message:', error);
        }
      };

      setSocket(ws);

      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [token]);

  // Handle incoming socket events
  const handleSocketEvent = useCallback((message) => {
    const { event, data } = message;

    switch (event) {
      case 'new_notification':
        setNotifications(prev => [data, ...prev]);
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/logo.png'
          });
        }
        break;

      case 'receive_message':
        setMessages(prev => [...prev, data]);
        break;

      case 'location_update':
        setLocationUpdate(data);
        break;

      case 'booking_accepted':
      case 'booking_rejected':
      case 'booking_cancelled':
      case 'service_started':
      case 'service_completed':
      case 'servicer_arrived':
        // Trigger callback or update state
        console.log(`${event}:`, data);
        break;

      case 'payment_completed':
        console.log('Payment completed:', data);
        break;

      case 'emergency_request':
        // Show urgent notification
        if (Notification.permission === 'granted') {
          new Notification('⚠️ EMERGENCY REQUEST', {
            body: data.description,
            requireInteraction: true
          });
        }
        break;

      default:
        console.log('Unhandled event:', event, data);
    }
  }, []);

  // Send socket event
  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.send(JSON.stringify({ event, data }));
    }
  }, [socket, connected]);

  // Send chat message
  const sendMessage = useCallback((bookingId, receiverId, messageText) => {
    emit('send_message', {
      booking_id: bookingId,
      sender_id: user?._id,
      receiver_id: receiverId,
      message_text: messageText
    });
  }, [emit, user]);

  // Update location (for servicers)
  const updateLocation = useCallback((bookingId, latitude, longitude, speed, heading) => {
    emit('location_update', {
      booking_id: bookingId,
      latitude,
      longitude,
      speed,
      heading
    });
  }, [emit]);

  // Start tracking
  const startTracking = useCallback((bookingId, latitude, longitude) => {
    emit('start_tracking', {
      booking_id: bookingId,
      latitude,
      longitude
    });
  }, [emit]);

  // Mark servicer arrived
  const servicerArrived = useCallback((bookingId) => {
    emit('servicer_arrived', {
      booking_id: bookingId
    });
  }, [emit]);

  // Send typing indicator
  const sendTyping = useCallback((receiverId, senderId) => {
    emit('typing', {
      receiver_id: receiverId,
      sender_id: senderId
    });
  }, [emit]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark notification as read
  const markNotificationRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif._id === notificationId ? { ...notif, is_read: true } : notif
      )
    );
  }, []);

  const value = {
    socket,
    connected,
    notifications,
    messages,
    locationUpdate,
    emit,
    sendMessage,
    updateLocation,
    startTracking,
    servicerArrived,
    sendTyping,
    clearNotifications,
    markNotificationRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;