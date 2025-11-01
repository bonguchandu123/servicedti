import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Search, Eye, MessageSquare, 
  CheckCircle, XCircle, Clock, Ban, DollarSign, FileText,
  User, Briefcase, AlertCircle, Send, Shield, Mail, UserX
} from 'lucide-react';

const API_URL =import.meta.env.VITE_API_BASE_URL;

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    complaint_type: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendData, setSuspendData] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, [filters, page]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.complaint_type && { complaint_type: filters.complaint_type })
      });

      const response = await fetch(`${API_URL}/api/admin/complaints?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/complaints/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchComplaintDetails = async (complaintId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedComplaint(data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    }
  };

  const updateStatus = async (complaintId, status, notes) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', status);
      if (notes) formData.append('admin_notes', notes);

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Status updated successfully!');
        fetchComplaints();
        fetchComplaintDetails(complaintId);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const requestServicerResponse = async (complaintId, message) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response_text', message);
      formData.append('response_type', 'servicer_request');
      formData.append('notify_both_parties', 'true');

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Response request sent to servicer!');
        fetchComplaintDetails(complaintId);
      }
    } catch (error) {
      console.error('Error requesting response:', error);
    }
  };

  const resolveComplaint = async (complaintId, resolution, actionTaken, refundAmount, banUser, banDuration) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resolution', resolution);
      formData.append('action_taken', actionTaken);
      formData.append('refund_approved', refundAmount > 0);
      if (refundAmount > 0) formData.append('refund_amount', refundAmount.toString());
      formData.append('ban_user', banUser);
      if (banUser && banDuration) formData.append('ban_duration_days', banDuration.toString());

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Complaint resolved successfully!');
        setShowDetails(false);
        fetchComplaints();
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
    }
  };

  const suspendServicerDirectly = async (servicerId, reason, duration) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      if (duration) formData.append('duration_days', duration.toString());
      formData.append('notify_user', 'true');

      const response = await fetch(`${API_URL}/api/admin/servicers/${servicerId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Servicer suspended successfully! ${data.data?.cancelled_bookings || 0} bookings cancelled.`);
        setShowSuspendModal(false);
        fetchComplaintDetails(selectedComplaint._id);
      } else {
        alert('Failed to suspend servicer');
      }
    } catch (error) {
      console.error('Error suspending servicer:', error);
      alert('Error suspending servicer');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[severity] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complaint Management</h1>
        <p className="text-gray-600">Fair dispute resolution between users and servicers</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg shadow p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.by_status.pending}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Investigating</p>
                <p className="text-2xl font-bold text-blue-900">{stats.by_status.investigating}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Resolved</p>
                <p className="text-2xl font-bold text-green-900">{stats.by_status.resolved}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={filters.complaint_type}
              onChange={(e) => setFilters({ ...filters, complaint_type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="poor_service">Poor Service</option>
              <option value="unprofessional">Unprofessional</option>
              <option value="fraud">Fraud</option>
              <option value="safety_concern">Safety Concern</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Complaint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Filed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Against
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{complaint.complaint_number}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{complaint.subject}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{complaint.filed_by_name}</p>
                        <p className="text-xs text-gray-500">{complaint.filed_by_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Briefcase size={16} className="mr-2 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{complaint.against_name}</p>
                        <p className="text-xs text-gray-500">{complaint.complaint_against_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(complaint.severity)}`}>
                      {complaint.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchComplaintDetails(complaint._id)}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showDetails && selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setShowDetails(false)}
          onUpdateStatus={updateStatus}
          onRequestResponse={requestServicerResponse}
          onResolve={resolveComplaint}
          onSuspendServicer={(servicerId) => {
            setSuspendData({ servicerId });
            setShowSuspendModal(true);
          }}
        />
      )}

      {/* Suspend Servicer Modal */}
      {showSuspendModal && suspendData && (
        <SuspendServicerModal
          onClose={() => setShowSuspendModal(false)}
          onSuspend={suspendServicerDirectly}
          servicerId={suspendData.servicerId}
        />
      )}
    </div>
  );
}

// Suspend Servicer Modal
function SuspendServicerModal({ onClose, onSuspend, servicerId }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(7);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserX className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold">Suspend Servicer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Suspension *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the servicer is being suspended..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suspension Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="">Permanent Ban</option>
            </select>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Warning:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Servicer account will be immediately suspended</li>
                  <li>All pending bookings will be cancelled</li>
                  <li>Users will be refunded automatically</li>
                  <li>Servicer will be notified via email</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!reason.trim()) {
                  alert('Please provide a reason for suspension');
                  return;
                }
                if (window.confirm(`Are you sure you want to suspend this servicer${duration ? ` for ${duration} days` : ' permanently'}?`)) {
                  onSuspend(servicerId, reason, duration);
                }
              }}
              disabled={!reason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Ban size={20} />
              Suspend Servicer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Complaint Details Modal Component
function ComplaintDetailsModal({ complaint, onClose, onUpdateStatus, onRequestResponse, onResolve, onSuspendServicer }) {
  const [activeTab, setActiveTab] = useState('details');
  const [notes, setNotes] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [banUser, setBanUser] = useState(false);
  const [banDuration, setBanDuration] = useState(7);

  const hasServicerResponse = complaint.responses?.some(r => r.responder_role === 'servicer');
  const isServicerComplaint = complaint.complaint_against_type === 'servicer';
  const servicerId = isServicerComplaint ? complaint.against_servicer_data?._id : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">Complaint #{complaint.complaint_number}</h2>
            <p className="text-sm text-gray-500">{complaint.subject}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        {/* Quick Actions Bar */}
        {isServicerComplaint && servicerId && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
            <p className="text-sm text-gray-600">Quick Actions for Servicer</p>
            <button
              onClick={() => onSuspendServicer(servicerId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <UserX size={16} />
              Suspend Servicer Directly
            </button>
          </div>
        )}

        {/* Alert if servicer hasn't responded */}
        {!hasServicerResponse && complaint.status === 'pending' && (
          <div className="mx-6 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Awaiting Servicer Response</p>
              <p className="text-sm text-yellow-700 mt-1">
                Before taking action, request a response from the servicer to ensure fair resolution.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex space-x-4">
            {['details', 'conversation', 'investigation', 'resolution'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Parties Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-3">Complainant (User)</p>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{complaint.filed_by_details?.name}</p>
                    <p className="text-sm text-gray-600">{complaint.filed_by_details?.email}</p>
                    <p className="text-sm text-gray-600">{complaint.filed_by_details?.phone}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      Previous complaints: {complaint.previous_complaints_count || 0}
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-900 mb-3">Accused ({complaint.complaint_against_type})</p>
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{complaint.against_details?.name}</p>
                    <p className="text-sm text-gray-600">{complaint.against_details?.email}</p>
                    <p className="text-sm text-gray-600">{complaint.against_details?.phone}</p>
                    <p className="text-xs text-orange-700 mt-2">
                      Total complaints: {complaint.total_complaints_against || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Complaint Details</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{complaint.complaint_type?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Severity</p>
                      <p className="font-medium capitalize">{complaint.severity}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{complaint.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {/* Evidence */}
              {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Evidence</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {complaint.evidence_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Info */}
              {complaint.booking_details && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Related Booking</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Booking #</p>
                      <p className="font-medium text-blue-900">{complaint.booking_details.booking_number}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Service</p>
                      <p className="font-medium text-blue-900">{complaint.booking_details.service_type}</p>
                    </div>
                    <div>
                      <p className="text-blue-700">Amount</p>
                      <p className="font-medium text-blue-900">₹{complaint.booking_details.total_amount}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Request */}
              {complaint.refund_requested && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">Refund Requested</h3>
                  </div>
                  <p className="text-sm text-red-700">
                    Amount: ₹{complaint.refund_amount || 0}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'conversation' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Response Thread</h3>
              
              {complaint.responses && complaint.responses.length > 0 ? (
                <div className="space-y-4">
                  {complaint.responses.map((response) => {
                    const isServicer = response.responder_role === 'servicer';
                    const isAdmin = response.responder_role === 'admin';
                    
                    return (
                      <div 
                        key={response._id} 
                        className={`p-4 rounded-lg border-l-4 ${
                          isServicer ? 'bg-orange-50 border-orange-400' :
                          isAdmin ? 'bg-blue-50 border-blue-400' :
                          'bg-gray-50 border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isServicer && <Briefcase className="w-4 h-4 text-orange-600" />}
                            {isAdmin && <Shield className="w-4 h-4 text-blue-600" />}
                            <p className="font-medium text-gray-900">{response.responder_name}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              isServicer ? 'bg-orange-100 text-orange-800' :
                              isAdmin ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {response.responder_role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(response.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{response.response_text}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No responses yet</p>
                </div>
              )}

              {/* Add Admin Response */}
              <div className="mt-6 border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-3">Add Admin Message</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a message to the conversation..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <button
                  onClick={() => {
                    if (notes.trim()) {
                      onUpdateStatus(complaint._id, complaint.status, notes);
                      setNotes('');
                    }
                  }}
                  disabled={!notes.trim()}
                  className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </div>
          )}

          {activeTab === 'investigation' && (
            <div className="space-y-6">
              {/* Status Update */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'investigating', 'resolved', 'rejected', 'closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus(complaint._id, status, null)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        complaint.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Request Servicer Response */}
              {isServicerComplaint && (
                <div className="border-t pt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">Request Servicer's Side</h3>
                        <p className="text-sm text-yellow-700 mb-3">
                          Give the servicer a chance to explain their side before making a decision. Fair dispute resolution requires hearing both parties.
                        </p>
                        {hasServicerResponse ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Servicer has responded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-700">
                            <Clock size={16} />
                            <span className="text-sm font-medium">Awaiting servicer response</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Write a message to the servicer requesting their response (e.g., 'Please provide your explanation regarding this complaint within 24 hours...')"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      if (requestMessage.trim()) {
                        onRequestResponse(complaint._id, requestMessage);
                        setRequestMessage('');
                      }
                    }}
                    disabled={!requestMessage.trim()}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Request Servicer Response
                  </button>
                </div>
              )}

              {/* Investigation Notes */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Internal Investigation Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about your investigation..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                  rows={4}
                />
                <button
                  onClick={() => {
                    if (notes.trim()) {
                      onUpdateStatus(complaint._id, 'investigating', notes);
                      setNotes('');
                    }
                  }}
                  disabled={!notes.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Investigation Notes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'resolution' && (
            <div className="space-y-6">
              {/* Warning if no servicer response */}
              {isServicerComplaint && !hasServicerResponse && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Warning: No Servicer Response</h3>
                      <p className="text-sm text-red-700">
                        It's recommended to request and review the servicer's response before taking final action. 
                        Proceeding without their input may result in unfair resolution.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolve Complaint */}
              <div>
                <h3 className="font-bold text-lg mb-4">Final Resolution</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Summary *
                    </label>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe how this complaint was resolved and the reasoning behind the decision..."
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Taken *
                    </label>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select action...</option>
                      <option value="no_action">No Action Required - Complaint Invalid</option>
                      <option value="warning_issued">Warning Issued to Servicer</option>
                      <option value="refund_processed">Refund Processed to User</option>
                      <option value="servicer_suspended">Servicer Suspended</option>
                      <option value="servicer_banned">Servicer Permanently Banned</option>
                      <option value="mediated_resolution">Mediated Resolution - Both Parties Agreed</option>
                      <option value="partial_refund">Partial Refund + Warning</option>
                    </select>
                  </div>

                  {/* Refund Section */}
                  {complaint.refund_requested && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">Refund Decision</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Refund Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max={complaint.refund_amount || 0}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-blue-700 mt-1">
                            Requested: ₹{complaint.refund_amount || 0}
                          </p>
                        </div>
                        {refundAmount > 0 && (
                          <div className="bg-blue-100 p-3 rounded">
                            <p className="text-sm text-blue-800">
                              ✓ Refund of ₹{refundAmount} will be credited to user's wallet
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ban/Suspend Servicer */}
                  {isServicerComplaint && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-3">Disciplinary Action</h4>
                      
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="banUser"
                          checked={banUser}
                          onChange={(e) => setBanUser(e.target.checked)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="banUser" className="font-medium text-red-900 cursor-pointer">
                            Suspend/Ban Servicer
                          </label>
                          <p className="text-sm text-red-700 mt-1">
                            Prevent this servicer from accepting new bookings
                          </p>
                        </div>
                      </div>

                      {banUser && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-red-900 mb-2">
                              Suspension Duration
                            </label>
                            <select
                              value={banDuration}
                              onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            >
                              <option value="7">7 Days</option>
                              <option value="14">14 Days</option>
                              <option value="30">30 Days</option>
                              <option value="90">90 Days</option>
                              <option value="">Permanent Ban</option>
                            </select>
                          </div>
                          <div className="bg-red-100 p-3 rounded">
                            <div className="flex items-start gap-2">
                              <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-800">
                                {banDuration 
                                  ? `Servicer will be suspended for ${banDuration} days` 
                                  : 'Servicer will be permanently banned from the platform'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resolution Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Resolution Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">Resolved</span>
                      </div>
                      {refundAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Refund:</span>
                          <span className="font-medium text-green-600">₹{refundAmount}</span>
                        </div>
                      )}
                      {banUser && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Servicer Status:</span>
                          <span className="font-medium text-red-600">
                            {banDuration ? `Suspended ${banDuration} days` : 'Permanently Banned'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Action:</span>
                        <span className="font-medium">{actionTaken || 'Not selected'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Resolution */}
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => setActiveTab('investigation')}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                      Back to Investigation
                    </button>
                    <button
                      onClick={() => {
                        if (!resolution || !actionTaken) {
                          alert('Please fill in resolution summary and action taken');
                          return;
                        }
                        if (window.confirm('Are you sure you want to resolve this complaint? This action cannot be undone.')) {
                          onResolve(complaint._id, resolution, actionTaken, refundAmount, banUser, banUser ? banDuration : null);
                        }
                      }}
                      disabled={!resolution || !actionTaken}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Resolve Complaint
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Both parties will be notified of the resolution</li>
                      <li>Refunds are processed immediately to user's wallet</li>
                      <li>Banned servicers cannot accept new bookings</li>
                      <li>All actions are logged for audit purposes</li>
                      <li>Resolution decisions should be fair and evidence-based</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}