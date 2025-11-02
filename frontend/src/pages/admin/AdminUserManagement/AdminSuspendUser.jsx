import React, { useState, useEffect } from 'react';
import { UserX, AlertCircle, Ban, ArrowLeft, Users, Search, Eye, Lock, Unlock, Filter, Mail, Phone, MapPin, Calendar, DollarSign, ShoppingBag, X } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Suspend User Page Component
const SuspendUserPage = ({ onNavigate, onBack }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [durationType, setDurationType] = useState('temporary');
  const [duration, setDuration] = useState(7);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Extract userId from URL path like /admin/users/{userId}/suspend
    const pathParts = window.location.pathname.split('/');
    const userIdFromPath = pathParts[3]; // /admin/users/{userId}/suspend
    setUserId(userIdFromPath);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    if (reason.length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    if (!confirm(`Are you sure you want to ${durationType === 'permanent' ? 'permanently ban' : 'suspend'} this user?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      formData.append('ban_type', durationType === 'permanent' ? 'permanent' : 'temporary');
      if (durationType === 'temporary') {
        formData.append('duration_days', duration.toString());
      }
      formData.append('notify_user', 'true');

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to suspend user');

      const data = await response.json();
      alert(data.message || 'User suspended successfully!');
      
      if (onNavigate) {
        onNavigate('/admin/users');
      } else if (onBack) {
        onBack();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-gray-200 rounded"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading User</h2>
            <p className="text-red-700 mb-4">{error || 'User not found'}</p>
            <button
              onClick={() => onNavigate ? onNavigate('/admin/users') : onBack()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate ? onNavigate('/admin/users') : onBack()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex items-center gap-3">
            <UserX className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Suspend User</h1>
              <p className="text-gray-600 mt-1">Temporarily or permanently restrict user access</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{user.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium text-gray-900">{user.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">City:</span>
                    <span className="ml-2 font-medium text-gray-900">{user.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <span className="ml-2 font-medium text-gray-900">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suspension Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Type <span className="text-red-600">*</span>
              </label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="temporary">Temporary Suspension</option>
                <option value="permanent">Permanent Ban</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {durationType === 'temporary' 
                  ? 'User will be suspended for a specified duration' 
                  : 'User will be permanently banned from the platform'}
              </p>
            </div>

            {/* Duration (if temporary) */}
            {durationType === 'temporary' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Duration <span className="text-red-600">*</span>
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="14">14 Days (2 Weeks)</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="90">90 Days (3 Months)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Suspension will automatically expire after the selected duration
                </p>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a detailed explanation for this suspension. This will be visible to the user and logged for audit purposes."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={5}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">Minimum 10 characters required</p>
                <p className="text-sm text-gray-500">{reason.length} characters</p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">
                    {durationType === 'permanent' ? 'Permanent Ban Warning' : 'Suspension Warning'}
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>User will be immediately {durationType === 'permanent' ? 'banned' : 'suspended'} from accessing the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>All active bookings will be cancelled automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>User will receive an email notification with the reason</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>This action will be logged in the audit trail</span>
                    </li>
                    {durationType === 'permanent' && (
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
                        <span className="font-semibold">This action cannot be automatically reversed</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate ? onNavigate('/admin/users') : onBack()}
                disabled={submitting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={submitting || !reason.trim() || reason.length < 10}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Ban className="w-5 h-5" />
                {submitting 
                  ? 'Processing...' 
                  : durationType === 'permanent' 
                    ? 'Permanently Ban User' 
                    : `Suspend for ${duration} Day${duration !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendUserPage;