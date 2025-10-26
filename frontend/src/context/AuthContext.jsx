// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [tempUserData, setTempUserData] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api';

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/user/profile`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    // Load temp user data from localStorage
    const tempData = localStorage.getItem('tempUserData');
    if (tempData) {
      try {
        setTempUserData(JSON.parse(tempData));
      } catch (error) {
        console.error('Failed to parse temp user data:', error);
        localStorage.removeItem('tempUserData');
      }
    }
    
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      // Backend expects JSON with email and password
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      
      // Clear temp user data after successful login
      localStorage.removeItem('tempUserData');
      setTempUserData(null);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', error.response?.data);
      
      // Extract error message properly
      let errorMessage = 'Login failed';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg).join(', ');
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const signup = async (userData) => {
    try {
      // Backend expects JSON
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Store temporary user data for email verification page
      const tempData = {
        email: userData.email,
        role: userData.role,
        name: userData.name
      };
      setTempUserData(tempData);
      localStorage.setItem('tempUserData', JSON.stringify(tempData));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Signup error:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Signup failed';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg).join(', ');
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const sendOTP = async (email, purpose = 'email_verification') => {
    try {
      // Backend expects JSON
      const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
        email: email,
        purpose: purpose
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'Failed to send OTP';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const verifyOTP = async (email, otpCode) => {
    try {
      // This endpoint uses FormData
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp_code', otpCode);

      const response = await axios.post(`${API_BASE_URL}/auth/verify-otp`, formData);
      
      // Clear temp user data after successful verification
      localStorage.removeItem('tempUserData');
      setTempUserData(null);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'Invalid OTP';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tempUserData');
    setTempUserData(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const config = { 
        method, 
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      if (data) config.data = data;

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('API Call Error:', error);
      
      let errorMessage = 'API request failed';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(e => e.msg).join(', ');
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    tempUserData,
    login,
    signup,
    sendOTP,
    verifyOTP,
    logout,
    apiCall,
    isAuthenticated: !!token,
    isUser: user?.role === 'user',
    isServicer: user?.role === 'servicer',
    isAdmin: user?.role === 'admin',
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;