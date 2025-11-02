import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Eye, Filter, X, CheckCircle, XCircle, Clock, DollarSign, User, Calendar, MessageSquare, RefreshCw, CreditCard, TrendingDown, AlertTriangle } from 'lucide-react';

const TransactionIssuesSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-80 bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-6 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              {[1,2,3,4,5,6,7].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${50 + i*8}px` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminTransactionIssues = ({ onNavigate }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const [stats, setStats] = useState({
    pending: 0,
    investigating: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter, issueTypeFilter, currentPage]);

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/admin/transaction-issues?page=${currentPage}&limit=20`;
      
      if (statusFilter) url += `&status=${statusFilter}`;
      if (priorityFilter) url += `&priority=${priorityFilter}`;
      if (issueTypeFilter) url += `&issue_type=${issueTypeFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transaction issues');

      const data = await response.json();
      setIssues(data.issues || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);

      const pending = data.issues.filter(i => i.status === 'pending_review').length;
      const investigating = data.issues.filter(i => i.status === 'investigating').length;
      const resolved = data.issues.filter(i => i.status === 'resolved').length;

      setStats({ pending, investigating, resolved, total: data.total });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewIssueDetails = (issueId) => {
    onNavigate(`/admin/issues/transaction/${issueId}/details`);
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

  const filteredIssues = issues.filter(issue =>
    (issue.transaction_id && issue.transaction_id.includes(searchTerm)) ||
    (issue.booking_id && issue.booking_id.includes(searchTerm)) ||
    (issue.user_id && issue.user_id.includes(searchTerm))
  );

  if (loading && issues.length === 0) {
    return <TransactionIssuesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            Transaction Issues
          </h1>
          <p className="text-gray-600 mt-2">Manage payment disputes and transaction problems</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Review</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Investigating</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.investigating}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Resolved</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Issues</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={issueTypeFilter}
              onChange={(e) => {
                setIssueTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="payment_failed">Payment Failed</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="refund_request">Refund Request</option>
              <option value="duplicate_charge">Duplicate Charge</option>
              <option value="payment_not_received">Payment Not Received</option>
              <option value="incorrect_amount">Incorrect Amount</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.map((issue) => (
                    <tr key={issue._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{issue._id.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueTypeColor(issue.issue_type)}`}>
                          {issue.issue_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{issue.user_name || issue.user_id?.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{(issue.amount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                          {issue.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigate(`/admin/chat?issue_id=${issue._id}`)}
                            className="text-purple-600 hover:text-purple-900 relative"
                            title="Open Chat"
                          >
                            <MessageSquare className="w-5 h-5" />
                            {issue.unread_messages > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                {issue.unread_messages}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => viewIssueDetails(issue._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {issue.status !== 'resolved' && (
                            <button
                              onClick={() => onNavigate(`/admin/issues/transaction/${issue._id}/resolve`)}
                              className="text-green-600 hover:text-green-900"
                              title="Resolve Issue"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} ({total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
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

export default AdminTransactionIssues;