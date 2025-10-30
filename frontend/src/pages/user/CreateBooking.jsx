import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, Wallet, Banknote, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CreateBooking = ({ onNavigate}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const {token} = useAuth()
  
  const [servicer, setServicer] = useState(null);
  const [category, setCategory] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;
  
  const [formData, setFormData] = useState({
    booking_date: '',
    booking_time: '',
    service_location: {
      address: '',
      latitude: null,
      longitude: null
    },
    problem_description: '',
    urgency_level: 'medium',
    payment_method: 'cash'
  });

  const [servicerIdFromUrl, setServicerIdFromUrl] = useState('');
  const [categoryIdFromUrl, setCategoryIdFromUrl] = useState('');

  // Extract URL params and store them
  useEffect(() => {
    console.log('🔄 CreateBooking component mounted');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Search params:', window.location.search);
    
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('servicer_id');
    const cId = params.get('category_id');
    
    console.log('📋 Extracted Params:', { servicer_id: sId, category_id: cId });
    
    if (!sId || sId.trim() === '') {
      console.error('❌ Missing servicer_id in URL');
      setError('Missing servicer ID. Please go back and select a servicer.');
      return;
    }
    
    if (!cId || cId.trim() === '') {
      console.error('❌ Missing category_id in URL');
      setError('Missing service category. Please go back and select a service.');
      return;
    }
    
    console.log('✅ Setting IDs from URL:', { sId, cId });
    setServicerIdFromUrl(sId);
    setCategoryIdFromUrl(cId);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, booking_date: today }));

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            service_location: {
              ...prev.service_location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
          console.log('📍 Location detected:', position.coords);
        },
        (error) => console.log('⚠️ Location error:', error)
      );
    }
  }, []);

  // Fetch data when IDs change
  useEffect(() => {
    if (servicerIdFromUrl && categoryIdFromUrl) {
      console.log('🔄 Fetching data for:', { servicerIdFromUrl, categoryIdFromUrl });
      fetchServicerDetails(servicerIdFromUrl);
      fetchCategoryDetails(categoryIdFromUrl);
    } else {
      console.log('⏳ Waiting for IDs...', { servicerIdFromUrl, categoryIdFromUrl });
    }
  }, [servicerIdFromUrl, categoryIdFromUrl]);

  const fetchServicerDetails = async (id) => {
    try {
      console.log('🔄 Fetching servicer:', id);
      const response = await fetch(`${API_BASE_URL}/user/servicers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch servicer');
      }
      
      const data = await response.json();
      setServicer(data);
      console.log('✅ Servicer loaded:', data.user_name);
    } catch (err) {
      console.error('❌ Error fetching servicer:', err);
      setError('Failed to load servicer details: ' + err.message);
    }
  };

  const fetchCategoryDetails = async (id) => {
    try {
      console.log('🔄 Fetching categories, looking for:', id);
      const response = await fetch(`${API_BASE_URL}/user/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log(response.data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch categories');
      }
      
      const data = await response.json();
      console.log('📦 Categories received:', data.categories?.length || 0);
      
      const foundCategory = data.categories.find(cat => cat._id === id);
      
      if (foundCategory) {
        setCategory(foundCategory);
        console.log('✅ Category loaded:', foundCategory.name);
      } else {
        console.warn('⚠️ Category not found:', id);
        console.log('Available categories:', data.categories.map(c => ({ id: c._id, name: c.name })));
        setError(`Service category not found. Please go back and try again.`);
      }
    } catch (err) {
      console.error('❌ Error fetching category:', err);
      setError('Failed to load service category: ' + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      service_location: {
        ...prev.service_location,
        [name]: value
      }
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.booking_date) {
      setError('Please select a booking date');
      return false;
    }
    if (!formData.booking_time) {
      setError('Please select a booking time');
      return false;
    }
    if (!formData.service_location.address || formData.service_location.address.trim() === '') {
      setError('Please enter the service address');
      return false;
    }
    if (!formData.problem_description || formData.problem_description.trim() === '') {
      setError('Please describe what service you need');
      return false;
    }
    if (formData.problem_description.length < 10) {
      setError('Please provide more details about the service needed (at least 10 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingPayload = {
        servicer_id: servicerIdFromUrl,
        service_category_id: categoryIdFromUrl,
        booking_date: formData.booking_date,
        booking_time: formData.booking_time,
        service_location: {
          address: formData.service_location.address,
          latitude: formData.service_location.latitude,
          longitude: formData.service_location.longitude
        },
        problem_description: formData.problem_description,
        urgency_level: formData.urgency_level,
        payment_method: formData.payment_method
      };

      console.log('📤 Sending booking request:', bookingPayload);

      const response = await fetch(`${API_BASE_URL}/user/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });

      const data = await response.json();
      console.log('📥 Booking response:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create booking');
      }
      
      console.log('✅ Booking created successfully!');
      setSuccess(true);
      
      if (formData.payment_method === 'stripe' && data.data?.payment?.client_secret) {
        console.log('💳 Stripe payment required');
        alert('Stripe Payment Setup:\n\nPayment Intent: ' + data.data.payment.payment_intent_id + '\n\nIn a real app, Stripe payment form would appear here.');
      } else if (formData.payment_method === 'wallet') {
        console.log('👛 Wallet payment completed');
      } else if (formData.payment_method === 'cash') {
        console.log('💵 Cash payment selected');
      }
      
      setTimeout(() => {
        onNavigate('/user/bookings');
      }, 2000);

    } catch (err) {
      console.error('❌ Booking error:', err);
      const errorMessage = err.message || 'Failed to create booking. Please try again.';
      
      if (errorMessage.includes('Card payments') || 
          errorMessage.includes('Payment gateway') || 
          errorMessage.includes('Payment setup') ||
          errorMessage.includes('Payment authentication')) {
        
        setFormData(prev => ({ ...prev, payment_method: 'cash' }));
        setError(
          errorMessage + '\n\n✅ Payment method automatically changed to "Cash on Service". Please try again.'
        );
      } else {
        setError(errorMessage);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Created!</h2>
          <p className="text-gray-600 mb-2">Your service request has been sent successfully.</p>
          <p className="text-sm text-gray-500 mb-6">
            Booking #{servicer?.user_name ? `with ${servicer.user_name}` : 'confirmed'}
          </p>
          <button
            onClick={() => onNavigate('/user/bookings')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('/user/search')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create New Booking</h1>
              <p className="text-sm text-gray-600">Schedule your service</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {servicer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {servicer.user_name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{servicer.user_name}</h3>
                <p className="text-sm text-gray-600">
                  ⭐ {servicer.average_rating?.toFixed(1) || '0.0'} ({servicer.total_ratings || 0} reviews)
                </p>
              </div>
              {category && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold text-gray-900">{category.name}</p>
                  <p className="text-lg font-bold text-blue-600">₹{category.base_price}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-semibold">Error Creating Booking</p>
                <p className="text-red-700 text-sm mt-1 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                name="booking_date"
                value={formData.booking_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time *
              </label>
              <input
                type="time"
                name="booking_time"
                value={formData.booking_time}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Service Address *
            </label>
            <textarea
              name="address"
              value={formData.service_location.address}
              onChange={handleLocationChange}
              placeholder="Enter complete address where service is needed"
              required
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-2 text-xs text-gray-500 flex items-center">
              {formData.service_location.latitude && formData.service_location.longitude 
                ? '✅ Location detected automatically' 
                : '📍 We will use your current location'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Problem *
            </label>
            <textarea
              name="problem_description"
              value={formData.problem_description}
              onChange={handleInputChange}
              placeholder="Please describe the service you need in detail... (e.g., 'Need to fix leaking tap in kitchen')"
              required
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.problem_description.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency Level
            </label>
            <select
              name="urgency_level"
              value={formData.urgency_level}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low - Can wait a few days</option>
              <option value="medium">Medium - Within 1-2 days</option>
              <option value="high">High - Need it soon</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Payment Method *
            </label>
            <div className="space-y-3">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.payment_method === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={formData.payment_method === 'cash'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <Banknote className="w-5 h-5 ml-3 text-gray-600" />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Cash on Service</p>
                  <p className="text-sm text-gray-600">Pay when service is completed</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.payment_method === 'wallet' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="wallet"
                  checked={formData.payment_method === 'wallet'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <Wallet className="w-5 h-5 ml-3 text-gray-600" />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Wallet</p>
                  <p className="text-sm text-gray-600">Pay from wallet balance</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.payment_method === 'stripe' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  value="stripe"
                  checked={formData.payment_method === 'stripe'}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600"
                />
                <CreditCard className="w-5 h-5 ml-3 text-gray-600" />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">Card Payment (Stripe)</p>
                  <p className="text-sm text-gray-600">Pay securely with credit/debit card</p>
                </div>
              </label>
            </div>
          </div>

          {category && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service: {category.name}</span>
                  <span className="font-medium text-gray-900">₹{category.base_price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee (10%)</span>
                  <span className="font-medium text-gray-900">₹{(category.base_price * 0.1).toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-blue-200 pt-3 flex justify-between">
                  <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                  <span className="font-bold text-blue-600 text-2xl">₹{category.base_price}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">
                * Final amount may vary based on actual service requirements
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Booking...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirm Booking
              </span>
            )}
          </button>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">What happens next?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Servicer will review your request</li>
                  <li>You'll get a notification when accepted</li>
                  <li>Servicer will arrive at scheduled time</li>
                  <li>Service will be completed as requested</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;