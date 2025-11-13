import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, CheckCircle, 
  XCircle, Clock, CreditCard, Calendar, Hash, User,
  Building, Receipt, AlertCircle, Download, Copy, Check
} from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const TransactionDetails = ({ transactionId, onNavigate }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to view transaction details');
      }

      const response = await fetch(`${API_URL}/api/user/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setTransaction(data);
    } catch (err) {
      setError(err.message);
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: CheckCircle,
        color: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-300',
        label: 'Completed'
      },
      pending: {
        icon: Clock,
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        label: 'Pending'
      },
      failed: {
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
        border: 'border-red-300',
        label: 'Failed'
      }
    };
    return configs[status] || configs.pending;
  };

  const getTransactionTypeConfig = (type) => {
    const configs = {
      wallet_topup: {
        icon: ArrowDownLeft,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Money Added',
        sign: '+'
      },
      booking_payment: {
        icon: ArrowUpRight,
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Service Payment',
        sign: '-'
      },
      refund: {
        icon: ArrowDownLeft,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        label: 'Refund Received',
        sign: '+'
      },
      payout: {
        icon: ArrowUpRight,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        label: 'Withdrawal',
        sign: '-'
      }
    };
    return configs[type] || configs.booking_payment;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

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

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-center text-xl font-bold text-gray-900 mb-2">
            Error Loading Transaction
          </h3>
          <p className="text-center text-gray-600 mb-6">
            {error || 'Transaction not found'}
          </p>
          <button
            onClick={() => onNavigate('/user/wallet')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(transaction.transaction_status);
  const typeConfig = getTransactionTypeConfig(transaction.transaction_type);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('/user/wallet')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
              <p className="text-sm text-gray-500 mt-1">View complete transaction information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Transaction Card */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
          {/* Amount Section */}
          <div className={`p-8 ${typeConfig.bg} border-b-2 border-gray-200`}>
            <div className="flex items-center justify-between">
              <div className={`w-16 h-16 ${typeConfig.bg} rounded-xl flex items-center justify-center border-2 ${typeConfig.color.replace('text', 'border')}`}>
                <TypeIcon className={`w-8 h-8 ${typeConfig.color}`} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 mb-1">{typeConfig.label}</p>
                <p className={`text-4xl font-bold ${typeConfig.color}`}>
                  {typeConfig.sign}₹{(transaction.amount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className={`p-6 ${statusConfig.bg} border-b-2 ${statusConfig.border}`}>
            <div className="flex items-center justify-center space-x-3">
              <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
              <span className={`text-lg font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Information</h3>
            <div className="space-y-4">
              {/* Transaction ID */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3 flex-1">
                  <Hash className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">Transaction ID</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{transaction._id}</p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(transaction._id)}
                  className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                  title="Copy ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Date & Time */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Date & Time</p>
                  <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-900 uppercase font-semibold">
                    {transaction.payment_method || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Booking Number (if applicable) */}
              {transaction.booking_number && (
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3 flex-1">
                    <Receipt className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Booking Number</p>
                      <p className="text-sm font-mono text-gray-900">{transaction.booking_number}</p>
                    </div>
                  </div>
                  {transaction.booking_id && (
                    <button
                      onClick={() => onNavigate(`/user/bookings/${transaction.booking_id}`)}
                      className="ml-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      View Booking
                    </button>
                  )}
                </div>
              )}

              {/* Description (if any) */}
              {transaction.description && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-900">{transaction.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('/user/wallet')}
            className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-gray-700"
          >
            Back to Wallet
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download Receipt</span>
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-700 mb-3">
                If you have any questions about this transaction or need assistance, please contact our support team.
              </p>
              <button
                onClick={() => onNavigate('/user/complaints/create')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Report an Issue →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;