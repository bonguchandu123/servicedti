import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Upload, X, CheckCircle, XCircle, AlertTriangle, Clock, Camera } from 'lucide-react';

const ReportBookingIssuePage = ({ bookingId, onNavigate }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [bookingIssueForm, setBookingIssueForm] = useState({
    issue_type: '',
    description: '',
    evidence_images: [],
    resolution_expected: ''
  });

  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch booking');
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Error:', err);
      setResult({
        success: false,
        error: 'Failed to load booking details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = [...bookingIssueForm.evidence_images, ...files].slice(0, 5);
    
    setBookingIssueForm(prev => ({
      ...prev,
      evidence_images: newFiles
    }));

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls].slice(0, 5));
  };

  const removeFile = (index) => {
    // Revoke old preview URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setBookingIssueForm(prev => ({
      ...prev,
      evidence_images: prev.evidence_images.filter((_, i) => i !== index)
    }));
    
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleReportBookingIssue = async () => {
    if (
      !bookingIssueForm.issue_type ||
      !bookingIssueForm.description.trim() ||
      !bookingIssueForm.resolution_expected.trim()
    ) {
      alert('Please select issue type, resolution, and provide description');
      return;
    }

    setReportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('issue_type', bookingIssueForm.issue_type);
      formData.append('description', bookingIssueForm.description);
      formData.append('resolution_expected', bookingIssueForm.resolution_expected);

      bookingIssueForm.evidence_images.forEach((file) => {
        formData.append('evidence_images', file);
      });

      const response = await fetch(
        `${API_BASE_URL}/user/bookings/${bookingId}/report-issue`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const resultData = await response.json();

      if (!response.ok) throw new Error(resultData.detail || 'Failed to report issue');

      setResult({
        success: true,
        referenceNumber: resultData.data.reference_number
      });
    } catch (err) {
      setResult({
        success: false,
        error: err.message
      });
    } finally {
      setReportLoading(false);
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

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 ${result.success ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {result.success ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.success ? 'Issue Reported Successfully' : 'Report Failed'}
              </h2>
              {result.success ? (
                <div>
                  <p className="text-gray-600 mb-2">Your booking issue has been submitted</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-blue-900">Reference Number</p>
                    <p className="text-lg font-bold text-blue-600">{result.referenceNumber}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      Please save this reference number for tracking your issue
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        Admin will review and respond within <strong>24-48 hours</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">{result.error}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate('/user/bookings')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const issueTypes = [
    { value: 'late_arrival', label: 'Late Arrival / No Show' },
    { value: 'poor_quality', label: 'Poor Quality Work' },
    { value: 'incomplete_work', label: 'Incomplete Work' },
    { value: 'unprofessional', label: 'Unprofessional Behavior' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'different_servicer', label: 'Different Servicer Arrived' },
    { value: 'damaged_property', label: 'Property Damage' },
    { value: 'overcharging', label: 'Overcharging / Hidden Fees' },
    { value: 'no_show', label: 'Servicer Did Not Show' },
    { value: 'other', label: 'Other Issue' }
  ];

  const resolutionOptions = [
    { value: 'refund', label: 'Full/Partial Refund' },
    { value: 'redo', label: 'Redo the Work' },
    { value: 'discount', label: 'Discount on Service' },
    { value: 'apology', label: 'Formal Apology' },
    { value: 'other', label: 'Other Resolution' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => onNavigate('/user/bookings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Report Booking Issue</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Report an Issue with Your Booking
            </h2>
            <p className="text-sm text-gray-600">
              Booking #{booking?.booking_number}
            </p>
          </div>

          {/* Booking Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Service:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.service_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_date}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2 font-medium text-gray-900">{booking?.booking_time}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-gray-900">₹{booking?.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={bookingIssueForm.issue_type}
                onChange={(e) => setBookingIssueForm({ ...bookingIssueForm, issue_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select issue type</option>
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={bookingIssueForm.description}
                onChange={(e) => setBookingIssueForm({ ...bookingIssueForm, description: e.target.value })}
                placeholder="Describe the issue in detail... Include what happened, when it happened, and any other relevant information."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                rows="6"
              />
              <p className="text-xs text-gray-500 mt-1">
                {bookingIssueForm.description.length} characters
              </p>
            </div>

            {/* Resolution Expected */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Resolution *
              </label>
              <select
                value={bookingIssueForm.resolution_expected}
                onChange={(e) => setBookingIssueForm({ ...bookingIssueForm, resolution_expected: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select expected resolution</option>
                {resolutionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Optional - Max 5 images)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-yellow-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="booking-evidence"
                  disabled={bookingIssueForm.evidence_images.length >= 5}
                />
                <label
                  htmlFor="booking-evidence"
                  className={`flex flex-col items-center ${
                    bookingIssueForm.evidence_images.length >= 5 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <Camera className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center">
                    Click to upload images (photos, screenshots)
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {bookingIssueForm.evidence_images.length}/5 images uploaded
                  </span>
                </label>
              </div>

              {/* Preview uploaded files */}
              {bookingIssueForm.evidence_images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bookingIssueForm.evidence_images.map((file, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={imagePreviewUrls[index]} 
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">
                💡 Tips for a successful report:
              </p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Be specific and detailed in your description</li>
                <li>• Upload clear photos as evidence if available</li>
                <li>• Include dates, times, and any relevant details</li>
                <li>• Admin will review and respond within 24-48 hours</li>
                <li>• You'll receive a reference number to track your issue</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-8">
            <button
              onClick={() => onNavigate('/user/bookings')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={reportLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleReportBookingIssue}
              className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium transition-colors"
              disabled={reportLoading}
            >
              {reportLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </span>
              ) : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBookingIssuePage;