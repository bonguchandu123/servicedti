import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, 
  AlertTriangle, CheckCircle, XCircle, Clock, 
  DollarSign, FileText, Shield, TrendingUp, Activity
} from 'lucide-react';

const ViewUserDetails = ({ userId, onNavigate }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/admin/users/${userId}/details`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserData(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = () => {
    onNavigate(`/admin/users/${userId}/suspend`);
  };

  const handleUnsuspendUser = async () => {
    if (!window.confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/admin/users/${userId}/unsuspend`,
        { reason: 'Suspension lifted by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('User unsuspended successfully');
      fetchUserDetails(); // Refresh data
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert(error.response?.data?.detail || 'Failed to unsuspend user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 mb-4">User not found</p>
        <button 
          onClick={() => onNavigate('/admin/users')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Users
        </button>
      </div>
    );
  }

  const stats = userData.statistics || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Users
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              {userData.profile_image_url ? (
                <img
                  src={userData.profile_image_url}
                  alt={userData.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-600" />
                </div>
              )}
              
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {userData.email}
                  </span>
                  <span className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {userData.phone}
                  </span>
                </div>
                
                {/* Status Badges */}
                <div className="flex items-center mt-3 space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    userData.role === 'servicer' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {userData.role.toUpperCase()}
                  </span>
                  
                  {stats.is_suspended && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center">
                      <XCircle className="w-4 h-4 mr-1" />
                      SUSPENDED
                    </span>
                  )}
                  
                  {userData.email_verified ? (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col space-y-2">
              {!stats.is_suspended ? (
                <button
                  onClick={handleSuspendUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Suspend User
                </button>
              ) : (
                <button
                  onClick={handleUnsuspendUser}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Unsuspend User
                </button>
              )}
              
              <button
                onClick={() => window.open(`mailto:${userData.email}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Email User
              </button>
            </div>
          </div>

          {/* Statistics Row */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_bookings || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">₹{stats.total_spent?.toFixed(0) || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Complaints</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {(stats.total_complaints_filed || 0) + (stats.total_complaints_against || 0)}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-red-600">{stats.total_warnings || 0}</p>
                </div>
                <Shield className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Account Age</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.account_age_days || 0}d</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'bookings', 'transactions', 'complaints', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <UserInfo userData={userData} />
              <WalletInfo wallet={userData.wallet} />
              {userData.is_servicer && <ServicerInfo servicer={userData.servicer_data} />}
            </div>
          )}

          {activeTab === 'bookings' && <BookingsList bookings={userData.bookings} />}
          {activeTab === 'transactions' && <TransactionsList transactions={userData.transactions} />}
          {activeTab === 'complaints' && (
            <ComplaintsSection
              filed={userData.complaints_filed}
              against={userData.complaints_against}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTimeline activities={userData.recent_activity_timeline} />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components (same as before)
const UserInfo = ({ userData }) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="text-lg font-semibold mb-4">User Information</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Address</p>
        <p className="font-medium">{userData.address_line1 || 'Not provided'}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">City</p>
        <p className="font-medium">{userData.city || 'Not provided'}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">State</p>
        <p className="font-medium">{userData.state || 'Not provided'}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">PIN Code</p>
        <p className="font-medium">{userData.pincode || 'Not provided'}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Joined Date</p>
        <p className="font-medium">
          {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Last Login</p>
        <p className="font-medium">
          {userData.last_login ? new Date(userData.last_login).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  </div>
);

const WalletInfo = ({ wallet }) => {
  if (!wallet) return null;
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-sm text-gray-600">Current Balance</p>
          <p className="text-3xl font-bold text-green-600">₹{wallet.balance?.toFixed(2) || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Earned</p>
          <p className="text-2xl font-bold text-blue-600">₹{wallet.total_earned?.toFixed(2) || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Spent</p>
          <p className="text-2xl font-bold text-red-600">₹{wallet.total_spent?.toFixed(2) || 0}</p>
        </div>
      </div>
    </div>
  );
};

const ServicerInfo = ({ servicer }) => {
  if (!servicer) return null;
  
  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Servicer Information</h3>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Verification</p>
          <p className="font-medium">{servicer.verification_status || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Rating</p>
          <p className="font-medium">{servicer.average_rating || 0} ⭐</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Jobs</p>
          <p className="font-medium">{servicer.total_jobs_completed || 0}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Experience</p>
          <p className="font-medium">{servicer.experience_years || 0} years</p>
        </div>
      </div>
    </div>
  );
};

const BookingsList = ({ bookings }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Booking History ({bookings?.length || 0})</h3>
    {(!bookings || bookings.length === 0) ? (
      <p className="text-gray-500 text-center py-8">No bookings found</p>
    ) : (
      <div className="space-y-3">
        {bookings.slice(0, 10).map((booking) => (
          <div key={booking._id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">#{booking.booking_number}</p>
                <p className="text-sm text-gray-600">{booking.service_type}</p>
                <p className="text-xs text-gray-500">With: {booking.other_party || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  booking.booking_status === 'completed' ? 'bg-green-100 text-green-800' :
                  booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {booking.booking_status}
                </span>
                <p className="text-sm font-semibold mt-1">₹{booking.total_amount}</p>
                <p className="text-xs text-gray-500">
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const TransactionsList = ({ transactions }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Recent Transactions ({transactions?.length || 0})</h3>
    {(!transactions || transactions.length === 0) ? (
      <p className="text-gray-500 text-center py-8">No transactions found</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {new Date(txn.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">{txn.transaction_type}</td>
                <td className="px-4 py-3 text-sm">{txn.payment_method}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold">₹{txn.amount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    txn.transaction_status === 'completed' ? 'bg-green-100 text-green-800' :
                    txn.transaction_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {txn.transaction_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const ComplaintsSection = ({ filed, against }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Complaints Filed ({filed?.length || 0})</h3>
      {(!filed || filed.length === 0) ? (
        <p className="text-gray-500 text-center py-4">No complaints filed</p>
      ) : (
        filed.map((complaint) => (
          <div key={complaint._id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{complaint.subject}</p>
                <p className="text-sm text-gray-600">{complaint.complaint_type}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {complaint.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-4">Complaints Against ({against?.length || 0})</h3>
      {(!against || against.length === 0) ? (
        <p className="text-gray-500 text-center py-4">No complaints against user</p>
      ) : (
        against.map((complaint) => (
          <div key={complaint._id} className="border border-red-200 rounded-lg p-4 mb-3 bg-red-50">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{complaint.subject}</p>
                <p className="text-sm text-gray-600">{complaint.complaint_type}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {complaint.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const ActivityTimeline = ({ activities }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Recent Activity Timeline</h3>
    {(!activities || activities.length === 0) ? (
      <p className="text-gray-500 text-center py-8">No recent activity</p>
    ) : (
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start border-l-2 border-gray-300 pl-4 pb-4">
            <div className="flex-shrink-0 mt-1">
              {activity.type === 'booking' && <FileText className="w-5 h-5 text-blue-500" />}
              {activity.type === 'transaction' && <DollarSign className="w-5 h-5 text-green-500" />}
              {activity.type === 'complaint_filed' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {activity.type === 'admin_action' && <Shield className="w-5 h-5 text-red-500" />}
            </div>
            <div className="ml-3 flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ViewUserDetails;