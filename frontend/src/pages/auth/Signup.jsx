import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Wrench, Zap, Paintbrush, Droplet, Wind, Home, Bug, Leaf, Scissors, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';


const Signup = ({ onNavigate = (path) => console.log('Navigate to:', path) }) => {
  const { signup, sendOTP } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    address_line1: '',
    city: '',
    state: '',
    pincode: '',
    selectedServices: []
  });
  
  const [serviceCategories, setServiceCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  // Enhanced default service categories with icons (fallback)
  const defaultServiceCategories = [
    {
      _id: 'temp-plumbing',
      name: 'Plumbing',
      description: 'Pipe repairs, installations, leak fixing, and drainage solutions',
      base_price: 500,
      servicers_count: 45,
      icon: 'droplet',
      popular: true
    },
    {
      _id: 'temp-electrical',
      name: 'Electrical Work',
      description: 'Wiring, repairs, installations, and electrical maintenance',
      base_price: 600,
      servicers_count: 38,
      icon: 'zap',
      popular: true
    },
    {
      _id: 'temp-carpentry',
      name: 'Carpentry',
      description: 'Furniture repair, custom woodwork, and installation services',
      base_price: 700,
      servicers_count: 32,
      icon: 'briefcase',
      popular: false
    },
    {
      _id: 'temp-painting',
      name: 'Painting',
      description: 'Interior and exterior painting, wall treatments, and finishing',
      base_price: 450,
      servicers_count: 28,
      icon: 'paintbrush',
      popular: true
    },
    {
      _id: 'temp-cleaning',
      name: 'Home Cleaning',
      description: 'Deep cleaning, regular maintenance, and sanitization services',
      base_price: 400,
      servicers_count: 56,
      icon: 'home',
      popular: true
    },
    {
      _id: 'temp-ac-repair',
      name: 'AC Repair & Service',
      description: 'AC installation, maintenance, gas refilling, and repairs',
      base_price: 550,
      servicers_count: 41,
      icon: 'wind',
      popular: true
    },
    {
      _id: 'temp-appliance-repair',
      name: 'Appliance Repair',
      description: 'Washing machine, refrigerator, and other appliance repairs',
      base_price: 500,
      servicers_count: 35,
      icon: 'wrench',
      popular: false
    },
    {
      _id: 'temp-pest-control',
      name: 'Pest Control',
      description: 'Termite control, rodent removal, and general pest management',
      base_price: 800,
      servicers_count: 22,
      icon: 'bug',
      popular: false
    },
    {
      _id: 'temp-gardening',
      name: 'Gardening & Landscaping',
      description: 'Garden maintenance, landscaping, and plant care services',
      base_price: 600,
      servicers_count: 19,
      icon: 'leaf',
      popular: false
    },
    {
      _id: 'temp-beauty-salon',
      name: 'Beauty & Salon Services',
      description: 'Haircut, styling, makeup, and beauty treatments at home',
      base_price: 500,
      servicers_count: 43,
      icon: 'scissors',
      popular: true
    }
  ];

  const getIcon = (iconName) => {
    const icons = {
      droplet: Droplet,
      zap: Zap,
      briefcase: Briefcase,
      paintbrush: Paintbrush,
      home: Home,
      wind: Wind,
      wrench: Wrench,
      bug: Bug,
      leaf: Leaf,
      scissors: Scissors
    };
    const IconComponent = icons[iconName] || Briefcase;
    return IconComponent;
  };

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const fetchServiceCategories = async () => {
    setCategoriesLoading(true);
    try {
      // Try public endpoint first (no auth needed)
      let response = await fetch(`${API_BASE_URL}/public/categories`);
      
      if (!response.ok) {
        // Fallback to user categories endpoint
        response = await fetch(`${API_BASE_URL}/user/categories`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Fetched categories:', data.categories?.length || 0);
        
        if (data.categories && data.categories.length > 0) {
          // Merge with default icons
          const categoriesWithIcons = data.categories.map(cat => {
            const defaultCat = defaultServiceCategories.find(
              dc => dc.name.toLowerCase() === cat.name.toLowerCase()
            );
            return {
              ...cat,
              icon: cat.icon || defaultCat?.icon || 'briefcase',
              popular: cat.popular !== undefined ? cat.popular : (defaultCat?.popular || false)
            };
          });
          setServiceCategories(categoriesWithIcons);
          console.log('✅ Categories loaded successfully');
        } else {
          console.warn('⚠️ No categories returned, using defaults');
          setServiceCategories(defaultServiceCategories);
        }
      } else {
        console.warn('⚠️ API failed, using default categories');
        setServiceCategories(defaultServiceCategories);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setServiceCategories(defaultServiceCategories);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleServiceToggle = (categoryId) => {
    setFormData(prev => {
      const selected = prev.selectedServices.includes(categoryId);
      return {
        ...prev,
        selectedServices: selected
          ? prev.selectedServices.filter(id => id !== categoryId)
          : [...prev.selectedServices, categoryId]
      };
    });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill all required fields');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number (min 10 digits)');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address_line1 || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill all address fields');
      return false;
    }

    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (formData.role === 'servicer' && formData.selectedServices.length === 0) {
      setError('Please select at least one service you can provide');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError('');
    } else if (step === 2 && validateStep2()) {
      if (formData.role === 'servicer') {
        setStep(3);
      } else {
        handleSubmit();
      }
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (formData.role === 'servicer' && !validateStep3()) {
      return;
    }

    setLoading(true);
    setError('');

    const signupData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      address_line1: formData.address_line1,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      ...(formData.role === 'servicer' && { 
        service_categories: formData.selectedServices 
      })
    };

    console.log('📤 Submitting signup:', {
      ...signupData,
      password: '***hidden***',
      services_count: formData.selectedServices.length
    });

    try {
      const result = await signup(signupData);

      if (result.success) {
        console.log('✅ Signup successful:', result.data);
        
        // Send OTP for email verification
        await sendOTP(formData.email, 'email_verification');
        
        // Show success message
        alert(`Account created successfully! ${
          formData.role === 'servicer' 
            ? `${result.data.data?.services_added || formData.selectedServices.length} services added.` 
            : ''
        } Please verify your email.`);
        
        onNavigate('/verify-email');
      } else {
        setError(result.message || 'Signup failed. Please try again.');
        console.error('❌ Signup failed:', result.message);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('❌ Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = serviceCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const popularCategories = filteredCategories.filter(cat => cat.popular);
  const otherCategories = filteredCategories.filter(cat => !cat.popular);

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Step 1: Basic Information';
      case 2: return 'Step 2: Address Information';
      case 3: return 'Step 3: Service Selection';
      default: return '';
    }
  };

  const totalSteps = formData.role === 'servicer' ? 3 : 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our service platform today</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              {[1, 2, 3].slice(0, totalSteps).map((stepNum, idx) => (
                <React.Fragment key={stepNum}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= stepNum ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {idx < totalSteps - 1 && (
                    <div className={`w-20 h-1 transition-all ${
                      step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-700">{getStepTitle()}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to join as *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user', selectedServices: [] })}
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.role === 'user' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="font-semibold text-gray-900">User</p>
                      <p className="text-xs text-gray-500 mt-1">Book and manage services</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'servicer' })}
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.role === 'servicer' 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="font-semibold text-gray-900">Servicer</p>
                      <p className="text-xs text-gray-500 mt-1">Provide professional services</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Next: Address Information
              </button>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address_line1"
                  required
                  value={formData.address_line1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="House/Flat No., Building Name, Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter 6-digit pincode"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {formData.role === 'servicer' ? 'Next: Service Selection' : (loading ? 'Creating...' : 'Create Account')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Service Selection */}
          {step === 3 && formData.role === 'servicer' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Services You Provide *
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the services you're qualified to offer. You can select multiple services.
                </p>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {categoriesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading categories...</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {/* Popular Services */}
                  {popularCategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-2">POPULAR</span>
                        Popular Services
                      </h4>
                      <div className="space-y-2">
                        {popularCategories.map((category) => {
                          const IconComponent = getIcon(category.icon);
                          return (
                            <div
                              key={category._id}
                              onClick={() => handleServiceToggle(category._id)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition hover:shadow-md ${
                                formData.selectedServices.includes(category._id)
                                  ? 'border-indigo-600 bg-indigo-50'
                                  : 'border-gray-300 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                                  formData.selectedServices.includes(category._id)
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300'
                                }`}>
                                  {formData.selectedServices.includes(category._id) && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div className={`p-2 rounded-lg mr-3 ${
                                  formData.selectedServices.includes(category._id)
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="font-medium text-indigo-600">₹{category.base_price}</span>
                                    {category.servicers_count > 0 && (
                                      <span>• {category.servicers_count} servicers</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other Services */}
                  {otherCategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Other Services
                      </h4>
                      <div className="space-y-2">
                        {otherCategories.map((category) => {
                          const IconComponent = getIcon(category.icon);
                          return (
                            <div
                              key={category._id}
                              onClick={() => handleServiceToggle(category._id)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition hover:shadow-md ${
                                formData.selectedServices.includes(category._id)
                                  ? 'border-indigo-600 bg-indigo-50'
                                  : 'border-gray-300 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 ${
                                  formData.selectedServices.includes(category._id)
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300'
                                }`}>
                                  {formData.selectedServices.includes(category._id) && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div className={`p-2 rounded-lg mr-3 ${
                                  formData.selectedServices.includes(category._id)
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="font-medium text-indigo-600">₹{category.base_price}</span>
                                    {category.servicers_count > 0 && (
                                      <span>• {category.servicers_count} servicers</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No services found</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              )}

              {formData.selectedServices.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">
                      {formData.selectedServices.length} service{formData.selectedServices.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || formData.selectedServices.length === 0}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Sign in
              </button>
            </p>
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

export default Signup;