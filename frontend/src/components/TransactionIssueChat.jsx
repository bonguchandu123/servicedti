import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Image, FileText, Download, User, Shield, Wrench } from 'lucide-react';

const TransactionIssueChat = ({ issueId, onClose, userRole = 'admin', onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [issueId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      
      if (userRole === 'admin') {
        endpoint = `${API_BASE_URL}/admin/transaction-issues/${issueId}/chat`;
      } else if (userRole === 'user') {
        endpoint = `${API_BASE_URL}/user/transaction-issues/${issueId}/chat`;
      } else if (userRole === 'servicer') {
        endpoint = `${API_BASE_URL}/servicer/transaction-issues/${issueId}/chat`;
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message_text', newMessage);
      formData.append('message_type', attachments.length > 0 ? 'attachment' : 'text');

      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      let endpoint = '';
      if (userRole === 'admin') {
        endpoint = `${API_BASE_URL}/admin/transaction-issues/${issueId}/chat`;
      } else if (userRole === 'user') {
        endpoint = `${API_BASE_URL}/user/transaction-issues/${issueId}/chat`;
      } else if (userRole === 'servicer') {
        endpoint = `${API_BASE_URL}/servicer/transaction-issues/${issueId}/chat`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
      setAttachments([]);
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onNavigate) {
      if (userRole === 'user') {
        onNavigate('/user/bookings');
      } else if (userRole === 'servicer') {
        onNavigate('/servicer/active-services');
      } else if (userRole === 'admin') {
        onNavigate('/admin/issues/transcation');
      }
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield className="w-4 h-4 text-red-600" />;
    if (role === 'servicer') return <Wrench className="w-4 h-4 text-blue-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      servicer: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || badges.user;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600">
        <div>
          <h3 className="font-semibold text-white">Payment Issue Chat</h3>
          <p className="text-sm text-purple-100">Issue ID: {issueId.slice(-8)}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-white hover:text-purple-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_role === userRole;
            
            return (
              <div
                key={message._id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(message.sender_role)}
                      <span className="text-xs font-medium text-gray-700">
                        {message.sender_name}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(message.sender_role)}`}>
                      {message.sender_role}
                    </span>
                  </div>

                  <div
                    className={`rounded-lg p-3 shadow-sm ${
                      isOwnMessage
                        ? 'bg-purple-600 text-white'
                        : message.sender_role === 'admin'
                        ? 'bg-red-50 text-gray-900 border border-red-200'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded ${
                              isOwnMessage ? 'bg-purple-700' : 'bg-gray-100'
                            }`}
                          >
                            {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <Image className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="text-xs">Attachment {idx + 1}</span>
                            <Download className="w-4 h-4 ml-auto" />
                          </a>
                        ))}
                      </div>
                    )}

                    <p className={`text-xs mt-2 ${
                      isOwnMessage 
                        ? 'text-purple-200' 
                        : message.sender_role === 'admin'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg border">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-xs text-gray-700 truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(idx)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionIssueChat;