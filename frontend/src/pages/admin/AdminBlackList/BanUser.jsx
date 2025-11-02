import React, { useState } from 'react';
import { 
  Ban, AlertTriangle, ArrowLeft, Shield, Clock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function BanUserPage({ onNavigate }) {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [banType, setBanType] = useState('temporary');
  const [durationDays, setDurationDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId || !reason) {
      alert('Please fill in all required fields');
      return;
    }

    if (!confirm(`Are you sure you want to ban this user?\n\nType: ${banType}\n${banType === 'temporary' ? `Duration: ${durationDays} days\n` : ''}Reason: ${reason}`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      if (banType === 'temporary') {
        formData.append('duration_days', durationDays.toString());
      }
      formData.append('ban_type', banType);

      const response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('User has been banned successfully');
        onNavigate('/admin/Blacklist');
      } else {
        const error = await response.json();
        alert(`Failed to ban user: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="p-3 bg-red-100 rounded-xl">
              <Ban className="text-red-600" size={28} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Ban User</h1>
          </div>
          <p className="text-slate-600 ml-16">Suspend or permanently ban a user from the platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-sm text-slate-500 mt-2">
                You can find the user ID in the Users Management section
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed reason for banning this user (e.g., 'Violating terms of service', 'Fraudulent activity', 'Harassment')..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                rows={4}
              />
            </div>

            {/* Ban Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Ban Type <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors border-slate-200">
                  <input
                    type="radio"
                    value="temporary"
                    checked={banType === 'temporary'}
                    onChange={(e) => setBanType(e.target.value)}
                    className="mt-1 mr-3 w-4 h-4 text-red-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={18} className="text-amber-600" />
                      <span className="font-semibold text-slate-900">Temporary Ban</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      User will be suspended for a specific duration and can return after the ban expires
                    </p>
                  </div>
                </label>

                <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer hover:bg-red-50 transition-colors border-slate-200">
                  <input
                    type="radio"
                    value="permanent"
                    checked={banType === 'permanent'}
                    onChange={(e) => setBanType(e.target.value)}
                    className="mt-1 mr-3 w-4 h-4 text-red-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={18} className="text-red-600" />
                      <span className="font-semibold text-red-600">Permanent Ban</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      User will be permanently banned and cannot access the platform (can be manually lifted)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Duration (only for temporary) */}
            {banType === 'temporary' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Ban Duration <span className="text-red-500">*</span>
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="14">14 Days (2 Weeks)</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                  <option value="180">180 Days (6 Months)</option>
                </select>
              </div>
            )}

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">Warning: This action has immediate effects</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>All active bookings will be cancelled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>User will be immediately locked out of their account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>User will receive an email notification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>This action will be logged in the audit trail</span>
                    </li>
                  </ul>
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
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-white disabled:opacity-50 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !userId || !reason}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Ban size={20} />
                    Ban User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">💡 Best Practices:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Always provide a clear, specific reason for the ban</li>
            <li>• Use temporary bans for first-time offenses when appropriate</li>
            <li>• Document the incident before taking action</li>
            <li>• Permanent bans should be reserved for serious violations</li>
            <li>• Bans can be lifted later from the Blacklist Management page</li>
          </ul>
        </div>
      </div>
    </div>
  );
}