import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Upload, X, Check, FileText,
  AlertTriangle, Shield, ThumbsDown, Clock, DollarSign, User
} from 'lucide-react';

const ComplaintCreate = ({ onNavigate }) => {
  // Custom navigation instead of react-router
  const navigate = onNavigate || ((path) => window.location.href = path);
  
  // Get state from window history or create empty object
  const location = {
    state: window.history.state || {},
    search: window.location.search
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [servicers, setServicers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const  API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

  // Pre-filled from navigation state
  const preFilledData = location.state || {};

  const [formData, setFormData] = useState({
    complaint_against_id: preFilledData.servicer_id || '',
    complaint_against_type: 'servicer',
    booking_id: preFilledData.booking_id || '',
    complaint_type: '',
    subject: '',
    description: '',
    severity: 'medium',
    refund_requested: false,
    refund_amount: 0
  });

  // Also read from URL params as fallback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const servicerId = params.get('servicer_id');
    const bookingId = params.get('booking_id');
    
    if (servicerId || bookingId) {
      setFormData(prev => ({
        ...prev,
        complaint_against_id: servicerId || prev.complaint_against_id,
        booking_id: bookingId || prev.booking_id
      }));
    }
  }, []);

  const complaintTypes = [
    { value: 'poor_service', label: 'Poor Service Quality', icon: ThumbsDown, color: 'orange' },
    { value: 'late_arrival', label: 'Late Arrival / No Show', icon: Clock, color: 'red' },
    { value: 'unprofessional', label: 'Unprofessional Behavior', icon: User, color: 'purple' },
    { value: 'overcharging', label: 'Overcharging / Price Issue', icon: DollarSign, color: 'green' },
    { value: 'incomplete_work', label: 'Incomplete / Poor Work', icon: AlertTriangle, color: 'yellow' },
    { value: 'damage', label: 'Property Damage', icon: AlertCircle, color: 'red' },
    { value: 'fraud', label: 'Fraud / Scam', icon: Shield, color: 'red' },
    { value: 'safety_concern', label: 'Safety Concern', icon: Shield, color: 'red' },
    { value: 'harassment', label: 'Harassment', icon: AlertCircle, color: 'red' },
    { value: 'other', label: 'Other', icon: FileText, color: 'gray' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'green', description: 'Minor inconvenience' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Significant issue' },
    { value: 'high', label: 'High', color: 'orange', description: 'Major problem' },
    { value: 'critical', label: 'Critical', color: 'red', description: 'Urgent action needed' }
  ];

  useEffect(() => {
    fetchServicers();
    fetchBookings();
  }, []);

  const fetchServicers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/servicers/search`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setServicers(data.servicers || []);
    } catch (err) {
      console.error('Error fetching servicers:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/bookings?status=completed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedImages.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'refund_requested') {
          submitFormData.append(key, formData[key] ? 'true' : 'false');
        } else if (formData[key]) {
          submitFormData.append(key, formData[key]);
        }
      });

      // Add images
      selectedImages.forEach((image) => {
        submitFormData.append('evidence_images', image);
      });

      const response = await fetch(`${API_BASE_URL}/user/complaints/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitFormData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Complaint filed successfully! Reference: ${data.data.complaint_number}`);
        setTimeout(() => {
          navigate('/user/complaints');
        }, 2000);
      } else {
        setError(data.detail || 'Failed to file complaint');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedComplaintType = complaintTypes.find(t => t.value === formData.complaint_type);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">File a Complaint</h1>
          </div>
          <p className="text-gray-600">
            Report issues with service quality, behavior, or any other concerns. 
            Admin will review within 24 hours.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          
          {/* Servicer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Against Servicer *
            </label>
            <select
              name="complaint_against_id"
              value={formData.complaint_against_id}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select servicer...</option>
              {servicers.map(servicer => (
                <option key={servicer._id} value={servicer._id}>
                  {servicer.user_name} - {servicer.service_type || 'Service Provider'}
                </option>
              ))}
            </select>
          </div>

          {/* Related Booking (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Booking (Optional)
            </label>
            <select
              name="booking_id"
              value={formData.booking_id}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No specific booking</option>
              {bookings.map(booking => (
                <option key={booking._id} value={booking._id}>
                  #{booking.booking_number} - {booking.service_type}
                </option>
              ))}
            </select>
          </div>

          {/* Complaint Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Complaint Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {complaintTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.complaint_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, complaint_type: type.value }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isSelected ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Severity Level *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {severityLevels.map(level => {
                const isSelected = formData.severity === level.value;
                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity: level.value }))}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `border-${level.color}-500 bg-${level.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-semibold mb-1 ${
                      isSelected ? `text-${level.color}-900` : 'text-gray-700'
                    }`}>
                      {level.label}
                    </p>
                    <p className={`text-xs ${
                      isSelected ? `text-${level.color}-700` : 'text-gray-500'
                    }`}>
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              maxLength={200}
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.subject.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              maxLength={2000}
              placeholder="Provide detailed information about what happened, when it occurred, and any other relevant details..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="evidence"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
              <label
                htmlFor="evidence"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload images
                </p>
                <p className="text-xs text-gray-500">
                  Up to 5 images (JPG, PNG)
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Evidence ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refund Request */}
          <div className="border-t pt-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="refund_requested"
                name="refund_requested"
                checked={formData.refund_requested}
                onChange={handleInputChange}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="refund_requested" className="font-medium text-gray-900 cursor-pointer">
                  Request Refund
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Check this if you want a refund for this service
                </p>
              </div>
            </div>

            {formData.refund_requested && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  name="refund_amount"
                  value={formData.refund_amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>False complaints may result in account suspension</li>
                  <li>Admin will review your complaint within 24 hours</li>
                  <li>You'll be notified via app and email about updates</li>
                  <li>Both parties will have a chance to respond</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.complaint_against_id || !formData.complaint_type || !formData.subject || !formData.description}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Filing Complaint...' : 'File Complaint'}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-sm text-blue-700 mb-3">
            If you're unsure about filing a complaint or need immediate assistance:
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/user/support')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('/user/help/complaints')}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              View Guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCreate;