import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign, FileText, Clock, User } from 'lucide-react';

const ResolveTransactionIssue = ({ issueId, onNavigate }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [resolveForm, setResolveForm] = useState({
    resolution: '',
    refund_amount: '',
    notes: ''
  });

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
      
      if (data.issue.amount) {
        setResolveForm(prev => ({
          ...prev,
          refund_amount: data.issue.amount.toString()
        }));
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching issue details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!resolveForm.resolution) {
      alert('Please select a resolution type');
      return;
    }

    if ((resolveForm.resolution === 'full_refund' || resolveForm.resolution === 'partial_refund') && !resolveForm.refund_amount) {
      alert('Please enter refund amount');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/transaction-issues/${issueId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resolveForm)
      });

      if (!response.ok) throw new Error('Failed to resolve issue');

      alert('Issue resolved successfully!');
      onNavigate(`/admin/issues/transaction/${issueId}/details`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
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
     <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img
        src="/newmg.svg"
        alt="Loading..."
        className="w-40 h-40 animate-logo"
      />
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

  if (issue.status === 'resolved') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3 text-yellow-800">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Issue Already Resolved</h3>
                <p className="text-sm">This issue has already been resolved</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate(`/admin/issues/transaction/${issueId}/details`)}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              View Issue Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => onNavigate(`/admin/issues/transaction/${issueId}/details`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Issue Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Resolve Transaction Issue
          </h1>
          <p className="text-gray-600 mt-2">Issue ID: {issue._id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Issue Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Issue Type</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(issue.issue_type)}`}>
                    {issue.issue_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Priority</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(issue.amount || 0).toLocaleString('en-IN')}
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
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Reported
                  </p>
                  <p className="text-gray-900 text-sm">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{issue.description}</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-6">Resolution Details</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={resolveForm.resolution}
                    onChange={(e) => setResolveForm({...resolveForm, resolution: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select resolution type...</option>
                    <option value="full_refund">Full Refund</option>
                    <option value="partial_refund">Partial Refund</option>
                    <option value="retry_payment">Retry Payment</option>
                    <option value="no_action">No Action Needed</option>
                    <option value="rejected">Reject Issue</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose how this issue should be resolved</p>
                </div>

                {(resolveForm.resolution === 'full_refund' || resolveForm.resolution === 'partial_refund') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={resolveForm.refund_amount}
                        onChange={(e) => setResolveForm({...resolveForm, refund_amount: e.target.value})}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        max={issue.amount}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        Maximum refundable: ₹{(issue.amount || 0).toLocaleString('en-IN')}
                      </p>
                      {resolveForm.resolution === 'full_refund' && (
                        <button
                          type="button"
                          onClick={() => setResolveForm({...resolveForm, refund_amount: issue.amount.toString()})}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Set Full Amount
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolveForm.notes}
                    onChange={(e) => setResolveForm({...resolveForm, notes: e.target.value})}
                    rows={6}
                    placeholder="Add detailed notes about the resolution, actions taken, and any relevant information..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes will be visible to other admins and saved in the system
                  </p>
                </div>

                {resolveForm.resolution && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Action Summary:</p>
                        <p>
                          {resolveForm.resolution === 'full_refund' && 'A full refund will be processed to the user.'}
                          {resolveForm.resolution === 'partial_refund' && 'A partial refund will be processed to the user.'}
                          {resolveForm.resolution === 'retry_payment' && 'The user will be notified to retry the payment.'}
                          {resolveForm.resolution === 'no_action' && 'This issue will be marked as resolved with no action taken.'}
                          {resolveForm.resolution === 'rejected' && 'This issue will be rejected and marked as invalid.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => onNavigate(`/admin/issues/transaction/${issueId}/details`)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !resolveForm.resolution}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Resolve Issue
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolveTransactionIssue;