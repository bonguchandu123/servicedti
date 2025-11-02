import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Info,
  Timer,
  Bell
} from 'lucide-react';

const RefundManagement = ({ onNavigate }) => {
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [overdueRefunds, setOverdueRefunds] = useState([]);
  const [completedRefunds, setCompletedRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [reportingIssue, setReportingIssue] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchRefunds();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRefunds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/servicer/refunds`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch refunds');

      const data = await response.json();
      console.log('📊 Refund data:', data);
      
      setPendingRefunds(data.pending_refunds || []);
      setOverdueRefunds(data.overdue_refunds || []);
      setCompletedRefunds(data.completed_refunds || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
      alert('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    try {
      setReportingIssue(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('issue_type', 'refund_processing_failed');
      formData.append('description', issueDescription);

      const response = await fetch(`${API_BASE_URL}/servicer/bookings/${selectedRefund.booking_id}/report-refund-issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to report issue');

      alert('✅ Issue reported to admin. They will process the refund.');
      setShowIssueModal(false);
      setSelectedRefund(null);
      setIssueDescription('');
      fetchRefunds();
    } catch (error) {
      alert('Failed to report issue: ' + error.message);
    } finally {
      setReportingIssue(false);
    }
  };

  const RefundCard = ({ refund, isPending, isOverdue }) => (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 ${
      isOverdue ? 'border-l-4 border-l-red-500' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              #{refund.booking_number}
            </span>
            
            {isPending && !isOverdue && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </span>
            )}
            
            {isOverdue && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                OVERDUE
              </span>
            )}
            
            {!isPending && !isOverdue && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Processed
              </span>
            )}
            
            {refund.cancelled_by_user && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                User Cancelled
              </span>
            )}
            
            {refund.urgency === 'high' && !isOverdue && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center gap-1">
                <Timer className="w-3 h-3" />
                &lt;24h Left
              </span>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{refund.user_name}</span>
              {refund.user_phone && (
                <span className="text-xs text-gray-500">• {refund.user_phone}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(refund.cancelled_at).toLocaleDateString()}</span>
              <span className="text-xs text-gray-500">
                at {new Date(refund.cancelled_at).toLocaleTimeString()}
              </span>
            </div>
            
            {(isPending || isOverdue) && refund.hours_remaining !== undefined && !isOverdue && (
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <Timer className="w-4 h-4" />
                <span>{Math.floor(refund.hours_remaining)}h {Math.floor((refund.hours_remaining % 1) * 60)}m remaining</span>
              </div>
            )}
            
            {isOverdue && refund.hours_overdue !== undefined && (
              <div className="flex items-center gap-2 text-red-600 font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>{Math.floor(refund.hours_overdue)}h overdue</span>
                {refund.issue_reported && (
                  <span className="text-xs bg-red-100 px-2 py-1 rounded">
                    ⚠️ Reported to Admin
                  </span>
                )}
              </div>
            )}
            
            {refund.cancellation_reason && (
              <div className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded">
                <MessageSquare className="w-4 h-4 mt-0.5" />
                <span className="text-xs">{refund.cancellation_reason}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
            ₹{refund.refund_amount?.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {refund.refund_percentage}% refund
          </div>
          {!isPending && !isOverdue && refund.refund_method && (
            <div className="text-xs text-gray-500 mt-1">
              ✅ Refunded
            </div>
          )}
        </div>
      </div>

      {(isPending || isOverdue) && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <button
            onClick={() => onNavigate(`/servicer/refunds/${refund.booking_id}`)}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
              isOverdue 
                ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {isOverdue ? 'Process NOW' : 'Process Refund'}
          </button>
          <button
            onClick={() => {
              setSelectedRefund(refund);
              setShowIssueModal(true);
            }}
            className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Issue
          </button>
        </div>
      )}

      {!isPending && !isOverdue && refund.processed_at && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-600">Processed:</span>
          <span className="font-medium">
            {new Date(refund.processed_at).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPending = pendingRefunds.length + overdueRefunds.length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('/servicer/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
            <p className="text-gray-600 mt-1">
              Process refunds for cancelled bookings within 48 hours
            </p>
          </div>
          <button
            onClick={fetchRefunds}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {pendingRefunds.length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-900">
                {overdueRefunds.length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.total_completed || 0}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Refunded</p>
              <p className="text-2xl font-bold text-blue-900">
                ₹{stats.total_refunded_amount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Urgent Alert Banners */}
      {overdueRefunds.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-4 animate-pulse">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900 mb-1">
                🚨 URGENT: {overdueRefunds.length} Overdue Refund{overdueRefunds.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700">
                You have missed the 48-hour deadline! Process these immediately to avoid penalties and user reports to admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingRefunds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm text-blue-700">
              <p className="font-semibold mb-1">⏰ Action Required</p>
              <p>You have {pendingRefunds.length} pending refund{pendingRefunds.length !== 1 ? 's' : ''} to process within 48 hours. Process them promptly to maintain good standing.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-medium transition-colors relative ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending ({pendingRefunds.length})
          {pendingRefunds.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingRefunds.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 px-4 font-medium transition-colors relative ${
            activeTab === 'overdue'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overdue ({overdueRefunds.length})
          {overdueRefunds.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {overdueRefunds.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Completed ({completedRefunds.length})
        </button>
      </div>

      {/* Refund List */}
      <div className="space-y-4">
        {activeTab === 'pending' && (
          pendingRefunds.length > 0 ? (
            pendingRefunds.map(refund => (
              <RefundCard key={refund.booking_id} refund={refund} isPending={true} isOverdue={false} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No pending refunds</p>
              <p className="text-gray-500 text-sm mt-1">Great job keeping up with refunds!</p>
            </div>
          )
        )}

        {activeTab === 'overdue' && (
          overdueRefunds.length > 0 ? (
            overdueRefunds.map(refund => (
              <RefundCard key={refund.booking_id} refund={refund} isPending={false} isOverdue={true} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No overdue refunds</p>
              <p className="text-gray-500 text-sm mt-1">Excellent! Keep processing refunds on time.</p>
            </div>
          )
        )}

        {activeTab === 'completed' && (
          completedRefunds.length > 0 ? (
            completedRefunds.map(refund => (
              <RefundCard key={refund.booking_id} refund={refund} isPending={false} isOverdue={false} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No completed refunds yet</p>
            </div>
          )
        )}
      </div>

      {/* Report Issue Modal */}
      {showIssueModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">
                Report Refund Issue
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Describe the issue preventing you from processing this refund. The admin team will review and handle it.
              </p>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Booking:</span>
                  <span className="font-semibold">#{selectedRefund.booking_number}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">User:</span>
                  <span className="font-semibold">{selectedRefund.user_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-orange-600">₹{selectedRefund.refund_amount?.toFixed(2)}</span>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="4"
                placeholder="E.g., Payment gateway issue, technical error, verification needed..."
                disabled={reportingIssue}
              />
              <p className="text-xs text-gray-500 mt-2">
                The admin will be notified and will process the refund on your behalf
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReportIssue}
                disabled={reportingIssue || !issueDescription.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {reportingIssue ? 'Reporting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setSelectedRefund(null);
                  setIssueDescription('');
                }}
                disabled={reportingIssue}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;