import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Clock, Trash2, Image } from 'lucide-react';

const ServicerUploadDocuments = () => {
  const [documentStatus, setDocumentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const [files, setFiles] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    certificates: [],
    vehicle_documents: []
  });

  const [previews, setPreviews] = useState({
    aadhaar_front: null,
    aadhaar_back: null,
    certificates: [],
    vehicle_documents: []
  });

  useEffect(() => {
    fetchDocumentStatus();
  }, []);

  const fetchDocumentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/documents/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setDocumentStatus(data);
      
      if (data.aadhaar_front_url) {
        setPreviews(prev => ({ ...prev, aadhaar_front: data.aadhaar_front_url }));
      }
      if (data.aadhaar_back_url) {
        setPreviews(prev => ({ ...prev, aadhaar_back: data.aadhaar_back_url }));
      }
      if (data.certificate_urls) {
        setPreviews(prev => ({ ...prev, certificates: data.certificate_urls }));
      }
      if (data.vehicle_document_urls) {
        setPreviews(prev => ({ ...prev, vehicle_documents: data.vehicle_document_urls }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching status:', error);
      setLoading(false);
    }
  };

  const handleFileSelect = (e, field) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (field === 'certificates' || field === 'vehicle_documents') {
      setFiles(prev => ({ ...prev, [field]: [...prev[field], ...selectedFiles] }));
      
      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => ({
            ...prev,
            [field]: [...prev[field], reader.result]
          }));
        };
        reader.readAsDataURL(file);
      });
    } else {
      setFiles(prev => ({ ...prev, [field]: selectedFiles[0] }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(selectedFiles[0]);
    }
  };

  const removeFile = (field, index = null) => {
    if (index !== null) {
      setFiles(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
      setPreviews(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    } else {
      setFiles(prev => ({ ...prev, [field]: null }));
      setPreviews(prev => ({ ...prev, [field]: null }));
    }
  };

  const uploadDocuments = async () => {
    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();

      if (files.aadhaar_front) formData.append('aadhaar_front', files.aadhaar_front);
      if (files.aadhaar_back) formData.append('aadhaar_back', files.aadhaar_back);
      
      files.certificates.forEach(file => {
        formData.append('certificates', file);
      });
      
      files.vehicle_documents.forEach(file => {
        formData.append('vehicle_documents', file);
      });

      const response = await fetch(`${API_BASE_URL}/servicer/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Documents uploaded successfully!');
        fetchDocumentStatus();
        setFiles({
          aadhaar_front: null,
          aadhaar_back: null,
          certificates: [],
          vehicle_documents: []
        });
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        text: 'Pending Review',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
      },
      approved: {
        icon: CheckCircle,
        text: 'Approved',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${badge.className}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{badge.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasNewFiles = files.aadhaar_front || files.aadhaar_back || 
                      files.certificates.length > 0 || files.vehicle_documents.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600 mt-1">Upload your documents for verification to start accepting bookings</p>
        </div>

        {/* Status Card */}
        {documentStatus && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
              {getStatusBadge(documentStatus.verification_status)}
            </div>

            {documentStatus.verification_status === 'rejected' && documentStatus.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900">Rejection Reason</h3>
                    <p className="text-red-700 text-sm mt-1">{documentStatus.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {documentStatus.verification_status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Under Review</h3>
                    <p className="text-yellow-700 text-sm mt-1">Your documents are being reviewed. This usually takes 24-48 hours.</p>
                  </div>
                </div>
              </div>
            )}

            {documentStatus.verification_status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">Verified ✓</h3>
                    <p className="text-green-700 text-sm mt-1">Your documents have been verified. You can now accept bookings!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aadhaar Card Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aadhaar Card</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Aadhaar Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Front Side
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                {previews.aadhaar_front ? (
                  <div className="relative">
                    <img src={previews.aadhaar_front} alt="Aadhaar Front" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => removeFile('aadhaar_front')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'aadhaar_front')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Aadhaar Back */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Back Side
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                {previews.aadhaar_back ? (
                  <div className="relative">
                    <img src={previews.aadhaar_back} alt="Aadhaar Back" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => removeFile('aadhaar_back')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'aadhaar_back')}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Certificates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Certificates (Optional)</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
            <label className="cursor-pointer block">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload certificates</p>
              <p className="text-xs text-gray-500 mt-1">Upload training certificates, skill certifications, etc.</p>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'certificates')}
              />
            </label>
          </div>

          {previews.certificates.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.certificates.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Certificate ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => removeFile('certificates', index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicle Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Documents (Optional)</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors mb-4">
            <label className="cursor-pointer block">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload vehicle documents</p>
              <p className="text-xs text-gray-500 mt-1">RC, License, Insurance, etc.</p>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e, 'vehicle_documents')}
              />
            </label>
          </div>

          {previews.vehicle_documents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.vehicle_documents.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`Vehicle Doc ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => removeFile('vehicle_documents', index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button */}
        {hasNewFiles && (
          <button
            onClick={uploadDocuments}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Documents
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ServicerUploadDocuments;