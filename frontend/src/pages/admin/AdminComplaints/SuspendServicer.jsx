import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX, AlertCircle, AlertTriangle, Ban, User, Mail, Phone, Briefcase, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function SuspendServicerPage({ servicerId, onNavigate }) {
  const [servicer, setServicer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(7);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServicerDetails();
  }, [servicerId]);

  const fetchServicerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching servicer details for ID:', servicerId);
      
      const response = await fetch(`${API_URL}/api/admin/servicers/${servicerId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.detail || 'Failed to fetch servicer details');
      }
      
      const data = await response.json();
      console.log('✅ Servicer data received:', data);
      
      // Handle both direct servicer object and nested data structure
      const servicerData = data.servicer || data;
      
      setServicer(servicerData);
    } catch (error) {
      console.error('❌ Error fetching servicer details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }

    const confirmMessage = duration 
      ? `Are you sure you want to suspend this servicer for ${duration} days?`
      : 'Are you sure you want to permanently ban this servicer?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('reason', reason);
      if (duration) formData.append('duration_days', duration.toString());
      formData.append('notify_user', 'true');

      const response = await fetch(`${API_URL}/api/admin/servicers/${servicerId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Servicer suspended successfully! ${data.data?.cancelled_bookings || 0} bookings cancelled.`);
        onNavigate('/admin/verify-servicers');
      } else {
        const errorData = await response.json();
        alert(`Failed to suspend servicer: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error suspending servicer:', error);
      alert('Error suspending servicer');
    } finally {
      setSubmitting(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <h3 className="font-semibold text-red-800">Error Loading Servicer</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={() => onNavigate('/admin/verify-servicers')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Servicers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!servicer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <h3 className="font-semibold text-red-800">Servicer not found</h3>
            <button
              onClick={() => onNavigate('/admin/verify-servicers')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Servicers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract user details from nested structure
  const userDetails = servicer.user_details || {};
  const servicerName = userDetails.name || servicer.user_name || 'Unknown';
  const servicerEmail = userDetails.email || servicer.user_email || 'N/A';
  const servicerPhone = userDetails.phone || servicer.user_phone || 'N/A';
  const serviceCategories = servicer.category_details || servicer.service_categories || [];
  const joinedDate = servicer.created_at || userDetails.created_at;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/admin/verify-servicers')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Servicers
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UserX className="w-8 h-8 text-red-600" />
            Suspend Servicer
          </h1>
          <p className="text-gray-600 mt-2">Temporarily or permanently restrict servicer access</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Servicer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Servicer Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{servicerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="text-sm text-gray-700">{servicerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="text-sm text-gray-700">{servicerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Service Categories
                  </p>
                  <div className="text-sm text-gray-700">
                    {serviceCategories.length > 0 ? (
                      serviceCategories.map((cat, idx) => (
                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                          {cat.name || cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">No categories</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </p>
                  <p className="text-sm text-gray-700">
                    {joinedDate 
                      ? new Date(joinedDate).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
                {servicer.statistics && (
                  <>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                      <p className="text-lg font-bold text-gray-900">{servicer.statistics.total_bookings || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Completed</p>
                      <p className="text-lg font-bold text-green-600">{servicer.statistics.completed_bookings || 0}</p>
                    </div>
                    {servicer.statistics.complaints_count > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Complaints</p>
                        <p className="text-lg font-bold text-red-600">{servicer.statistics.complaints_count}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Suspension Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-6">Suspension Details</h3>

              <div className="space-y-6">
                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Suspension <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why the servicer is being suspended (e.g., multiple complaints, policy violations, safety concerns)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This reason will be sent to the servicer and stored in system logs
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suspension Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="7">7 Days (1 Week)</option>
                    <option value="14">14 Days (2 Weeks)</option>
                    <option value="30">30 Days (1 Month)</option>
                    <option value="60">60 Days (2 Months)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="180">180 Days (6 Months)</option>
                    <option value="">Permanent Ban</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {duration 
                      ? `Servicer will be suspended for ${duration} days and can return after the period`
                      : 'Servicer will be permanently banned from the platform'}
                  </p>
                </div>

                {/* Impact Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Suspension Impact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-700">
                        Status: <span className="font-medium text-red-600">
                          {duration ? 'Suspended' : 'Permanently Banned'}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">
                        {duration 
                          ? `Can return on: ${new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                          : 'No return date - permanent'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-700">
                        All pending bookings will be cancelled
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">
                        Users will be automatically refunded
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-2">Warning: Critical Action</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        <li>Servicer account will be immediately suspended</li>
                        <li>All pending and future bookings will be cancelled</li>
                        <li>Affected users will be refunded automatically</li>
                        <li>Servicer will be notified via email and SMS</li>
                        <li>This action is logged and cannot be undone</li>
                        <li>Only unsuspend manually after review period</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => onNavigate('/admin/verify-servicers')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspend}
                    disabled={submitting || !reason.trim()}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Suspending...
                      </>
                    ) : (
                      <>
                        <Ban className="w-5 h-5" />
                        {duration ? `Suspend for ${duration} Days` : 'Ban Permanently'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">After Suspension:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Review the servicer's appeal if submitted</li>
                    <li>Verify complaints are resolved or addressed</li>
                    <li>Check compliance with platform policies</li>
                    <li>Manually unsuspend from the servicer management page</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}