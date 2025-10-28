import React, { useState, useEffect, use } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = ({ onNavigate = (path) => console.log('Navigate:', path) }) => {
  // Mock context functions - replace with your actual useAuth hook


  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(true);
  const [initialSendComplete, setInitialSendComplete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { sendOTP,tempUserData,verifyOTP} = useAuth(); 

  const email = tempUserData?.email || '';
  const role = tempUserData?.role || 'user';
  const name = tempUserData?.name || '';

  // Send OTP immediately on mount
  useEffect(() => {
    if (!email) {
      onNavigate('/signup');
      return;
    }

    sendInitialOTP();
  }, [email]);

  // Countdown timer effect
  useEffect(() => {
    if (!initialSendComplete) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialSendComplete]);

  const sendInitialOTP = async () => {
    setSendingOTP(true);
    setError('');

    try {
      const result = await sendOTP(email, 'email_verification');

      if (result.success) {
        setSuccess('Verification code sent to your email!');
        setInitialSendComplete(true);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to send verification code');
        setCanResend(true); // Allow immediate retry
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
      setCanResend(true);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    setSuccess('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      setError('Please paste only numbers');
      return;
    }

    const newOtp = pastedData.split('');
    while (newOtp.length < 6) newOtp.push('');
    setOtp(newOtp);

    const lastIndex = Math.min(pastedData.length - 1, 5);
    setTimeout(() => {
      const lastInput = document.getElementById(`otp-${lastIndex}`);
      if (lastInput) lastInput.focus();
    }, 0);
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await verifyOTP(email, otpCode);

      if (result.success) {
        setSuccess('Email verified successfully! Redirecting...');
        setTimeout(() => {
          if (role === 'servicer') {
            onNavigate('/servicer/upload-documents');
          } else {
            onNavigate('/user/dashboard');
          }
        }, 1500);
      } else {
        setError(result.message || 'Invalid verification code');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          if (firstInput) firstInput.focus();
        }, 0);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend && resendTimer > 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sendOTP(email, 'email_verification');

      if (result.success) {
        setSuccess('New code sent! Check your email.');
        setCanResend(false);
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          if (firstInput) firstInput.focus();
        }, 0);
      } else {
        setError(result.message || 'Failed to resend code');
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  // Initial loading screen
  if (sendingOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sending Verification Code</h2>
              <p className="text-gray-600 mb-6">
                We're sending a 6-digit code to<br />
                <span className="font-semibold text-indigo-600">{email}</span>
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-sm text-gray-500">Please wait...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code sent to
          </p>
          <p className="text-indigo-600 font-semibold mt-1">{email}</p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading || !!success}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || !!success || otp.join('').length !== 6}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Verified!
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend OTP */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={loading}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm disabled:opacity-50 transition"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Resend Code
              </button>
            ) : (
              <div className="inline-flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Resend in <span className="font-semibold text-indigo-600 ml-1">{resendTimer}s</span>
              </div>
            )}
          </div>

          {/* Help Box */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <p className="font-semibold mb-2">Not receiving emails?</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Check your spam/junk folder</li>
                  <li>• Ensure {email} is correct</li>
                  <li>• Code expires in 10 minutes</li>
                  <li>• Wait 60 seconds before resending</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back to Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('/signup')}
              disabled={loading}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Signup
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 Service Provider Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;