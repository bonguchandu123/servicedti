import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, AlertTriangle, Flag, Clock, XCircle, AlertCircle,
  User, Briefcase, MessageSquare, Send, Image,
  Loader, CheckCircle, Receipt
} from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const ViewIssueDetails = ({ issueId, onNavigate }) => {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [responseText, setResponseText] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [notifyServicer, setNotifyServicer] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchIssueDetails();
  }, [issueId]);

  const fetchIssueDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${issueId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issue details');

      const data = await response.json();
      console.log('📋 Issue Data:', data);
      setIssue(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error('Error fetching issue:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', newStatus);
      if (adminNotes) formData.append('admin_notes', adminNotes);

      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update status');

      alert('Status updated successfully');
      setAdminNotes('');
      fetchIssueDetails();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response_text', responseText);
      formData.append('notify_user', notifyUser);
      formData.append('notify_servicer', notifyServicer);

      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${issueId}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send response');

      alert('Response sent successfully');
      setResponseText('');
      fetchIssueDetails();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      in_progress: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      resolved: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      closed: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
    };
    return colors[status] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      medium: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
    };
    return colors[priority] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  const getIssueTypeIcon = (type) => {
    const icons = {
      late_arrival: Clock,
      poor_quality: XCircle,
      incomplete_work: AlertCircle,
      unprofessional: AlertTriangle,
      safety_concern: AlertTriangle
    };
    const Icon = icons[type] || AlertCircle;
    return Icon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading issue details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/issues')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Issues
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Issue</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/issues')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Issues
          </button>
          <div className="bg-white rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Issue Not Found</h3>
            <p className="text-gray-600">The requested issue could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(issue.status);
  const priorityColor = getPriorityColor(issue.priority);
  const IssueTypeIcon = getIssueTypeIcon(issue.issue_type);

  // Get user and servicer data with fallbacks
  const userData = {
    name: issue.user_name || issue.user_details?.name || 'N/A',
    email: issue.user_email || issue.user_details?.email || 'N/A',
    phone: issue.user_phone || issue.user_details?.phone || 'N/A'
  };

  const servicerData = {
    name: issue.servicer_name || issue.servicer_details?.name || issue.booking_details?.servicer_name || 'N/A',
    email: issue.servicer_email || issue.servicer_details?.email || issue.booking_details?.servicer_email || 'N/A',
    phone: issue.servicer_phone || issue.servicer_details?.phone || issue.booking_details?.servicer_phone || 'N/A'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/admin/issues')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Issues
        </button>

       
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Issue Details</h1>
              </div>
              <div className="flex items-center gap-3 ml-16">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}>
                  <Flag className="w-3.5 h-3.5" />
                  {issue.priority?.toUpperCase()} PRIORITY
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Reported On</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(issue.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Issue Description Card */}
        <div className={`${priorityColor.bg} ${priorityColor.border} border rounded-xl p-6 mb-6`}>
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 ${priorityColor.bg} rounded-xl`}>
              <IssueTypeIcon className={`w-6 h-6 ${priorityColor.text}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {issue.issue_type.replace('_', ' ').toUpperCase()}
              </h3>
              <p className="text-gray-800 leading-relaxed mb-3">{issue.description}</p>
              {issue.resolution_expected && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    <strong className="text-gray-900">Resolution Expected:</strong> {issue.resolution_expected}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Images */}
        {issue.evidence_urls && issue.evidence_urls.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Evidence ({issue.evidence_urls.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {issue.evidence_urls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="group">
                  <img
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-all"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Booking Details */}
        {issue.booking_details && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Booking Information</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Booking Number</p>
                <p className="font-semibold text-gray-900">{issue.booking_details.booking_number}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Service Type</p>
                <p className="font-semibold text-gray-900">{issue.booking_details.service_type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="font-semibold text-gray-900 capitalize">{issue.booking_details.booking_status}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="font-semibold text-gray-900">₹{issue.booking_details.total_amount?.toLocaleString('en-IN') || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* User & Servicer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-200 rounded-xl">
                <User className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-semibold text-gray-900">{userData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-sm text-gray-900 break-all">{userData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{userData.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-200 rounded-xl">
                <Briefcase className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Servicer Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-semibold text-gray-900">{servicerData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-sm text-gray-900 break-all">{servicerData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{servicerData.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Responses */}
        {issue.admin_responses && issue.admin_responses.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Admin Responses ({issue.admin_responses.length})
              </h3>
            </div>
            <div className="space-y-4">
              {issue.admin_responses.map((response, idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{response.admin_name}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(response.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">{response.response_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Response */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Add Response</h3>
          </div>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Write your response to the user and/or servicer..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Notify User</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyServicer}
                  onChange={(e) => setNotifyServicer(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Notify Servicer</span>
              </label>
            </div>
            <button
              onClick={sendResponse}
              disabled={actionLoading || !responseText.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {actionLoading ? 'Sending...' : 'Send Response'}
            </button>
          </div>
        </div>

        {/* Update Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Update Issue Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            >
              <option value="pending_review">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={updateIssueStatus}
              disabled={actionLoading || !newStatus}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
            >
              {actionLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Admin notes (optional)..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ViewIssueDetails;