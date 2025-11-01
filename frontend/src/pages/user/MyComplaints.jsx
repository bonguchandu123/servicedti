// pages/user/MyComplaints.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

const MyComplaints = ({ onNavigate }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_BASE_URL}/user/complaints`
        : `${API_BASE_URL}/user/complaints?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'investigating':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
        <button
          onClick={() => onNavigate('/user/complaints/create')}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          + File New Complaint
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'investigating', 'resolved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No complaints found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <div
              key={complaint._id}
              onClick={() => onNavigate(`/user/complaints/${complaint._id}`)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(complaint.status)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {complaint.subject}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Type: {complaint.complaint_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>Severity: {complaint.severity}</span>
                    {complaint.servicer_name && (
                      <>
                        <span>•</span>
                        <span>Against: {complaint.servicer_name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                  {complaint.refund_requested && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Refund: ₹{complaint.refund_amount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;