import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, XCircle, User, Phone, Mail, MapPin, FileText, AlertCircle, Search, Image, X } from 'lucide-react';

const AdminSkeletonServiceLoader = () => {
  return (
     <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <div className="h-8 w-56 bg-gray-200 rounded"></div>
            <div className="h-4 w-72 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>

        {/* Search Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Servicer Cards Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-between items-center"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-6 w-32 bg-gray-200 rounded-full mt-3"></div>
                </div>
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const AdminVerifyServicers = () => {
  const [servicers, setServicers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServicer, setSelectedServicer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/verifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch verifications');

      const data = await response.json();
      setServicers(data.servicers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (servicerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/verifications/${servicerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch details');

      const data = await response.json();
      setSelectedServicer(data);
      setShowModal(true);
      setRejectionReason('');
    } catch (err) {
      alert('Error loading details: ' + err.message);
    }
  };

  const handleApprove = async (servicerId) => {
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
      setShowModal(false);
      setSelectedServicer(null);
      fetchPendingVerifications();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (servicerId) => {
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
      setShowModal(false);
      setSelectedServicer(null);
      setRejectionReason('');
      fetchPendingVerifications();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredServicers = servicers.filter(servicer =>
    servicer.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servicer.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servicer.user_phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <AdminSkeletonServiceLoader/>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Verify Servicers
              </h1>
              <p className="text-gray-600 mt-2">Review and approve servicer documents</p>
            </div>
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-semibold">
              {servicers.length} Pending
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Servicers List */}
        {filteredServicers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Verifications</h3>
            <p className="text-gray-600">All servicer documents have been reviewed</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredServicers.map((servicer) => (
              <div key={servicer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {servicer.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">{servicer.user_name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 min-w-0">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{servicer.user_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{servicer.user_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span>{servicer.experience_years || 0} years experience</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{servicer.service_radius_km || 10} km radius</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Pending Verification
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => viewDetails(servicer._id)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showModal && selectedServicer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Servicer Details</h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedServicer(null);
                      setRejectionReason('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{selectedServicer.user_details?.name || 'N/A'}</span></p>
                    <p className="text-sm"><span className="font-medium text-gray-700">Email:</span> <span className="text-gray-900">{selectedServicer.user_details?.email || 'N/A'}</span></p>
                    <p className="text-sm"><span className="font-medium text-gray-700">Phone:</span> <span className="text-gray-900">{selectedServicer.user_details?.phone || 'N/A'}</span></p>
                    <p className="text-sm"><span className="font-medium text-gray-700">Address:</span> <span className="text-gray-900">{selectedServicer.user_details?.address || 'N/A'}</span></p>
                  </div>
                </div>

                {/* Professional Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><span className="font-medium text-gray-700">Experience:</span> <span className="text-gray-900">{selectedServicer.experience_years || 0} years</span></p>
                    <p className="text-sm"><span className="font-medium text-gray-700">Service Radius:</span> <span className="text-gray-900">{selectedServicer.service_radius_km || 10} km</span></p>
                    {selectedServicer.bio && (
                      <p className="text-sm"><span className="font-medium text-gray-700">Bio:</span> <span className="text-gray-900">{selectedServicer.bio}</span></p>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedServicer.aadhaar_front_url && (
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Aadhaar Card (Front)
                        </p>
                        <a
                          href={selectedServicer.aadhaar_front_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm flex items-center gap-1"
                        >
                          <Image className="w-4 h-4" />
                          View Document →
                        </a>
                      </div>
                    )}
                    {selectedServicer.aadhaar_back_url && (
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Aadhaar Card (Back)
                        </p>
                        <a
                          href={selectedServicer.aadhaar_back_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm flex items-center gap-1"
                        >
                          <Image className="w-4 h-4" />
                          View Document →
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedServicer.certificate_urls && selectedServicer.certificate_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        Professional Certificates ({selectedServicer.certificate_urls.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedServicer.certificate_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-gray-200 rounded p-3 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-sm text-center transition-colors"
                          >
                            Certificate {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedServicer.vehicle_document_urls && selectedServicer.vehicle_document_urls.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        Vehicle Documents ({selectedServicer.vehicle_document_urls.length})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedServicer.vehicle_document_urls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-gray-200 rounded p-3 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-sm text-center transition-colors"
                          >
                            Vehicle Doc {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rejection Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">(Required if rejecting)</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter detailed reason for rejection (documents unclear, missing information, etc.)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedServicer._id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {actionLoading ? 'Processing...' : 'Approve Servicer'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedServicer._id)}
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    {actionLoading ? 'Processing...' : 'Reject Servicer'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {!rejectionReason.trim() && 'Rejection reason is required to reject'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerifyServicers;