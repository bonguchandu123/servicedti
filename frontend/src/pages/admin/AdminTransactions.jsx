import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Eye, Filter, TrendingUp, TrendingDown, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, X, AlertCircle, Calendar } from 'lucide-react';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    successRate: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter, currentPage]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/admin/transactions?page=${currentPage}&limit=20`;
      
      if (typeFilter) url += `&type=${typeFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);

      // Calculate stats
      const completed = data.transactions.filter(t => t.transaction_status === 'completed');
      const totalRevenue = completed.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
      const successRate = data.total > 0 ? (completed.length / data.total * 100).toFixed(1) : 0;

      setStats({
        totalRevenue,
        totalTransactions: data.total,
        successRate
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const getTypeIcon = (type) => {
    const icons = {
      booking_payment: CreditCard,
      wallet_topup: Wallet,
      payout: TrendingDown,
      refund: ArrowDownLeft
    };
    const Icon = icons[type] || DollarSign;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      booking_payment: 'bg-blue-100 text-blue-800',
      wallet_topup: 'bg-green-100 text-green-800',
      payout: 'bg-orange-100 text-orange-800',
      refund: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      stripe: CreditCard,
      wallet: Wallet,
      cash: DollarSign
    };
    const Icon = icons[method] || DollarSign;
    return <Icon className="w-4 h-4" />;
  };

  const filteredTransactions = transactions.filter(txn =>
    (txn.booking_id && txn.booking_id.includes(searchTerm)) ||
    txn.user_id.includes(searchTerm) ||
    txn.amount.toString().includes(searchTerm)
  );

  if (loading && transactions.length === 0) {
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
            <DollarSign className="w-8 h-8 text-blue-600" />
            Transactions
          </h1>
          <p className="text-gray-600 mt-2">Monitor all platform transactions and revenue</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue (Platform Fees)</h3>
            <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Transactions</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Success Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.successRate}%</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by booking ID, user ID, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="booking_payment">Booking Payment</option>
                <option value="wallet_topup">Wallet Topup</option>
                <option value="payout">Payout</option>
                <option value="refund">Refund</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{txn._id.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(txn.transaction_type)}`}>
                          {getTypeIcon(txn.transaction_type)}
                          {txn.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{txn.user_id.slice(-8)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₹{txn.amount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {txn.platform_fee ? `₹${txn.platform_fee.toLocaleString('en-IN')}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          {getPaymentMethodIcon(txn.payment_method)}
                          <span className="capitalize">{txn.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(txn.transaction_status)}`}>
                          {txn.transaction_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewTransactionDetails(txn)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} ({total} total transactions)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transaction Details Modal */}
        {showModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedTransaction(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Transaction Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Transaction ID</p>
                        <p className="font-mono text-sm text-gray-900">{selectedTransaction._id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedTransaction.transaction_type)}`}>
                          {getTypeIcon(selectedTransaction.transaction_type)}
                          {selectedTransaction.transaction_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.transaction_status)}`}>
                          {selectedTransaction.transaction_status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(selectedTransaction.payment_method)}
                          <span className="capitalize text-sm text-gray-900">{selectedTransaction.payment_method}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Amount Breakdown</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Amount:</span>
                      <span className="font-semibold text-gray-900">₹{selectedTransaction.amount.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedTransaction.platform_fee && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Platform Fee:</span>
                        <span className="font-medium text-green-600">₹{selectedTransaction.platform_fee.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {selectedTransaction.servicer_earnings && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Servicer Earnings:</span>
                        <span className="font-medium text-blue-600">₹{selectedTransaction.servicer_earnings.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Related Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">User ID:</span>
                      <span className="font-mono text-gray-900">{selectedTransaction.user_id}</span>
                    </div>
                    {selectedTransaction.booking_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Booking ID:</span>
                        <span className="font-mono text-gray-900">{selectedTransaction.booking_id}</span>
                      </div>
                    )}
                    {selectedTransaction.servicer_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Servicer ID:</span>
                        <span className="font-mono text-gray-900">{selectedTransaction.servicer_id}</span>
                      </div>
                    )}
                    {selectedTransaction.stripe_payment_intent_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Stripe Payment Intent:</span>
                        <span className="font-mono text-xs text-gray-900">{selectedTransaction.stripe_payment_intent_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Timeline
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Created:</span>
                      <span className="text-gray-900">{new Date(selectedTransaction.created_at).toLocaleString()}</span>
                    </div>
                    {selectedTransaction.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Last Updated:</span>
                        <span className="text-gray-900">{new Date(selectedTransaction.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;