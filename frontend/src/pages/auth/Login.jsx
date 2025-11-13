// ============================================
// src/pages/auth/Login.jsx - UPDATED VERSION
// ============================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { PageReveal } from '../../components/PageReveal';

// Import the dashboard components
import UserDashboard from '../user/Dashboard';
import ServicerDashboard from '../servicer/ServicerDashboard';
import AdminDashboard from '../admin/AdminDashboard';

const Login = ({ onNavigate }) => {
  const { login } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation states
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showPageReveal, setShowPageReveal] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    toast.clear();
  };

  // Handle animation completion callbacks
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
    setShowPageReveal(true);
  };

  const handlePageRevealComplete = () => {
    setShowPageReveal(false);
    
    // Now navigate to appropriate dashboard
    const role = loginSuccess.role;
    if (role === 'user') {
      onNavigate('/user/dashboard');
    } else if (role === 'servicer') {
      onNavigate('/servicer/dashboard');
    } else if (role === 'admin') {
      onNavigate('/admin/dashboard');
    }
    
    toast.success('Login successful!');
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill all fields');
      toast.error('Please fill all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Store user info and start animations
      setLoginSuccess(result.user);
      setShowLoadingScreen(true);
      // Don't set loading to false - keep button disabled during animations
    } else {
      setError(result.message || 'Login failed. Please try again.');
      toast.error(result.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  // Render the appropriate dashboard based on role
  const renderDashboard = () => {
    if (!loginSuccess) return null;
    
    const role = loginSuccess.role;
    if (role === 'user') {
      return <UserDashboard onNavigate={onNavigate} />;
    } else if (role === 'servicer') {
      return <ServicerDashboard />;
    } else if (role === 'admin') {
      return <AdminDashboard />;
    }
    return null;
  };

  // Show LoadingScreen animation after successful login
  if (showLoadingScreen) {
    return <LoadingScreen text="SERVICEAPP" onComplete={handleLoadingComplete} />;
  }

  // Show PageReveal animation with dashboard content behind it
  if (showPageReveal) {
    return (
      <PageReveal onComplete={handlePageRevealComplete}>
        {renderDashboard()}
      </PageReveal>
    );
  }

  // Regular login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Role Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs text-gray-600">
                <p className="font-semibold mb-1">Login for all roles:</p>
                <ul className="space-y-1">
                  <li>• <strong>Users:</strong> Book and manage services</li>
                  <li>• <strong>Servicers:</strong> Provide professional services</li>
                  <li>• <strong>Admins:</strong> Manage platform operations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 Service Provider Platform. All rights reserved.</p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <button
            onClick={() => onNavigate('/admin/login')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center mx-auto"
          >
            <Shield className="w-4 h-4 mr-1" />
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

