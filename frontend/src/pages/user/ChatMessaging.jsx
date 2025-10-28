import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, User, Phone, Video, MoreVertical, Paperclip, ImagePlus, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ChatSkeletonLoader = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Booking Info Banner Skeleton */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
        </div>
      </div>

      {/* Messages Container Skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 animate-pulse">
        {/* Date Separator */}
        <div className="flex items-center justify-center my-4">
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>

        {/* Message Bubbles */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i}>
            {i % 2 === 0 ? (
              // Received message (left)
              <div className="flex justify-start mb-3">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="h-4 bg-gray-300 rounded mb-2" style={{ width: `${Math.random() * 100 + 100}px` }}></div>
                    {Math.random() > 0.5 && <div className="h-4 bg-gray-300 rounded" style={{ width: `${Math.random() * 80 + 80}px` }}></div>}
                  </div>
                </div>
              </div>
            ) : (
              // Sent message (right)
              <div className="flex justify-end mb-3">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-blue-200 rounded-2xl rounded-br-none px-4 py-3">
                    <div className="h-4 bg-blue-300 rounded mb-2" style={{ width: `${Math.random() * 100 + 100}px` }}></div>
                    {Math.random() > 0.5 && <div className="h-4 bg-blue-300 rounded" style={{ width: `${Math.random() * 80 + 80}px` }}></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area Skeleton */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 animate-pulse">
        <div className="flex items-end space-x-3">
          <div className="flex space-x-2">
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="flex-1 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

const ChatMessaging = ({ bookingId: propBookingId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [otherPersonInfo, setOtherPersonInfo] = useState(null);
  const [booking, setBooking] = useState(null);
  const {user} = useAuth();
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const pathParts = window.location.pathname.split('/');
  const bookingId = propBookingId || pathParts[pathParts.length - 1];
  
  console.log('Current user from localStorage:', user);
  const userRole = user ? user.role : null;
  const currentUserId = user ? user._id : null;
  const isServicer = userRole === 'servicer';

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
    fetchMessages();

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const endpoint = isServicer 
        ? `${API_BASE_URL}/servicer/services/${bookingId}`
        : `${API_BASE_URL}/user/bookings/${bookingId}`;
      
      console.log(`Fetching booking from: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch booking details');
      }

      const data = await response.json();
      setBooking(data);
      
      if (isServicer) {
        setOtherPersonInfo({
          name: data.user_name || 'Customer',
          phone: data.user_phone || '',
          image: data.user_image || '',
          email: data.user_email || ''
        });
      } else {
        setOtherPersonInfo(data.servicer_details || {
          name: data.servicer_name || 'Service Provider',
          phone: data.servicer_phone || '',
          image: data.servicer_image || '',
          email: data.servicer_email || ''
        });
      }
      
      console.log('✅ Booking loaded:', data);
    } catch (err) {
      console.error('❌ Error fetching booking:', err);
      setError(err.message);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const endpoint = isServicer
        ? `${API_BASE_URL}/servicer/services/${bookingId}/chat`
        : `${API_BASE_URL}/user/bookings/${bookingId}/chat`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || []);
      
      if (!silent) console.log(`📨 Loaded ${data.messages?.length || 0} messages`);
    } catch (err) {
      if (!silent) {
        setError(err.message);
        console.error('❌ Fetch messages error:', err);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      const receiverId = isServicer ? booking.user_id : booking.servicer_id;
      
      if (!receiverId) {
        throw new Error('Receiver ID not found');
      }
      
      formData.append('receiver_id', receiverId);
      formData.append('message_text', newMessage);
      formData.append('message_type', 'text');

      const endpoint = isServicer
        ? `${API_BASE_URL}/servicer/services/${bookingId}/chat`
        : `${API_BASE_URL}/user/bookings/${bookingId}/chat`;

      console.log(`Sending message to: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
      }

      const sentMessage = await response.json();
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      scrollToBottom();
      
      console.log('✅ Message sent');
    } catch (err) {
      console.error('❌ Send message error:', err);
      alert(`Failed to send: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const date = formatDate(message.timestamp || message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (loading) {
    return <ChatSkeletonLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {otherPersonInfo && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {otherPersonInfo.image ? (
                  <img
                    src={otherPersonInfo.image}
                    alt={otherPersonInfo.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{otherPersonInfo.name}</h2>
                <p className="text-sm text-green-600">Online</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Booking Info Banner */}
      {booking && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-700">Booking: </span>
              <span className="font-semibold text-gray-900">#{booking.booking_number}</span>
              <span className="text-gray-700 ml-4">{booking.service_type}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              booking.booking_status === 'completed' ? 'bg-green-100 text-green-700' :
              booking.booking_status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
              booking.booking_status === 'accepted' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {booking.booking_status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 250px)' }}
      >
        {Object.keys(messageGroups).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">
                Start the conversation with {isServicer ? 'your customer' : 'your service provider'}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 px-4 py-1 rounded-full">
                  <span className="text-xs font-medium text-gray-600">{date}</span>
                </div>
              </div>

              {/* Messages */}
              {msgs.map((message, index) => {
                const isOwnMessage = message.sender_id === currentUserId;
                
                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      <div className={`rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}>
                        {message.message_type === 'text' && (
                          <p className="text-sm break-words">{message.message_text}</p>
                        )}
                        {message.message_type === 'image' && message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Shared image"
                            className="rounded-lg max-w-full h-auto"
                          />
                        )}
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp || message.created_at)}</span>
                          {isOwnMessage && (
                            <span className="text-xs">
                              {message.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex space-x-2">
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="1"
              style={{ maxHeight: '120px' }}
              disabled={sending}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessaging;