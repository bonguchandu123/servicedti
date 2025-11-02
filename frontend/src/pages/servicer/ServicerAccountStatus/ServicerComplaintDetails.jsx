import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  MessageSquare,
  Send,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const ServicerComplaintDetails = ({ complaintId, onNavigate }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    if (complaintId) {
      fetchComplaintDetails();
    }
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/servicer/complaint/${complaintId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComplaint(data);
      } else {
        console.error('Failed to fetch complaint details');
      }
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToComplaint = async () => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setSubmittingResponse(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response_text', responseText);

      const response = await fetch(
        `${API_BASE_URL}/servicer/complaint/${complaintId}/respond`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      );

      if (response.ok) {
        alert('Response submitted successfully');
        setResponseText('');
        await fetchComplaintDetails();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading complaint details...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h2>
          <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist.</p>
          <button
            onClick={() => onNavigate && onNavigate('/servicer/status')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate && onNavigate('/servicer/status')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Account Status</span>
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Complaint Details
                </h1>
                <p className="text-gray-600">#{complaint.complaint_number}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  complaint.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                  complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {complaint.status?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  complaint.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  complaint.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  complaint.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {complaint.severity?.toUpperCase()} SEVERITY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {complaint.servicer_has_responded && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-900">Response Submitted</p>
                <p className="text-sm text-purple-700">You have already responded to this complaint.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Complaint Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complaint Information</h2>
              
              {/* Subject */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 font-semibold mb-2">Subject:</p>
                <p className="text-gray-900 font-medium text-lg">{complaint.subject}</p>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 font-semibold mb-2">Description:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {/* Evidence */}
              {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Evidence Provided ({complaint.evidence_urls.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {complaint.evidence_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="rounded-lg border-2 border-gray-200 w-full h-32 object-cover hover:border-blue-400 transition-colors cursor-pointer"
                          onClick={() => window.open(url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Responses Thread */}
            {complaint.responses && complaint.responses.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Response Thread ({complaint.responses.length})
                </h2>
                <div className="space-y-4">
                  {complaint.responses.map((response, index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-4 border-2 ${
                        response.responder_type === 'admin'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-purple-50 border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            response.responder_type === 'admin'
                              ? 'bg-blue-200 text-blue-900'
                              : 'bg-purple-200 text-purple-900'
                          }`}>
                            {response.responder_type === 'admin' ? 'ADMIN' : 'YOU'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {response.responder_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-900">{response.response_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Details */}
            {complaint.status === 'resolved' && complaint.resolution_summary && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-green-900">Resolution</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-green-700 font-semibold mb-1">Resolution:</p>
                    <p className="text-green-900">{complaint.resolution_summary.resolution}</p>
                  </div>
                  {complaint.resolution_summary.action_taken && (
                    <div>
                      <p className="text-sm text-green-700 font-semibold mb-1">Action Taken:</p>
                      <p className="text-green-900">{complaint.resolution_summary.action_taken}</p>
                    </div>
                  )}
                  <p className="text-sm text-green-700">
                    Resolved on: {new Date(complaint.resolution_summary.resolved_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Response Form */}
            {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Submit Your Response
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Provide your explanation or defense. This will be visible to the complainant and admin.
                </p>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleRespondToComplaint}
                    disabled={submittingResponse || !responseText.trim()}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingResponse ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Response
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setResponseText('')}
                    disabled={submittingResponse}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Filed By */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Filed By
              </h3>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">{complaint.filed_by_name}</p>
                <p className="text-sm text-gray-600">{complaint.filed_by_email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Type
                  </p>
                  <p className="font-semibold text-gray-900">
                    {complaint.complaint_type?.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Filed On
                  </p>
                  <p className="font-semibold text-gray-900">
                    {new Date(complaint.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last Updated
                  </p>
                  <p className="font-semibold text-gray-900">
                    {new Date(complaint.updated_at || complaint.created_at).toLocaleString()}
                  </p>
                </div>

                {complaint.booking_number && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Related Booking
                    </p>
                    <p className="font-semibold text-gray-900">#{complaint.booking_number}</p>
                    {complaint.booking_service && (
                      <p className="text-sm text-gray-600 mt-1">{complaint.booking_service}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                If you need assistance with this complaint, please contact support.
              </p>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicerComplaintDetails;