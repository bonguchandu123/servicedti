import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, CreditCard, Calendar, Download, Wallet, ArrowUpRight, ArrowDownRight, X, CheckCircle, AlertCircle } from 'lucide-react';

const ServicerEarningsPayouts = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    ifsc_code: '',
    account_holder_name: ''
  });
  const [upiId, setUpiId] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/servicer/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEarnings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount < 100) {
      alert('Minimum payout amount is ₹100');
      return;
    }

    if (amount > earnings.wallet_balance) {
      alert('Insufficient balance');
      return;
    }

    if (payoutMethod === 'bank_transfer') {
      if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
        alert('Please fill all bank details');
        return;
      }
    } else if (payoutMethod === 'upi') {
      if (!upiId) {
        alert('Please enter UPI ID');
        return;
      }
    }

    try {
      setRequesting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('amount_requested', amount);
      formData.append('payout_method', payoutMethod);
      
      if (payoutMethod === 'bank_transfer') {
        formData.append('bank_account_number', bankDetails.account_number);
        formData.append('ifsc_code', bankDetails.ifsc_code);
        formData.append('account_holder_name', bankDetails.account_holder_name);
      } else {
        formData.append('upi_id', upiId);
      }

      const response = await fetch('http://localhost:8000/api/servicer/payout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Payout request submitted successfully! It will be processed within 24-48 hours.');
        setShowPayoutModal(false);
        setPayoutAmount('');
        setBankDetails({
          account_number: '',
          ifsc_code: '',
          account_holder_name: ''
        });
        setUpiId('');
        fetchEarnings();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Available Balance',
      value: `₹${earnings?.wallet_balance?.toFixed(2) || '0.00'}`,
      icon: Wallet,
      color: 'emerald',
      change: '+12.5%'
    },
    {
      title: 'Total Earned',
      value: `₹${earnings?.total_earned?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      color: 'blue',
      change: '+8.2%'
    },
    {
      title: 'Pending Payouts',
      value: `₹${earnings?.pending_payouts?.toFixed(2) || '0.00'}`,
      icon: Clock,
      color: 'orange',
      change: '2 requests'
    },
    {
      title: 'This Month',
      value: `₹${earnings?.this_month_earnings?.toFixed(2) || '0.00'}`,
      icon: Calendar,
      color: 'purple',
      change: '+15.3%'
    }
  ];

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      icon: 'bg-emerald-100'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      icon: 'bg-blue-100'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      icon: 'bg-orange-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      icon: 'bg-purple-100'
    }
  };

  const sampleTransactions = [
    {
      date: 'Dec 20, 2024',
      type: 'Service Payment',
      booking: '#BK20241220001',
      status: 'Completed',
      amount: 425.00,
      isCredit: true
    },
    {
      date: 'Dec 19, 2024',
      type: 'Payout',
      booking: '-',
      status: 'Processing',
      amount: 2000.00,
      isCredit: false
    },
    {
      date: 'Dec 18, 2024',
      type: 'Service Payment',
      booking: '#BK20241218003',
      status: 'Completed',
      amount: 680.00,
      isCredit: true
    },
    {
      date: 'Dec 17, 2024',
      type: 'Service Payment',
      booking: '#BK20241217002',
      status: 'Completed',
      amount: 550.00,
      isCredit: true
    },
    {
      date: 'Dec 16, 2024',
      type: 'Service Payment',
      booking: '#BK20241216005',
      status: 'Completed',
      amount: 320.00,
      isCredit: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings & Payouts</h1>
          <p className="text-gray-600">Track your earnings and manage withdrawals</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colors = colorClasses[stat.color];
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${colors.icon} p-3 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Request Payout Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-3">
                <Wallet className="w-4 h-4" />
                Available for Withdrawal
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                ₹{earnings?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
              <p className="text-gray-600 text-sm">Minimum withdrawal: ₹100</p>
            </div>
            
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={!earnings?.wallet_balance || earnings.wallet_balance < 100}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Request Payout
            </button>
          </div>
        </div>

        {/* Earnings & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* This Week's Earnings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Earnings</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Completed Jobs</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-semibold text-emerald-600">₹3,240.00</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-semibold text-red-600">-₹486.00</span>
              </div>
              
              <div className="flex justify-between items-center py-3 bg-gray-50 -mx-6 px-6 mt-4">
                <span className="font-semibold text-gray-900">Net Earnings</span>
                <span className="text-xl font-bold text-emerald-600">₹2,754.00</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payout Methods</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Bank Transfer</p>
                  <p className="text-sm text-gray-600">2-3 business days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">UPI</p>
                  <p className="text-sm text-gray-600">Instant transfer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Booking</th>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sampleTransactions.map((txn, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-900">{txn.date}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{txn.type}</td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-mono">{txn.booking}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        txn.status === 'Completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {txn.status === 'Completed' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-semibold ${txn.isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {txn.isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 text-center">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Request Payout</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="100"
                  max={earnings?.wallet_balance}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Available: ₹{earnings?.wallet_balance?.toFixed(2)}
                </p>
              </div>

              {/* Payout Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payout Method
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    payoutMethod === 'bank_transfer' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payout_method"
                      value="bank_transfer"
                      checked={payoutMethod === 'bank_transfer'}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-500">2-3 business days</p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    payoutMethod === 'upi' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payout_method"
                      value="upi"
                      checked={payoutMethod === 'upi'}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">UPI</p>
                      <p className="text-xs text-gray-500">Instant transfer</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bank Details Form */}
              {payoutMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={bankDetails.account_number}
                    onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={bankDetails.ifsc_code}
                    onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={bankDetails.account_holder_name}
                    onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* UPI ID Form */}
              {payoutMethod === 'upi' && (
                <div>
                  <input
                    type="text"
                    placeholder="UPI ID (e.g., yourname@paytm)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestPayout}
                disabled={requesting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {requesting ? 'Processing...' : 'Request Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicerEarningsPayouts;