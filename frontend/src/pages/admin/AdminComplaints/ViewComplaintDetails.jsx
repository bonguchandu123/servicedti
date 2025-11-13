import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, XCircle, AlertCircle, User, Briefcase, 
  FileText, DollarSign, MessageSquare, Shield, Mail,
  Clock, CheckCircle, Send, UserX, AlertTriangle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function ViewComplaintDetails({ complaintId, onNavigate }) {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [notes, setNotes] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

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
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status, adminNotes) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('status', status);
      if (adminNotes) formData.append('admin_notes', adminNotes);

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Status updated successfully!');
        fetchComplaintDetails();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const requestServicerResponse = async (message) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response_text', message);
      formData.append('response_type', 'servicer_request');
      formData.append('notify_both_parties', 'true');

      const response = await fetch(`${API_URL}/api/admin/complaints/${complaintId}/respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Response request sent to servicer!');
        fetchComplaintDetails();
      }
    } catch (error) {
      console.error('Error requesting response:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[severity] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
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

  const hasServicerResponse = complaint.responses?.some(r => r.responder_role === 'servicer');
  const isServicerComplaint = complaint.complaint_against_type === 'servicer';
  const servicerId = isServicerComplaint ? complaint.against_servicer_data?._id : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/admin/complaints')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Complaints
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Complaint #{complaint.complaint_number}
              </h1>
              <p className="text-gray-600 mt-1">{complaint.subject}</p>
            </div>
            {complaint.status !== 'resolved' && (
              <button
                onClick={() => onNavigate(`/admin/complaints/${complaintId}/resolve`)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Resolve Complaint
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions Bar */}
        {isServicerComplaint && servicerId && complaint.status !== 'resolved' && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Quick Actions for Servicer</p>
            <button
              onClick={() => onNavigate(`/admin/servicers/${servicerId}/suspend`)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <UserX size={16} />
              Suspend Servicer
            </button>
          </div>
        )}

        {/* Alert if servicer hasn't responded */}
        {!hasServicerResponse && complaint.status === 'pending' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Awaiting Servicer Response</p>
              <p className="text-sm text-yellow-700 mt-1">
                Before taking action, request a response from the servicer to ensure fair resolution.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b px-6">
            <div className="flex space-x-4">
              {['details', 'conversation', 'investigation'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-3">Complainant (User)</p>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{complaint.filed_by_details?.name}</p>
                      <p className="text-sm text-gray-600">{complaint.filed_by_details?.email}</p>
                      <p className="text-sm text-gray-600">{complaint.filed_by_details?.phone}</p>
                      <p className="text-xs text-blue-700 mt-2">
                        Previous complaints: {complaint.previous_complaints_count || 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-900 mb-3">
                      Accused ({complaint.complaint_against_type})
                    </p>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{complaint.against_details?.name}</p>
                      <p className="text-sm text-gray-600">{complaint.against_details?.email}</p>
                      <p className="text-sm text-gray-600">{complaint.against_details?.phone}</p>
                      <p className="text-xs text-orange-700 mt-2">
                        Total complaints: {complaint.total_complaints_against || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Complaint Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-medium">{complaint.complaint_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Severity</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(complaint.severity)}`}>
                        {complaint.severity}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                {/* Evidence */}
                {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Evidence</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {complaint.evidence_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Info */}
                {complaint.booking_details && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3">Related Booking</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Booking #</p>
                        <p className="font-medium text-blue-900">{complaint.booking_details.booking_number}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Service</p>
                        <p className="font-medium text-blue-900">{complaint.booking_details.service_type}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Amount</p>
                        <p className="font-medium text-blue-900">₹{complaint.booking_details.total_amount}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Refund Request */}
                {complaint.refund_requested && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Refund Requested</h3>
                    </div>
                    <p className="text-sm text-red-700">Amount: ₹{complaint.refund_amount || 0}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conversation' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Response Thread</h3>
                
                {complaint.responses && complaint.responses.length > 0 ? (
                  <div className="space-y-4">
                    {complaint.responses.map((response) => {
                      const isServicer = response.responder_role === 'servicer';
                      const isAdmin = response.responder_role === 'admin';
                      
                      return (
                        <div 
                          key={response._id} 
                          className={`p-4 rounded-lg border-l-4 ${
                            isServicer ? 'bg-orange-50 border-orange-400' :
                            isAdmin ? 'bg-blue-50 border-blue-400' :
                            'bg-gray-50 border-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isServicer && <Briefcase className="w-4 h-4 text-orange-600" />}
                              {isAdmin && <Shield className="w-4 h-4 text-blue-600" />}
                              <p className="font-medium text-gray-900">{response.responder_name}</p>
                              <span className={`text-xs px-2 py-1 rounded ${
                                isServicer ? 'bg-orange-100 text-orange-800' :
                                isAdmin ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {response.responder_role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(response.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{response.response_text}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No responses yet</p>
                  </div>
                )}

                {/* Add Admin Response */}
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Add Admin Message</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add a message to the conversation..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      if (notes.trim()) {
                        updateStatus(complaint.status, notes);
                        setNotes('');
                      }
                    }}
                    disabled={!notes.trim()}
                    className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send Message
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'investigation' && (
              <div className="space-y-6">
                {/* Status Update */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'investigating', 'resolved', 'rejected', 'closed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(status, null)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          complaint.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Request Servicer Response */}
                {isServicerComplaint && (
                  <div className="border-t pt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-yellow-900 mb-1">Request Servicer's Side</h3>
                          <p className="text-sm text-yellow-700 mb-3">
                            Give the servicer a chance to explain before making a decision.
                          </p>
                          {hasServicerResponse ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Servicer has responded</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-yellow-700">
                              <Clock size={16} />
                              <span className="text-sm font-medium">Awaiting servicer response</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Request servicer's response..."
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                      rows={4}
                    />
                    <button
                      onClick={() => {
                        if (requestMessage.trim()) {
                          requestServicerResponse(requestMessage);
                          setRequestMessage('');
                        }
                      }}
                      disabled={!requestMessage.trim()}
                      className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Mail size={16} />
                      Request Servicer Response
                    </button>
                  </div>
                )}

                {/* Investigation Notes */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Internal Investigation Notes</h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                    rows={4}
                  />
                  <button
                    onClick={() => {
                      if (notes.trim()) {
                        updateStatus('investigating', notes);
                        setNotes('');
                      }
                    }}
                    disabled={!notes.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save Investigation Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}