import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CheckCircle, XCircle, User, Phone, Mail, MapPin, FileText, AlertCircle, Image, Loader } from 'lucide-react';

const ViewServicerDocDetails = ({ servicerId, onNavigate }) => {
  const [servicer, setServicer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchServicerDetails();
  }, [servicerId]);

  const fetchServicerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/verifications/${servicerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch details');

      const data = await response.json();
      setServicer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this servicer?')) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/verifications/${servicerId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to approve');

      alert('Servicer approved successfully!');
      onNavigate('/admin/verify-servicers');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('rejection_reason', rejectionReason);

      const response = await fetch(`${API_BASE_URL}/admin/verifications/${servicerId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to reject');

      alert('Servicer rejected successfully!');
      onNavigate('/admin/verify-servicers');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                <div className="h-24 w-full bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !servicer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => onNavigate('/admin/verify-servicers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Verifications
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Details</h3>
            <p className="text-red-700">{error || 'Servicer not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/admin/verify-servicers')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Verifications
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Servicer Verification</h1>
              <p className="text-gray-600 mt-1">Review documents and approve or reject servicer</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {servicer.user_details?.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{servicer.user_details?.name || 'N/A'}</h2>
                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
                    <AlertCircle className="w-4 h-4" />
                    Pending Verification
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{servicer.user_details?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {servicer.user_details?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {servicer.user_details?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {servicer.user_details?.address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Professional Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Years of Experience</p>
                  <p className="text-sm font-medium text-gray-900">{servicer.experience_years || 0} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Service Radius</p>
                  <p className="text-sm font-medium text-gray-900">{servicer.service_radius_km || 10} kilometers</p>
                </div>
                {servicer.bio && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Bio</p>
                    <p className="text-sm font-medium text-gray-900">{servicer.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Uploaded Documents
              </h3>
              
              {/* Aadhaar Cards */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Identity Proof (Aadhaar Card)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {servicer.aadhaar_front_url && (
                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-gray-900">Aadhaar Card - Front</p>
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <a
                        href={servicer.aadhaar_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                      >
                        <Image className="w-4 h-4" />
                        View Document →
                      </a>
                    </div>
                  )}
                  {servicer.aadhaar_back_url && (
                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-gray-900">Aadhaar Card - Back</p>
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <a
                        href={servicer.aadhaar_back_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                      >
                        <Image className="w-4 h-4" />
                        View Document →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Certificates */}
              {servicer.certificate_urls && servicer.certificate_urls.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    Professional Certificates
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {servicer.certificate_urls.length} uploaded
                    </span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {servicer.certificate_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-2 border-gray-200 rounded-lg p-4 text-center hover:bg-green-50 hover:border-green-400 transition-colors"
                      >
                        <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">Certificate {index + 1}</p>
                        <p className="text-xs text-blue-600 mt-1">View →</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Documents */}
              {servicer.vehicle_document_urls && servicer.vehicle_document_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    Vehicle Documents
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      {servicer.vehicle_document_urls.length} uploaded
                    </span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {servicer.vehicle_document_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-2 border-gray-200 rounded-lg p-4 text-center hover:bg-purple-50 hover:border-purple-400 transition-colors"
                      >
                        <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">Vehicle Doc {index + 1}</p>
                        <p className="text-xs text-blue-600 mt-1">View →</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Rejection Reason <span className="text-red-500">(Required if rejecting)</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter detailed reason for rejection (e.g., documents unclear, missing information, invalid documents, etc.)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              {!rejectionReason.trim() && (
                <p className="text-xs text-gray-500 mt-2">
                  Rejection reason must be provided to reject this servicer
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 border-t border-gray-200 p-6">
            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Approve Servicer
                  </>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Reject Servicer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewServicerDocDetails;