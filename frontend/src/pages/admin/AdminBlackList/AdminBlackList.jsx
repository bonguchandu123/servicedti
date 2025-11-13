import React, { useState, useEffect } from 'react';
import { 
  Ban, Search, Clock, CheckCircle, AlertTriangle,
  Calendar, Shield, Unlock, Filter
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminBlacklist({ onNavigate }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const filteredBlacklist = blacklist.filter(entry =>
    entry.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && blacklist.length === 0) {
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
            onClick={() => onNavigate('/admin/ban-user')}
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
                        onClick={() => onNavigate(`/admin/unsuspend-user/${entry.user_id}`)}
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
    </div>
  );
}