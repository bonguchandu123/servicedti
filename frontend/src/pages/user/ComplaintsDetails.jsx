import React, { useState, useEffect } from 'react';
import { AlertCircle, MessageCircle, Clock, CheckCircle2, FileText, Image, ArrowLeft, Calendar, Tag, DollarSign } from 'lucide-react';

const ComplaintDetails = ({ complaintId, onNavigate }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/complaints/${complaintId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setComplaint(data);
    } catch (error) {
      console.error('Failed to fetch complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      resolved: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: CheckCircle2,
        label: 'Resolved'
      },
      investigating: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Clock,
        label: 'Under Investigation'
      },
      pending: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: AlertCircle,
        label: 'Pending Review'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Complaint Not Found</h2>
          <p className="text-slate-600">The complaint you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(complaint.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate && onNavigate('list')}
          className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Complaints</span>
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 hover:shadow-md transition-shadow">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-4 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.border} border flex items-center gap-2`}>
                    <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                    <span className={`text-sm font-semibold ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
                  {complaint.subject}
                </h1>
                <div className="flex items-center gap-2 text-slate-500">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-mono">{complaint.complaint_number}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Tag className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Type</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">
                    {complaint.complaint_type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Severity</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{complaint.severity}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Filed</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(complaint.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>

              {complaint.refund_requested && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Refund</p>
                    <p className="text-sm font-semibold text-emerald-600">₹{complaint.refund_amount}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            Description
          </h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
        </div>

        {/* Evidence Card */}
        {complaint.evidence_urls && complaint.evidence_urls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-slate-600" />
              Evidence Attachments
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {complaint.evidence_urls.map((url, index) => (
                <div
                  key={index}
                  className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all hover:scale-105"
                  onClick={() => setSelectedImage(url)}
                >
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium">View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Responses */}
        {complaint.responses && complaint.responses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-slate-600" />
              Admin Updates
            </h2>
            <div className="space-y-4">
              {complaint.responses.map((response, index) => (
                <div
                  key={index}
                  className="relative pl-6 pb-6 border-l-2 border-blue-200 last:border-l-0 last:pb-0"
                >
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-4 border-white"></div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-900">{response.responder_name}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(response.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{response.response_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Card */}
        {complaint.resolution && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-sm border border-emerald-200 p-8 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-900">Resolution</h2>
            </div>
            <p className="text-emerald-800 leading-relaxed mb-4">{complaint.resolution}</p>
            {complaint.action_taken && (
              <div className="pt-4 border-t border-emerald-200">
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">Action Taken:</span> {complaint.action_taken}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Evidence"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;