import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Eye, CheckCircle, Clock, AlertCircle, User, CreditCard, Calendar, Building, X, TrendingUp } from 'lucide-react';

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Stats
  const [stats, setStats] = useState({
    pendingAmount: 0,
    pendingCount: 0,
    completedToday: 0
  });

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:8000/api/admin/payouts`;
      
      if (statusFilter) url += `?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch payouts');

      const data = await response.json();
      setPayouts(data.payouts || []);

      // Calculate stats
      const pending = data.payouts.filter(p => p.status === 'pending');
      const pendingAmount = pending.reduce((sum, p) => sum + p.amount_requested, 0);
      
      const today = new Date().toDateString();
      const completedToday = data.payouts.filter(p => 
        p.status === 'completed' && 
        new Date(p.processed_at).toDateString() === today
      ).length;

      setStats({
        pendingAmount,
        pendingCount: pending.length,
        completedToday
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewPayoutDetails = (payout) => {
    setSelectedPayout(payout);
    setShowModal(true);
  };

  const handleApprovePayout = async (payoutId) => {
    if (!confirm('Are you sure you want to approve this payout? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/admin/payouts/${payoutId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to approve payout');

      alert('Payout approved successfully!');
      setShowModal(false);
      setSelectedPayout(null);
      fetchPayouts();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      completed: CheckCircle,
      rejected: AlertCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'bank_transfer') return Building;
    if (method === 'upi') return CreditCard;
    return DollarSign;
  };

  const filteredPayouts = payouts.filter(payout =>
    payout.servicer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.servicer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.servicer_phone.includes(searchTerm) ||
    payout.amount_requested.toString().includes(searchTerm)
  );

  if (loading && payouts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Payout Requests
          </h1>
          <p className="text-gray-600 mt-2">Review and process servicer payout requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Requests</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingCount}</p>
            <p className="text-sm text-gray-500 mt-2">₹{stats.pendingAmount.toLocaleString('en-IN')} total</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Pending Amount</h3>
            <p className="text-3xl font-bold text-gray-900">₹{stats.pendingAmount.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Processed Today</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by servicer name, email, phone, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
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

        {/* Payouts List */}
        {filteredPayouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payout Requests</h3>
            <p className="text-gray-600">
              {statusFilter === 'pending' ? 'All payout requests have been processed' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPayouts.map((payout) => {
              const PaymentIcon = getPaymentMethodIcon(payout.payment_method);
              return (
                <div key={payout._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {payout.servicer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{payout.servicer_name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span className="truncate">{payout.servicer_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <CreditCard className="w-4 h-4" />
                            <span>{payout.servicer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <PaymentIcon className="w-4 h-4" />
                            <span className="capitalize">{payout.payment_method.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(payout.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="bg-blue-50 px-3 py-1 rounded-full">
                            <span className="text-blue-800 text-sm font-semibold">₹{payout.amount_requested.toLocaleString('en-IN')}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                            {getStatusIcon(payout.status)}
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => viewPayoutDetails(payout)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedPayout(payout);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payout Details Modal */}
        {showModal && selectedPayout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Payout Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedPayout(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Servicer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Servicer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {selectedPayout.servicer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedPayout.servicer_name}</p>
                        <p className="text-sm text-gray-500">Servicer ID: {selectedPayout.servicer_id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{selectedPayout.servicer_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-gray-900 font-medium">{selectedPayout.servicer_phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payout Amount */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payout Amount</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600 text-sm mb-2">Amount Requested</p>
                    <p className="text-4xl font-bold text-green-600">₹{selectedPayout.amount_requested.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Payment Method:</span>
                      <div className="flex items-center gap-2">
                        {React.createElement(getPaymentMethodIcon(selectedPayout.payment_method), { className: "w-4 h-4" })}
                        <span className="font-medium text-gray-900 capitalize">{selectedPayout.payment_method.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {selectedPayout.payment_method === 'bank_transfer' && (
                      <>
                        {selectedPayout.bank_account_number && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Account Number:</span>
                            <span className="font-medium text-gray-900">****{selectedPayout.bank_account_number.slice(-4)}</span>
                          </div>
                        )}
                        {selectedPayout.ifsc_code && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">IFSC Code:</span>
                            <span className="font-medium text-gray-900">{selectedPayout.ifsc_code}</span>
                          </div>
                        )}
                      </>
                    )}

                    {selectedPayout.payment_method === 'upi' && selectedPayout.upi_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">UPI ID:</span>
                        <span className="font-medium text-gray-900">{selectedPayout.upi_id}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700">Status:</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                        {getStatusIcon(selectedPayout.status)}
                        {selectedPayout.status.charAt(0).toUpperCase() + selectedPayout.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Timeline
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Requested:</span>
                      <span className="text-gray-900">{new Date(selectedPayout.created_at).toLocaleString()}</span>
                    </div>
                    {selectedPayout.processed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Processed:</span>
                        <span className="text-gray-900">{new Date(selectedPayout.processed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Box */}
                {selectedPayout.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900 mb-1">Important</p>
                        <p className="text-sm text-yellow-800">
                          Once approved, the payout will be processed and ₹{selectedPayout.amount_requested.toLocaleString('en-IN')} will be transferred to the servicer's account. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {selectedPayout.status === 'pending' && (
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
                  <button
                    onClick={() => handleApprovePayout(selectedPayout._id)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {actionLoading ? 'Processing...' : `Approve Payout of ₹${selectedPayout.amount_requested.toLocaleString('en-IN')}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayouts;