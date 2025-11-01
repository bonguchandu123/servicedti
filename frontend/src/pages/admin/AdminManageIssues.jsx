import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Eye, Filter, Clock, CheckCircle, 
  XCircle, AlertCircle, MessageSquare, User, Briefcase,
  X, Send, Flag, Image as ImageIcon
} from 'lucide-react';

const AdminManageIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0 });
  
  // Response form
  const [responseText, setResponseText] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [notifyServicer, setNotifyServicer] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter, issueTypeFilter, currentPage]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/admin/booking-issues?page=${currentPage}&limit=20`;
      
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (issueTypeFilter) url += `&issue_type=${issueTypeFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issues');

      const data = await response.json();
      setIssues(data.issues || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      setStats(data.stats || { pending: 0, in_progress: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewIssueDetails = async (issue) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${issue._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issue details');

      const detailedIssue = await response.json();
      setSelectedIssue(detailedIssue);
      setShowModal(true);
    } catch (err) {
      alert('Error loading issue details: ' + err.message);
    }
  };

  const updateIssueStatus = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', newStatus);
      if (adminNotes) formData.append('admin_notes', adminNotes);

      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${selectedIssue._id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update status');

      alert('Status updated successfully');
      setNewStatus('');
      setAdminNotes('');
      setShowModal(false);
      fetchIssues();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const sendResponse = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response_text', responseText);
      formData.append('notify_user', notifyUser);
      formData.append('notify_servicer', notifyServicer);

      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${selectedIssue._id}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send response');

      alert('Response sent successfully');
      setResponseText('');
      viewIssueDetails(selectedIssue); // Refresh details
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const updatePriority = async (issueId, priority) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('priority', priority);

      const response = await fetch(`${API_BASE_URL}/admin/booking-issues/${issueId}/priority`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to update priority');

      fetchIssues();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-orange-100 text-orange-800 border-orange-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
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
    return <Icon className="w-4 h-4" />;
  };

  const filteredIssues = issues.filter(issue =>
    issue.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.servicer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && issues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                Manage Booking Issues
              </h1>
              <p className="text-gray-600 mt-2">Review and resolve customer complaints</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold">
                {stats.pending} Pending
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                {stats.in_progress} In Progress
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by booking, user, or servicer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Issues List */}
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">All issues have been resolved or none reported yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <div key={issue._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Issue Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                          <Flag className="w-3 h-3" />
                          {issue.priority?.toUpperCase()} PRIORITY
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          {getIssueTypeIcon(issue.issue_type)}
                          {issue.issue_type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Booking Info */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Booking #{issue.booking_number || 'N/A'} - {issue.service_type || 'Unknown Service'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <User className="w-3 h-3 inline mr-1" />
                          User: {issue.user_name} | 
                          <Briefcase className="w-3 h-3 inline ml-2 mr-1" />
                          Servicer: {issue.servicer_name || 'N/A'}
                        </p>
                      </div>

                      {/* Issue Description */}
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {issue.description}
                      </p>

                      {/* Resolution Expected */}
                      {issue.resolution_expected && (
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Resolution Expected:</strong> {issue.resolution_expected}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(issue.created_at).toLocaleString()}
                        </span>
                        {issue.evidence_urls && issue.evidence_urls.length > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <ImageIcon className="w-3 h-3" />
                            {issue.evidence_urls.length} Evidence
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <select
                        value={issue.priority}
                        onChange={(e) => updatePriority(issue._id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <button
                        onClick={() => viewIssueDetails(issue)}
                        className="text-blue-600 hover:text-blue-900 p-2"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} ({total} total issues)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Issue Details Modal */}
        {showModal && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Issue Details</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedIssue.priority)}`}>
                        <Flag className="w-3 h-3" />
                        {selectedIssue.priority?.toUpperCase()} PRIORITY
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                        {selectedIssue.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Issue Info */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {getIssueTypeIcon(selectedIssue.issue_type)}
                    {selectedIssue.issue_type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-gray-700">{selectedIssue.description}</p>
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Resolution Expected:</strong> {selectedIssue.resolution_expected}
                  </div>
                </div>

                {/* Evidence Images */}
                {selectedIssue.evidence_urls && selectedIssue.evidence_urls.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                      Evidence ({selectedIssue.evidence_urls.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedIssue.evidence_urls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-300 hover:border-blue-500"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Details */}
                {selectedIssue.booking_details && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Booking #:</span>
                        <span className="ml-2 font-medium">{selectedIssue.booking_details.booking_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Service:</span>
                        <span className="ml-2 font-medium">{selectedIssue.booking_details.service_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium">{selectedIssue.booking_details.booking_status}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedIssue.booking_details.total_amount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* User & Servicer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      User Details
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedIssue.user_name}</div>
                      <div><strong>Email:</strong> {selectedIssue.user_email}</div>
                      <div><strong>Phone:</strong> {selectedIssue.user_phone}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                      Servicer Details
                    </h3>
                    <div className="bg-purple-50 rounded-lg p-4 space-y-2 text-sm">
                      <div><strong>Name:</strong> {selectedIssue.servicer_name || 'N/A'}</div>
                      <div><strong>Email:</strong> {selectedIssue.servicer_email || 'N/A'}</div>
                      <div><strong>Phone:</strong> {selectedIssue.servicer_phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Responses */}
                {selectedIssue.admin_responses && selectedIssue.admin_responses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      Admin Responses ({selectedIssue.admin_responses.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedIssue.admin_responses.map((response, idx) => (
                        <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{response.admin_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(response.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{response.response_text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Response */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Add Response
                  </h3>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to the user..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifyUser}
                        onChange={(e) => setNotifyUser(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Notify User</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifyServicer}
                        onChange={(e) => setNotifyServicer(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Notify Servicer</span>
                    </label>
                    <button
                      onClick={sendResponse}
                      className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send Response
                    </button>
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Update Issue Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={updateIssueStatus}
                      disabled={!newStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Status
                    </button>
                  </div>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Admin notes (optional)..."
                    rows={2}
                    className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManageIssues;