import React, { useState, useEffect } from 'react';
import { 
  Wallet, Plus, TrendingUp, TrendingDown, ArrowUpRight, 
  ArrowDownLeft, CreditCard, Clock, CheckCircle, XCircle, 
  Download, RefreshCw, Info, AlertCircle, Lock 
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_URL =`${import.meta.env.VITE_API_BASE_URL}`;

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const WalletSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-7 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-pulse">
          {/* Main Balance Card */}
          <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-3"></div>
                <div className="h-12 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-gray-100">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-gray-100 rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>
            <ul className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2 mt-0.5 flex-shrink-0"></div>
                  <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transactions Skeleton */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden animate-pulse">
          <div className="p-6 border-b-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-28 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full mb-1"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Payment Form Component
const PaymentForm = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('amount', amount);

      const response = await fetch(`${API_URL}/api/user/wallet/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create payment');
        
      }

      setClientSecret(data.client_secret);
    } catch (err) {
      setError(err.message);
      console.error('Payment intent error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm the payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful - confirm on backend
        await confirmPayment(paymentIntent.id);
        onSuccess();
      } else {
        setError('Payment not completed. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  const confirmPayment = async (paymentIntentId) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('payment_intent_id', paymentIntentId);

      const response = await fetch(`${API_URL}/api/payments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      throw err;
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#6b7280',
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-4 text-gray-600 font-medium">Preparing payment...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Amount to Pay</span>
            <span className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border-2 border-gray-300 rounded-lg p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center mb-4 text-xs text-gray-600">
        <Lock className="w-3 h-3 mr-1" />
        <span>Secured by Stripe - Your payment info is encrypted</span>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
          disabled={processing}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </span>
          ) : (
            `Pay ₹${amount.toFixed(2)}`
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Test Card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
        </p>
      </div>
    </form>
  );
};

// Main Wallet Component
const WalletPage = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to view wallet');
      }

      const response = await fetch(`${API_URL}/api/user/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }

      const data = await response.json();
      setWalletData(data);
    } catch (err) {
      setError(err.message);
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    const amountNum = parseFloat(amount);
    
    if (!amountNum || isNaN(amountNum)) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amountNum < 10) {
      alert('Minimum amount is ₹10');
      return;
    }

    if (amountNum > 100000) {
      alert('Maximum amount is ₹1,00,000');
      return;
    }

    setShowAddMoney(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setAmount('');
    alert('✅ Payment successful! Your wallet has been updated.');
    setTimeout(() => {
      fetchWalletData();
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setShowAddMoney(true);
  };

  const getTransactionIcon = (type) => {
    if (type === 'wallet_topup') {
      return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
    } else if (type === 'booking_payment') {
      return <ArrowUpRight className="w-5 h-5 text-red-600" />;
    }
    return <CreditCard className="w-5 h-5 text-gray-600" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        icon: CheckCircle,
        color: 'text-green-700',
        bg: 'bg-green-100',
        label: 'Completed'
      },
      pending: {
        icon: Clock,
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
        label: 'Pending'
      },
      failed: {
        icon: XCircle,
        color: 'text-red-700',
        bg: 'bg-red-100',
        label: 'Failed'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTransactionTitle = (type) => {
    const titles = {
      'wallet_topup': 'Money Added',
      'booking_payment': 'Service Payment',
      'payout': 'Withdrawal',
      'refund': 'Refund Received'
    };
    return titles[type] || 'Transaction';
  };

  if (loading) {
    return (
      <WalletSkeletonLoader/>
    );
  }

  if (error || !walletData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-center text-xl font-bold text-red-800 mb-2">
            Error Loading Wallet
          </h3>
          <p className="text-center text-red-600 mb-6">
            {error || 'Wallet not found'}
          </p>
          <button
            onClick={fetchWalletData}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
                <p className="text-sm text-gray-500">Manage your balance & transactions</p>
              </div>
            </div>
            <button
              onClick={fetchWalletData}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Available Balance</p>
                <p className="text-5xl font-bold text-gray-900 mb-1">
                  ₹{(walletData.balance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  {walletData.currency || 'INR'}
                </p>
              </div>
              <button
                onClick={() => setShowAddMoney(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span>Add Money</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Earned</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{(walletData.total_earned || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Spent</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{(walletData.total_spent || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Quick Info</h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Instant refunds on cancellations</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>No payment hassle during checkout</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure & encrypted transactions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <span>Add ₹10 to ₹1,00,000 at once</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {walletData.transactions?.length || 0} transactions
                </p>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition border-2 border-gray-300">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {walletData.transactions && walletData.transactions.length > 0 ? (
              walletData.transactions.map((txn, index) => (
                <div key={txn._id || index} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        txn.transaction_type === 'wallet_topup' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(txn.transaction_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getTransactionTitle(txn.transaction_type)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {formatDate(txn.created_at)}
                        </p>
                        {txn.booking_number && (
                          <p className="text-xs text-gray-500 mt-1 font-medium">
                            Booking #{txn.booking_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-2xl font-bold mb-1 ${
                        txn.transaction_type === 'wallet_topup' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.transaction_type === 'wallet_topup' ? '+' : '-'}₹{(txn.amount || 0).toFixed(2)}
                      </p>
                      <div className="mb-1">
                        {getStatusBadge(txn.transaction_status)}
                      </div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">
                        {txn.payment_method || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Your transaction history will appear here
                </p>
                <button
                  onClick={() => setShowAddMoney(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Money to Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b-2 border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900">Add Money</h3>
              <p className="text-sm text-gray-600 mt-1">Top up your wallet balance</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold"
                    min="10"
                    max="100000"
                    step="1"
                  />
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>Min: ₹10 | Max: ₹1,00,000</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quick Select</p>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className="px-3 py-3 border-2 border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-sm font-bold"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddMoney(false);
                    setAmount('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinueToPayment}
                  disabled={!amount || parseFloat(amount) < 10}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b-2 border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900">Complete Payment</h3>
              <p className="text-sm text-gray-600 mt-1">Enter your card details securely</p>
            </div>

            <div className="p-6">
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={parseFloat(amount)}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </Elements>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;