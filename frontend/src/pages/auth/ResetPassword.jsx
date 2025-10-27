import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ResetPassword = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  const toast = useToast();

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email, redirect to forgot password
      onNavigate('/forgot-password');
    }
  }, [onNavigate]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('Password must contain at least one uppercase letter');
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      toast.error('Password must contain at least one lowercase letter');
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      toast.error('Password must contain at least one number');
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Backend expects FormData
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp_code', otpCode);
      formData.append('new_password', newPassword);

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
          toast.success('Password reset successful!');
        setSuccess(true);
        // Clear stored email
        localStorage.removeItem('resetEmail');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onNavigate('/login');
        }, 2000);
      } else {
        setError(data.detail || 'Failed to reset password');
        toast.error(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      console.error('Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const formData = new FormData();
      formData.append('email', email);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast.success('OTP resent to your email');
        
      }
    } catch (err) {
      toast.error('Failed to resend OTP. Please try again.');
      console.error('Resend OTP error:', err);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Password Reset Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your password has been reset successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('/forgot-password')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600">
            Enter the OTP sent to <strong>{email}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Input */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={handleResendOTP}
              className="mt-2 text-sm text-blue-600 hover:text-blue-500"
            >
              Resend OTP
            </button>
          </div>

          {/* New Password Input */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
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
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
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
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;