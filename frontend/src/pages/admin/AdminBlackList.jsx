import React, { useState, useEffect } from 'react';
import { 
  Ban, Search, Clock, CheckCircle, AlertTriangle,
  Calendar, X, Shield, Unlock, Mail, UserX, Filter
} from 'lucide-react';

const API_URL =import.meta.env.VITE_API_BASE_URL

export default function AdminBlacklist() {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    fetchBlacklist();
  }, [page]);

  const fetchBlacklist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/blacklist?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setBlacklist(data.blacklist || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const unsuspendUser = async (userId, reason) => {
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
        setShowUnsuspendModal(false);
        setSelectedEntry(null);
        fetchBlacklist();
      } else {
        alert('Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user');
    }
  };

  const suspendUser = async (userId, reason, durationDays, banType) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      if (durationDays) formData.append('duration_days', durationDays.toString());
      formData.append('ban_type', banType);

      const response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setShowBanModal(false);
        fetchBlacklist();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user');
    }
  };

  const filteredBlacklist = blacklist.filter(entry =>
    entry.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && blacklist.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-red-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading blacklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-xl">
                <Shield className="text-red-600" size={28} />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Blacklist Management</h1>
            </div>
            <p className="text-slate-600 ml-16">Manage suspended and banned users</p>
          </div>
          <button
            onClick={() => setShowBanModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <Ban size={20} />
            Ban User
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Total Banned</p>
                <p className="text-3xl font-bold text-red-900">{blacklist.length}</p>
              </div>
              <div className="p-3 bg-red-200 rounded-xl">
                <Ban className="text-red-700" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Temporary Bans</p>
                <p className="text-3xl font-bold text-amber-900">
                  {blacklist.filter(e => !e.is_permanent).length}
                </p>
              </div>
              <div className="p-3 bg-amber-200 rounded-xl">
                <Clock className="text-amber-700" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Permanent Bans</p>
                <p className="text-3xl font-bold text-orange-900">
                  {blacklist.filter(e => e.is_permanent).length}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-xl">
                <Shield className="text-orange-700" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ban Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlacklist.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          {entry.user_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{entry.user_name || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{entry.user_email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.user_type === 'servicer'
                          ? 'bg-blue-100 text-blue-700'
                          : entry.user_type === 'user'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.user_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 max-w-xs truncate">
                        {entry.reason || 'No reason provided'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.is_permanent
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.is_permanent ? 'Permanent' : 'Temporary'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {entry.ban_until ? (
                        <div>
                          <p className="text-sm text-slate-700">
                            {new Date(entry.ban_until).toLocaleDateString()}
                          </p>
                          {entry.ban_expired && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full mt-1">
                              <CheckCircle size={12} />
                              Expired
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-600 font-semibold text-sm">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowUnsuspendModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
                      >
                        <Unlock size={16} />
                        Unsuspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBlacklist.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                <Shield className="text-slate-400" size={48} />
              </div>
              <p className="text-slate-600 font-medium">No banned users found</p>
              <p className="text-sm text-slate-500 mt-1">All users are in good standing</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <div className="text-sm text-slate-600">
                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showBanModal && (
        <BanUserModal
          onClose={() => setShowBanModal(false)}
          onSubmit={suspendUser}
        />
      )}

      {showUnsuspendModal && selectedEntry && (
        <UnsuspendUserModal
          entry={selectedEntry}
          onClose={() => {
            setShowUnsuspendModal(false);
            setSelectedEntry(null);
          }}
          onSubmit={unsuspendUser}
        />
      )}
    </div>
  );
}

function BanUserModal({ onClose, onSubmit }) {
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
    setLoading(true);
    try {
      await onSubmit(userId, reason, banType === 'temporary' ? durationDays : null, banType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <Ban className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Ban User</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you banning this user?"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Ban Type</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  value="temporary"
                  checked={banType === 'temporary'}
                  onChange={(e) => setBanType(e.target.value)}
                  className="mr-3 w-4 h-4 text-red-600"
                />
                <span className="font-medium text-slate-700">Temporary Ban</span>
              </label>
              <label className="flex items-center p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  value="permanent"
                  checked={banType === 'permanent'}
                  onChange={(e) => setBanType(e.target.value)}
                  className="mr-3 w-4 h-4 text-red-600"
                />
                <span className="font-semibold text-red-600">Permanent Ban</span>
              </label>
            </div>
          </div>

          {banType === 'temporary' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
              </select>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Warning</p>
                <p>This will cancel all active bookings and prevent the user from accessing the platform.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-slate-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !userId || !reason}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Processing...' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnsuspendUserModal({ entry, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for unsuspending this user');
      return;
    }

    if (!confirm(`Are you sure you want to unsuspend ${entry.user_name}?`)) return;

    setLoading(true);
    try {
      await onSubmit(entry.user_id, reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl my-8">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Unlock className="text-green-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Unsuspend User</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* User Info */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {entry.user_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{entry.user_name}</p>
                <p className="text-sm text-slate-600">{entry.user_email}</p>
              </div>
            </div>
            <div className="text-sm text-slate-700 space-y-2 pt-3 border-t border-green-200">
              <div className="flex justify-between">
                <span className="font-medium">Ban Type:</span>
                <span>{entry.is_permanent ? 'Permanent' : 'Temporary'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Reason:</span>
                <span className="text-right max-w-[200px] truncate">{entry.reason}</span>
              </div>
              {entry.ban_until && (
                <div className="flex justify-between">
                  <span className="font-medium">Expires:</span>
                  <span>{new Date(entry.ban_until).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Unsuspending */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Unsuspending <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this user's suspension is being lifted (e.g., 'Appeal approved', 'Served suspension period', 'Mistake in initial ban')..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
              rows={4}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">What happens next:</p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>User will be removed from blacklist</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Account access will be restored</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>User will receive notification via email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Action will be logged for audit</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-slate-200 p-6 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              <Unlock size={20} />
              {loading ? 'Processing...' : 'Unsuspend User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}