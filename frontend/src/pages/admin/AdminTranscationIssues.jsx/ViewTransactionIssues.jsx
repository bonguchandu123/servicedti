import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, DollarSign, User, FileText, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

const ViewTransactionIssues = ({ issueId, onNavigate }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/transaction-issues/${issueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issue details');

      const data = await response.json();
      setIssue(data.issue);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching issue details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIssueTypeColor = (type) => {
    const colors = {
      payment_failed: 'bg-red-100 text-red-800',
      payment_pending: 'bg-yellow-100 text-yellow-800',
      refund_request: 'bg-blue-100 text-blue-800',
      duplicate_charge: 'bg-orange-100 text-orange-800',
      payment_not_received: 'bg-purple-100 text-purple-800',
      incorrect_amount: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Error Loading Issue</h3>
                <p className="text-sm">{error || 'Issue not found'}</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/admin/issues/transaction')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Issues
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/admin/issues/transaction')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Transaction Issues
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                Issue Details
              </h1>
              <p className="text-gray-600 mt-2">Issue ID: {issue._id}</p>
            </div>
            {issue.status !== 'resolved' && (
              <button
                onClick={() => onNavigate(`/admin/issues/transaction/${issueId}/resolve`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Resolve Issue
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Issue Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Issue Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issue Type</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getIssueTypeColor(issue.issue_type)}`}>
                    {issue.issue_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Amount Involved
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(issue.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Reported On
                  </p>
                  <p className="text-gray-900 font-medium">
                    {new Date(issue.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User
                  </p>
                  <p className="text-gray-900 font-medium">
                    {issue.user_name || issue.user_id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
            </div>
          </div>

          {/* Evidence */}
          {issue.evidence_urls && issue.evidence_urls.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Evidence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issue.evidence_urls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={url} 
                      alt={`Evidence ${idx + 1}`} 
                      className="rounded-lg w-full h-64 object-cover border border-gray-200"
                    />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                    >
                      <span className="text-white font-semibold bg-blue-600 px-4 py-2 rounded-lg">
                        View Full Size
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related IDs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Related Information</h3>
            <div className="space-y-3">
              {issue.transaction_id && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600 font-medium">Transaction ID:</span>
                  <span className="font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded">
                    {issue.transaction_id}
                  </span>
                </div>
              )}
              {issue.booking_id && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600 font-medium">Booking ID:</span>
                  <span className="font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded">
                    {issue.booking_id}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">User ID:</span>
                <span className="font-mono text-gray-900 bg-gray-100 px-3 py-1 rounded">
                  {issue.user_id}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution (if resolved) */}
          {issue.resolution && (
            <div className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resolution
              </h3>
              <div className="space-y-3">
                <p className="text-gray-700 whitespace-pre-wrap">{issue.resolution}</p>
                {issue.refund_amount && (
                  <div className="bg-white rounded-lg p-3 border border-green-300">
                    <span className="text-sm text-gray-600">Refund Amount: </span>
                    <span className="font-bold text-green-700">
                      ₹{Number(issue.refund_amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {issue.resolved_at && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Resolved on {new Date(issue.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTransactionIssues;