import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, AlertTriangle, DollarSign, Ban, UserX } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ResolveComplaint({ complaintId, onNavigate }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [resolution, setResolution] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [banUser, setBanUser] = useState(false);
  const [banDuration, setBanDuration] = useState(7);

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setComplaint(data);
      if (data.refund_requested) {
        setRefundAmount(data.refund_amount || 0);
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim() || !actionTaken) {
      alert('Please fill in resolution summary and action taken');
      return;
    }

    if (!window.confirm('Are you sure you want to resolve this complaint? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resolution', resolution);
      formData.append('action_taken', actionTaken);
      formData.append('refund_approved', refundAmount > 0);
      if (refundAmount > 0) formData.append('refund_amount', refundAmount.toString());
      formData.append('ban_user', banUser);
      if (banUser && banDuration) formData.append('ban_duration_days', banDuration.toString());

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Complaint resolved successfully!');
        onNavigate(`/admin/complaints/${complaintId}/details`);
      } else {
        alert('Failed to resolve complaint');
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      alert('Error resolving complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <h3 className="font-semibold text-red-800">Complaint not found</h3>
            <button
              onClick={() => onNavigate('/admin/complaints')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (complaint.status === 'resolved') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
            <h3 className="font-semibold text-yellow-800">Complaint Already Resolved</h3>
            <p className="text-sm text-yellow-700 mt-2">This complaint has already been resolved</p>
            <button
              onClick={() => onNavigate(`/admin/complaints/${complaintId}/details`)}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              View Complaint Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasServicerResponse = complaint.responses?.some(r => r.responder_role === 'servicer');
  const isServicerComplaint = complaint.complaint_against_type === 'servicer';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate(`/admin/complaints/${complaintId}/details`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Complaint Details
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Resolve Complaint
          </h1>
          <p className="text-gray-600 mt-2">Complaint #{complaint.complaint_number}</p>
        </div>

        {/* Warning if no servicer response */}
        {isServicerComplaint && !hasServicerResponse && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Warning: No Servicer Response</h3>
                <p className="text-sm text-red-700">
                  It's recommended to request and review the servicer's response before taking final action.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Complaint Summary */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Complaint Summary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Filed By</p>
                  <p className="font-medium">{complaint.filed_by_details?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Against</p>
                  <p className="font-medium">{complaint.against_details?.name}</p>
                  <p className="text-xs text-gray-500">{complaint.complaint_against_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{complaint.complaint_type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Severity</p>
                  <p className="font-medium capitalize">{complaint.severity}</p>
                </div>
                {complaint.refund_requested && (
                  <div className="pt-3 border-t">
                    <p className="text-gray-500">Refund Requested</p>
                    <p className="font-bold text-lg text-red-600">₹{complaint.refund_amount || 0}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Right Column - Resolution Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-6">Final Resolution</h3>

              <div className="space-y-6">
                {/* Resolution Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how this complaint was resolved and the reasoning behind the decision..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={5}
                  />
                </div>

                {/* Action Taken */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Taken <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select action...</option>
                    <option value="no_action">No Action Required - Complaint Invalid</option>
                    <option value="warning_issued">Warning Issued to Servicer</option>
                    <option value="refund_processed">Refund Processed to User</option>
                    <option value="servicer_suspended">Servicer Suspended</option>
                    <option value="servicer_banned">Servicer Permanently Banned</option>
                    <option value="mediated_resolution">Mediated Resolution - Both Parties Agreed</option>
                    <option value="partial_refund">Partial Refund + Warning</option>
                  </select>
                </div>

                {/* Refund Section */}
                {complaint.refund_requested && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Refund Decision</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max={complaint.refund_amount || 0}
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-blue-700 mt-1">
                        Requested: ₹{complaint.refund_amount || 0}
                      </p>
                    </div>
                    {refundAmount > 0 && (
                      <div className="mt-3 bg-blue-100 p-3 rounded">
                        <p className="text-sm text-blue-800">
                          ✓ Refund of ₹{refundAmount} will be credited to user's wallet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Ban/Suspend Servicer */}
                {isServicerComplaint && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserX className="w-5 h-5 text-red-600" />
                      <h4 className="font-semibold text-red-900">Disciplinary Action</h4>
                    </div>

                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="banUser"
                        checked={banUser}
                        onChange={(e) => setBanUser(e.target.checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="banUser" className="font-medium text-red-900 cursor-pointer">
                          Suspend/Ban Servicer
                        </label>
                        <p className="text-sm text-red-700 mt-1">
                          Prevent this servicer from accepting new bookings
                        </p>
                      </div>
                    </div>

                    {banUser && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-red-900 mb-2">
                            Suspension Duration
                          </label>
                          <select
                            value={banDuration}
                            onChange={(e) => setBanDuration(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          >
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                            <option value="90">90 Days</option>
                            <option value="">Permanent Ban</option>
                          </select>
                        </div>
                        <div className="bg-red-100 p-3 rounded">
                          <div className="flex items-start gap-2">
                            <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">
                              {banDuration 
                                ? `Servicer will be suspended for ${banDuration} days` 
                                : 'Servicer will be permanently banned from the platform'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resolution Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Resolved</span>
                    </div>
                    {refundAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refund:</span>
                        <span className="font-medium text-green-600">₹{refundAmount}</span>
                      </div>
                    )}
                    {banUser && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Servicer Status:</span>
                        <span className="font-medium text-red-600">
                          {banDuration ? `Suspended ${banDuration} days` : 'Permanently Banned'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Action:</span>
                      <span className="font-medium">{actionTaken || 'Not selected'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => onNavigate(`/admin/complaints/${complaintId}/details`)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={submitting || !resolution.trim() || !actionTaken}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Resolve Complaint
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    <li>Both parties will be notified of the resolution</li>
                    <li>Refunds are processed immediately to user's wallet</li>
                    <li>Banned servicers cannot accept new bookings</li>
                    <li>All actions are logged for audit purposes</li>
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