import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import TransactionIssueChat from './TransactionIssueChat';

const ServicerTransactionIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchIssues();
  }, [statusFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/servicer/transaction-issues?page=1&limit=50`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issues');

      const data = await response.json();
      setIssues(data.issues || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (issue) => {
    setSelectedIssue(issue);
    setShowChat(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      urgent: <AlertCircle className="w-5 h-5 text-red-600" />,
      high: <AlertCircle className="w-5 h-5 text-orange-600" />,
      medium: <Clock className="w-5 h-5 text-yellow-600" />,
      low: <Clock className="w-5 h-5 text-gray-600" />
    };
    return icons[priority] || icons.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <AlertCircle className="w-7 h-7 text-red-600" />
          Transaction Issues
        </h1>
        <p className="text-gray-600 mt-1">Issues related to your services - respond to admin and users</p>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h3>
          <p className="text-gray-600">No transaction issues reported against your services</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getPriorityIcon(issue.priority)}
                    <h3 className="font-semibold text-gray-900">
                      {issue.issue_type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status.replace(/_/g, ' ')}
                    </span>
                    {issue.unread_messages > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        {issue.unread_messages} new
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{issue.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-semibold text-gray-900">₹{issue.amount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Priority:</span>
                      <span className="ml-2 font-semibold text-gray-900">{issue.priority}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Reported:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {issue.booking_id && (
                      <div>
                        <span className="text-gray-600">Booking ID:</span>
                        <span className="ml-2 font-mono text-xs text-gray-900">
                          {issue.booking_id.slice(-8)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openChat(issue)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {issue.unread_messages > 0 ? 'View Messages' : 'Chat'}
                </button>
              </div>

              {issue.status === 'investigating' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🔍 This issue is being investigated. Please respond to admin questions in the chat.
                  </p>
                </div>
              )}

              {issue.status === 'resolved' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Resolved:</strong> {issue.resolution || 'Issue has been resolved'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showChat && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-4xl">
            <TransactionIssueChat
              issueId={selectedIssue._id}
              userRole="servicer"
              onClose={() => {
                setShowChat(false);
                setSelectedIssue(null);
                fetchIssues();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicerTransactionIssues;