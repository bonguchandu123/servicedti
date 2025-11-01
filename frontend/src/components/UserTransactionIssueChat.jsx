import React, { useState, useEffect } from 'react';
import { MessageSquare, X, AlertCircle } from 'lucide-react';
import TransactionIssueChat from './TransactionIssueChat';

const UserTransactionIssueChat = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/transaction-issues?page=1&limit=50`, {
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
          <AlertCircle className="w-7 h-7 text-orange-600" />
          My Transaction Issues
        </h1>
        <p className="text-gray-600 mt-1">View and discuss your reported transaction issues</p>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Reported</h3>
          <p className="text-gray-600">You haven't reported any transaction issues yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <div key={issue._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {issue.issue_type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                      {issue.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{issue.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Amount: ₹{issue.amount}</span>
                    <span>•</span>
                    <span>Reported: {new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => openChat(issue)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </button>
              </div>

              {issue.status === 'resolved' && issue.resolution && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Resolution:</strong> {issue.resolution}
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
              userRole="user"
              onClose={() => {
                setShowChat(false);
                setSelectedIssue(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTransactionIssueChat;