// pages/servicer/MyComplaints.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye } from 'lucide-react';

const ServicerComplaints = ({ onNavigate }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      // Note: You'll need to add this endpoint to backend
      const response = await fetch(`${API_BASE_URL}/servicer/complaints`, {
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-8 h-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaints Against You</h1>
          <p className="text-gray-600">Review and respond to customer complaints</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No complaints filed against you</p>
          <p className="text-sm text-gray-500 mt-2">Keep up the great work!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map(complaint => (
            <div key={complaint._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {complaint.subject}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      complaint.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{complaint.description}</p>

                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Filed: {new Date(complaint.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Severity: {complaint.severity}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(`/servicer/complaints/${complaint._id}`)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning Box */}
      <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Multiple unresolved complaints may result in account suspension. 
          Please address all concerns professionally and promptly.
        </p>
      </div>
    </div>
  );
};

export default ServicerComplaints;