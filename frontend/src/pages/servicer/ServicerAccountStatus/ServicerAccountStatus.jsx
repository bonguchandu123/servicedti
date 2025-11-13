import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Shield,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Ban,
  Eye,
  Activity,
  Star,
  TrendingUp,
  Award,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

const ServicerAccountStatus = ({ onNavigate }) => {
  const [accountStatus, setAccountStatus] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [acknowledging, setAcknowledging] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAccountStatus(),
      fetchComplaints(),
      fetchWarnings(),
      fetchSuspensionHistory()
    ]);
    setLoading(false);
  };

  const fetchAccountStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/account/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/complaints/against-me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    }
  };

  const fetchWarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/warnings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWarnings(data.warnings || []);
      }
    } catch (error) {
      console.error('Failed to fetch warnings:', error);
    }
  };

  const fetchSuspensionHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/suspension-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSuspensionHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch suspension history:', error);
    }
  };

  const handleAcknowledgeWarning = async (warningId) => {
    setAcknowledging(warningId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/servicer/warnings/${warningId}/acknowledge`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        await fetchWarnings();
        await fetchAccountStatus();
      }
    } catch (error) {
      console.error('Failed to acknowledge warning:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesSearch = complaint.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.complaint_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const ComplaintCard = ({ complaint }) => {
    const hasResponded = complaint.servicer_has_responded || false;
    
    return (
      <div 
        onClick={() => onNavigate && onNavigate(`/servicer/complaint/${complaint._id}`)}
        className="bg-white rounded-lg border shadow-sm p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-bold text-gray-900">
                #{complaint.complaint_number}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                complaint.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {complaint.status?.toUpperCase()}
              </span>
              {hasResponded && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  ✓ Responded
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-3">{complaint.subject}</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>{complaint.filed_by_name || 'User'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{complaint.complaint_type?.replace('_', ' ')}</span>
              </div>
              {complaint.booking_number && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>Booking #{complaint.booking_number}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            complaint.severity === 'critical' ? 'bg-red-100 text-red-800' :
            complaint.severity === 'high' ? 'bg-orange-100 text-orange-800' :
            complaint.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {complaint.severity?.toUpperCase()}
          </div>
        </div>

        {complaint.responses && complaint.responses.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">
              {complaint.responses.length} Response(s)
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm text-gray-600">Click to view details</span>
          <Eye className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    );
  };

  const WarningCard = ({ warning }) => (
    <div className={`rounded-lg p-5 border-2 ${
      warning.acknowledged 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-orange-50 border-orange-300'
    }`}>
      <div className="flex items-start gap-4">
        <AlertTriangle className={`w-7 h-7 mt-1 ${
          warning.acknowledged ? 'text-gray-400' : 'text-orange-600'
        }`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-bold text-lg ${
              warning.acknowledged ? 'text-gray-700' : 'text-orange-900'
            }`}>
              {warning.warning_type?.replace('_', ' ').toUpperCase()}
            </h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                warning.severity === 'high' ? 'bg-red-100 text-red-800' :
                warning.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {warning.severity?.toUpperCase()}
              </span>
              {warning.acknowledged && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  ✓ Acknowledged
                </span>
              )}
            </div>
          </div>
          
          <p className={`text-sm mb-3 ${
            warning.acknowledged ? 'text-gray-600' : 'text-orange-800'
          }`}>
            {warning.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(warning.created_at).toLocaleDateString()}
              </span>
              {warning.booking_number && (
                <span>Booking #{warning.booking_number}</span>
              )}
              {warning.issued_by_name && (
                <span>By: {warning.issued_by_name}</span>
              )}
            </div>
            
            {!warning.acknowledged && (
              <button
                onClick={() => handleAcknowledgeWarning(warning._id)}
                disabled={acknowledging === warning._id}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {acknowledging === warning._id ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            )}
          </div>

          {warning.acknowledged_at && (
            <p className="text-xs text-gray-500 mt-2">
              Acknowledged on {new Date(warning.acknowledged_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate && onNavigate('/servicer/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Account Status & Compliance
              </h1>
              <p className="text-gray-600">
                Monitor your account health, complaints, and warnings
              </p>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Account Status Banner */}
        {accountStatus && (
          <div className={`rounded-xl p-6 mb-8 shadow-lg ${
            accountStatus.is_blocked 
              ? 'bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300' 
              : accountStatus.has_warnings
              ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300'
              : 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300'
          }`}>
            <div className="flex items-start gap-5">
              {accountStatus.is_blocked ? (
                <Ban className="w-12 h-12 text-red-600 flex-shrink-0" />
              ) : accountStatus.has_warnings ? (
                <AlertTriangle className="w-12 h-12 text-orange-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-3 ${
                  accountStatus.is_blocked ? 'text-red-900' :
                  accountStatus.has_warnings ? 'text-orange-900' :
                  'text-green-900'
                }`}>
                  {accountStatus.is_blocked 
                    ? '⛔ Account Suspended' 
                    : accountStatus.has_warnings
                    ? '⚠️ Account Under Warning'
                    : '✅ Account in Good Standing'}
                </h2>
                
                {accountStatus.is_blocked && (
                  <div className="space-y-2">
                    <p className="text-red-800 font-medium">
                      <strong>Reason:</strong> {accountStatus.blocked_reason}
                    </p>
                    {accountStatus.blocked_until ? (
                      <p className="text-red-800">
                        <strong>Suspended Until:</strong> {new Date(accountStatus.blocked_until).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-red-800 font-bold text-lg">
                        ⚠️ Permanent Suspension
                      </p>
                    )}
                    <div className="bg-red-200 rounded-lg p-4 mt-4">
                      <p className="text-red-900 font-semibold">
                        📞 Contact support immediately if you believe this is an error.
                      </p>
                    </div>
                  </div>
                )}

                {!accountStatus.is_blocked && accountStatus.has_warnings && (
                  <div>
                    <p className="text-orange-800 font-medium mb-2">
                      You have <strong className="text-xl">{accountStatus.warning_count}</strong> active warning(s).
                    </p>
                    <p className="text-orange-700">
                      Please review and acknowledge them to maintain your account status.
                    </p>
                  </div>
                )}

                {!accountStatus.is_blocked && !accountStatus.has_warnings && (
                  <div>
                    <p className="text-green-800 font-medium mb-2">
                      Your account is in excellent standing! 🎉
                    </p>
                    <p className="text-green-700">
                      Continue providing quality service to maintain this status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {accountStatus && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div 
              onClick={() => setActiveTab('complaints')}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  complaints.filter(c => c.status !== 'resolved').length > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {complaints.filter(c => c.status !== 'resolved').length} Active
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
            </div>

            <div 
              onClick={() => setActiveTab('warnings')}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  warnings.filter(w => !w.acknowledged).length > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {warnings.filter(w => !w.acknowledged).length} Unread
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-1">Active Warnings</p>
              <p className="text-3xl font-bold text-orange-900">{warnings.length}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">
                {accountStatus.average_rating?.toFixed(1) || '0.0'}
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Jobs Completed</p>
              <p className="text-3xl font-bold text-gray-900">
                {accountStatus.total_jobs_completed || 0}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b bg-white rounded-t-xl px-4">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'complaints', label: 'Complaints', count: complaints.length, icon: AlertCircle },
            { id: 'warnings', label: 'Warnings', count: warnings.length, icon: AlertTriangle },
            { id: 'history', label: 'History', count: suspensionHistory.length, icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 pt-4 px-4 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm p-6 min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {complaints.slice(0, 3).map(complaint => (
                      <div 
                        key={complaint._id} 
                        onClick={() => onNavigate && onNavigate(`/servicer/complaint/${complaint._id}`)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">Complaint #{complaint.complaint_number}</p>
                          <p className="text-xs text-gray-600">{new Date(complaint.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    ))}
                    {complaints.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent complaints</p>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Account Health
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Overall Health</span>
                        <span className="text-sm font-bold text-green-600">
                          {accountStatus?.account_health === 'good' ? 'Excellent' : 
                           accountStatus?.account_health === 'warning' ? 'Fair' : 'Critical'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${
                          accountStatus?.account_health === 'good' ? 'bg-green-500 w-full' :
                          accountStatus?.account_health === 'warning' ? 'bg-yellow-500 w-2/3' :
                          'bg-red-500 w-1/3'
                        }`}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Verification</p>
                        <p className="font-bold text-blue-900">{accountStatus?.verification_status || 'N/A'}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Pending Issues</p>
                        <p className="font-bold text-purple-900">{accountStatus?.pending_issues || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredComplaints.length > 0 ? (
                  filteredComplaints.map(complaint => (
                    <ComplaintCard key={complaint._id} complaint={complaint} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-16">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold text-xl mb-2">No complaints found</p>
                    <p className="text-gray-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Keep up the excellent work!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'warnings' && (
            <div className="space-y-4">
              {warnings.length > 0 ? (
                warnings.map((warning) => (
                  <WarningCard key={warning._id} warning={warning} />
                ))
              ) : (
                <div className="text-center py-16">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-900 font-bold text-xl mb-2">No active warnings</p>
                  <p className="text-gray-600">Excellent! Keep providing quality service.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {suspensionHistory.length > 0 ? (
                suspensionHistory.map((record, index) => (
                  <div key={index} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        record.action_type?.includes('suspended') || record.action_type?.includes('blocked')
                          ? 'bg-red-100'
                          : record.action_type?.includes('verified')
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}>
                        <Activity className={`w-6 h-6 ${
                          record.action_type?.includes('suspended') || record.action_type?.includes('blocked')
                            ? 'text-red-600'
                            : record.action_type?.includes('verified')
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900 text-lg">
                            {record.action_type?.replace('_', ' ').toUpperCase()}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(record.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">
                          {record.details?.reason || record.description || 'No details provided'}
                        </p>
                        {record.details?.duration_days && (
                          <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700 font-medium">
                              Duration: {record.details.duration_days} days
                            </span>
                          </div>
                        )}
                        {record.admin_name && (
                          <p className="text-sm text-gray-600 mt-2">
                            Action by: {record.admin_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-900 font-bold text-xl mb-2">No suspension history</p>
                  <p className="text-gray-600">Your account has never been suspended.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicerAccountStatus;