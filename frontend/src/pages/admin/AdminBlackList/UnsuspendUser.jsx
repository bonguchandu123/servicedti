import React, { useState, useEffect } from 'react';
import { 
  Unlock, ArrowLeft, Mail, Calendar, Shield, AlertCircle, CheckCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function UnsuspendUserPage({ userId, onNavigate }) {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/blacklist?page=1&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      const user = data.blacklist?.find(entry => entry.user_id === userId);
      
      if (user) {
        setUserDetails(user);
      } else {
        alert('User not found in blacklist');
        onNavigate('/admin/Blacklist');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      alert('Failed to load user details');
      onNavigate('/admin/Blacklist');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for unsuspending this user');
      return;
    }

    if (!confirm(`Are you sure you want to unsuspend ${userDetails?.user_name}?\n\nThis will restore their account access immediately.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('notify_user', 'true');

      const response = await fetch(`${API_URL}/api/admin/users/${userId}/unsuspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('User has been unsuspended successfully');
        onNavigate('/admin/Blacklist');
      } else {
        const error = await response.json();
        alert(`Failed to unsuspend user: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-green-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('/admin/Blacklist')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Blacklist
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-xl">
              <Unlock className="text-green-600" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Unsuspend User</h1>
          </div>
          <p className="text-slate-600 ml-16">Restore access for a suspended user</p>
        </div>

        {/* User Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                {userDetails.user_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {userDetails.user_name || 'Unknown User'}
                </h2>
                <p className="text-slate-600 flex items-center gap-2 mb-3">
                  <Mail size={16} />
                  {userDetails.user_email || 'No email'}
                </p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userDetails.user_type === 'servicer'
                      ? 'bg-blue-100 text-blue-700'
                      : userDetails.user_type === 'user'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {userDetails.user_type || 'Unknown'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    userDetails.is_permanent
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {userDetails.is_permanent ? 'Permanent Ban' : 'Temporary Ban'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ban Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">Banned On</span>
                </div>
                <p className="text-slate-900 font-semibold">
                  {new Date(userDetails.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {userDetails.ban_until && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">Ban Expires</span>
                  </div>
                  <div>
                    <p className="text-slate-900 font-semibold">
                      {new Date(userDetails.ban_until).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {userDetails.ban_expired && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full mt-1">
                        <CheckCircle size={12} />
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">Original Ban Reason</p>
                  <p className="text-sm text-red-800">
                    {userDetails.reason || 'No reason provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unsuspend Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Reason Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reason for Unsuspending <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this user's suspension is being lifted (e.g., 'Appeal approved', 'Served suspension period', 'Mistake in initial ban', 'User showed remorse and promised to follow guidelines')..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                rows={4}
              />
              <p className="text-sm text-slate-500 mt-2">
                This reason will be logged and included in the notification email to the user
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Mail className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">What happens when you unsuspend:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>User will be immediately removed from the blacklist</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Full account access will be restored instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>User will receive a notification email with the reason</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>User can immediately create new bookings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Action will be logged in the audit trail</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Please Note</p>
                  <p>Make sure you have reviewed the case thoroughly before unsuspending. The user will regain full platform access immediately.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-50 border-t border-slate-200 p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/admin/Blacklist')}
                disabled={submitting}
                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-white disabled:opacity-50 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !reason.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Unsuspend User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800 font-medium mb-2">✅ Best Practices:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Always provide a clear explanation for the unsuspension</li>
            <li>• Review the original ban reason before proceeding</li>
            <li>• Consider if the user has learned from the suspension</li>
            <li>• Document any appeals or additional context</li>
            <li>• Monitor the user's activity after restoration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}