import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const AdminLogin = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user is admin
        if (data.user.role !== 'admin') {
          setError('Access denied. Admin credentials required.');
          setLoading(false);
          return;
        }

        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Success message before redirect
        console.log('✅ Admin login successful');
        
        // IMPORTANT: Force page reload to update AuthContext
        // This ensures the user state is properly loaded before navigation
        window.location.href = '/admin/dashboard';
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill credentials function (for development/demo)
  const fillDemoCredentials = () => {
    setFormData({
      email: 'admin@example.com',
      password: 'admin123'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Admin Portal
            </h2>
            <p className="text-gray-600 text-sm">
              Secure administrator access only
            </p>
          </div>

          {/* Demo Credentials Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Demo Admin Credentials</p>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Email:</strong> admin@example.com</p>
                  <p><strong>Password:</strong> admin123</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-2 w-full text-xs bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors"
            >
              Auto-fill Demo Credentials
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Login
                </>
              )}
            </button>
          </form>

          {/* Back to User Login */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={() => onNavigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to User Login
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            🔒 This is a demo admin portal. In production, use secure credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;