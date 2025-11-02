import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Eye, Clock, CheckCircle, 
  XCircle, AlertCircle, User, Briefcase, Flag, Image as ImageIcon
} from 'lucide-react';

const AdminManageIssues = ({ onNavigate }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0 });

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

  const handleViewIssue = (issueId) => {
    onNavigate(`/admin/issues/${issueId}/details`);
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
                <div key={issue._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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

                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {issue.description}
                      </p>

                      {issue.resolution_expected && (
                        <div className="text-xs text-gray-600 mb-2">
                          <strong>Resolution Expected:</strong> {issue.resolution_expected}
                        </div>
                      )}

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
                        onClick={() => handleViewIssue(issue._id)}
                        className="text-blue-600 hover:text-blue-900 p-2 transition-colors"
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
      </div>
    </div>
  );
};

export default AdminManageIssues;