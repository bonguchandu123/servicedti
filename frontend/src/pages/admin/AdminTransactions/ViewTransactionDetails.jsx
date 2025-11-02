import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, CreditCard, Wallet, Calendar, AlertCircle, Loader, TrendingDown, ArrowDownLeft, User, Briefcase, Receipt } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const ViewTransactionDetails = ({ transactionId, onNavigate }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/transactions/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transaction details');

      const data = await response.json();
      setTransaction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      booking_payment: CreditCard,
      wallet_topup: Wallet,
      payout: TrendingDown,
      refund: ArrowDownLeft
    };
    const Icon = icons[type] || DollarSign;
    return Icon;
  };

  const getTypeColor = (type) => {
    const colors = {
      booking_payment: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      wallet_topup: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      payout: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
      refund: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
    };
    return colors[type] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
      completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      failed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
      refunded: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
    };
    return colors[status] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      stripe: CreditCard,
      wallet: Wallet,
      cash: DollarSign
    };
    const Icon = icons[method] || DollarSign;
    return Icon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading transaction details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/transactions')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Transactions
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-900 mb-2">Error Loading Transaction</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/transactions')}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Transactions
          </button>
          <div className="bg-white rounded-xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Not Found</h3>
            <p className="text-gray-600">The requested transaction could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const typeColor = getTypeColor(transaction.transaction_type);
  const statusColor = getStatusColor(transaction.transaction_status);
  const TypeIcon = getTypeIcon(transaction.transaction_type);
  const PaymentIcon = getPaymentMethodIcon(transaction.payment_method);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/admin/transactions')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Transactions
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction Details</h1>
              </div>
              <p className="text-gray-600 font-mono ml-16">ID: {transaction._id}</p>
            </div>
            <div className={`px-4 py-2 ${statusColor.bg} ${statusColor.border} border rounded-xl`}>
              <p className={`text-sm font-semibold ${statusColor.text} uppercase tracking-wide`}>
                {transaction.transaction_status}
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Type & Amount Card */}
        <div className={`${typeColor.bg} ${typeColor.border} border rounded-xl p-6 mb-6`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 ${typeColor.bg} rounded-xl`}>
                <TypeIcon className={`w-8 h-8 ${typeColor.text}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Transaction Type</p>
                <p className={`text-2xl font-bold ${typeColor.text} capitalize`}>
                  {transaction.transaction_type.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">₹{transaction.amount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Method */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <PaymentIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Payment Method</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">{transaction.payment_method}</p>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Transaction Date</h3>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(transaction.created_at).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Amount Breakdown</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">₹{transaction.amount.toLocaleString('en-IN')}</span>
            </div>
            {transaction.platform_fee && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Platform Fee:</span>
                <span className="text-xl font-semibold text-green-600">₹{transaction.platform_fee.toLocaleString('en-IN')}</span>
              </div>
            )}
            {transaction.servicer_earnings && (
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-700 font-medium">Servicer Earnings:</span>
                <span className="text-xl font-semibold text-blue-600">₹{transaction.servicer_earnings.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Related Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Related Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">User ID</p>
                <p className="font-mono text-gray-900">{transaction.user_id}</p>
              </div>
            </div>

            {transaction.booking_id && (
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Booking ID</p>
                  <p className="font-mono text-gray-900">{transaction.booking_id}</p>
                </div>
              </div>
            )}

            {transaction.servicer_id && (
              <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-orange-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Servicer ID</p>
                  <p className="font-mono text-gray-900">{transaction.servicer_id}</p>
                </div>
              </div>
            )}

            {transaction.stripe_payment_intent_id && (
              <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-indigo-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Stripe Payment Intent</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{transaction.stripe_payment_intent_id}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gray-100 rounded-xl">
              <Calendar className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Timeline</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                  <div className="w-0.5 h-12 bg-blue-300 mt-2"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">Transaction Created</p>
                    <p className="text-sm text-gray-600 mt-1">Transaction was initiated</p>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {new Date(transaction.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600 mt-1">Transaction status was updated</p>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {new Date(transaction.updated_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTransactionDetails;