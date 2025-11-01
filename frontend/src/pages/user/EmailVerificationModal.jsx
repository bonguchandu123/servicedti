import React, { useState, useEffect } from 'react';
import { Mail, Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const EmailVerificationModal = ({ user, onClose, onVerified }) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  const handleSendVerificationEmail = async () => {
    try {
      setSendingOtp(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/send-verification-email`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpTimer(120); // 2 minutes countdown
        setSuccess(`Verification code sent to ${user?.email}. Please check your inbox.`);
      } else {
        setError(data.detail || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOtp(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('otp_code', otpCode);

      const response = await fetch(`${API_BASE_URL}/user/verify-email`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Email verified successfully! 🎉');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      } else {
        setError(data.detail || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setError('Failed to verify email. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    setError(''); // Clear error when user types
  };

  const handleResend = () => {
    setOtpCode('');
    setError('');
    setSuccess('');
    handleSendVerificationEmail();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Verify Your Email</h3>
          <p className="text-gray-600 text-sm">
            {otpSent 
              ? `Enter the 6-digit code sent to ${user?.email}`
              : 'We will send a verification code to your email'}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Send OTP Section */}
        {!otpSent ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Check your email:</strong>
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>The code will arrive within a few seconds</li>
                <li>Check your spam folder if you don't see it</li>
                <li>The code expires in {import.meta.env.VITE_OTP_EXPIRY_MINUTES || 10} minutes</li>
              </ul>
            </div>

            <button
              onClick={handleSendVerificationEmail}
              disabled={sendingOtp}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition font-medium"
            >
              {sendingOtp ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Verification Code
                </>
              )}
            </button>
          </div>
        ) : (
          /* Enter OTP Section */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-semibold"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Check your email inbox for the verification code
              </p>
            </div>

            <button
              onClick={handleVerifyEmail}
              disabled={verifyingOtp || otpCode.length !== 6}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition font-medium"
            >
              {verifyingOtp ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>

            {/* Resend Timer */}
            <div className="text-center">
              {otpTimer > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend code in{' '}
                  <span className="font-semibold text-blue-600">
                    {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline disabled:text-gray-400"
                >
                  Didn't receive the code? Resend
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Tip:</strong> If you don't see the email, check your spam/junk folder or try resending after {Math.ceil(otpTimer / 60)} minute(s).
              </p>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <button
          onClick={() => {
            setOtpSent(false);
            setOtpCode('');
            setOtpTimer(0);
            setError('');
            setSuccess('');
            onClose();
          }}
          disabled={sendingOtp || verifyingOtp}
          className="w-full mt-4 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationModal;