import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, Heart, Award, Phone, MessageCircle, X, Briefcase, Wrench, Zap, Paintbrush, Droplet, Wind, Home, Bug, Leaf, Scissors, TrendingUp } from 'lucide-react';

// Enhanced Loading Component with Multiple Animations
const SearchServicesSkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Popular Categories Skeleton */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-10 w-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>

            {/* Filter Controls Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div>
                <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
              <div>
                <div className="h-4 w-36 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded-full mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-5 w-64 bg-gray-200 rounded"></div>
          <div className="h-5 w-32 bg-gray-200 rounded"></div>
        </div>

        {/* Servicer Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Image Skeleton */}
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                <div className="absolute top-3 right-3 w-9 h-9 bg-gray-400 rounded-full"></div>
                <div className="absolute top-3 left-3 h-6 w-24 bg-gray-400 rounded-full"></div>
              </div>

              {/* Content Skeleton */}
              <div className="p-5 space-y-3">
                {/* Name */}
                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>

                {/* Service Tags */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 w-28 bg-gray-200 rounded"></div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Loading Component with Multiple Animations
const EnhancedLoading = ({ type = 'initial', message = 'Loading...' }) => {
  if (type === 'initial') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 animate-spin-slow">
              <Wrench className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-blue-600" />
              <Zap className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 text-yellow-600" />
              <Paintbrush className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 text-purple-600" />
              <Droplet className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-cyan-600" />
            </div>
            <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Search className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{message}</h3>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white rounded-full shadow-lg">
            <div className="relative">
              <Search className="w-5 h-5 text-blue-600 animate-pulse" />
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-gray-700 font-medium">Searching servicers...</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

const SearchServices = ({ onNavigate }) => {
  const [categories, setCategories] = useState([]);
  const [servicers, setServicers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showChatConfirm, setShowChatConfirm] = useState(false);
  const [showChatSecondConfirm, setShowChatSecondConfirm] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showServiceSelectModal, setShowServiceSelectModal] = useState(false);
  const [selectedServicer, setSelectedServicer] = useState(null);
  const [selectedServicerForBooking, setSelectedServicerForBooking] = useState(null);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  // Enhanced default service categories with icons
  const defaultServiceCategories = [
    {
      _id: 'plumbing',
      name: 'Plumbing',
      description: 'Pipe repairs, installations, leak fixing, and drainage solutions',
      base_price: 500,
      servicers_count: 45,
      icon: 'droplet',
      popular: true
    },
    {
      _id: 'electrical',
      name: 'Electrical Work',
      description: 'Wiring, repairs, installations, and electrical maintenance',
      base_price: 600,
      servicers_count: 38,
      icon: 'zap',
      popular: true
    },
    {
      _id: 'carpentry',
      name: 'Carpentry',
      description: 'Furniture repair, custom woodwork, and installation services',
      base_price: 700,
      servicers_count: 32,
      icon: 'briefcase',
      popular: false
    },
    {
      _id: 'painting',
      name: 'Painting',
      description: 'Interior and exterior painting, wall treatments, and finishing',
      base_price: 450,
      servicers_count: 28,
      icon: 'paintbrush',
      popular: true
    },
    {
      _id: 'cleaning',
      name: 'Home Cleaning',
      description: 'Deep cleaning, regular maintenance, and sanitization services',
      base_price: 400,
      servicers_count: 56,
      icon: 'home',
      popular: true
    },
    {
      _id: 'ac-repair',
      name: 'AC Repair & Service',
      description: 'AC installation, maintenance, gas refilling, and repairs',
      base_price: 550,
      servicers_count: 41,
      icon: 'wind',
      popular: true
    },
    {
      _id: 'appliance-repair',
      name: 'Appliance Repair',
      description: 'Washing machine, refrigerator, and other appliance repairs',
      base_price: 500,
      servicers_count: 35,
      icon: 'wrench',
      popular: false
    },
    {
      _id: 'pest-control',
      name: 'Pest Control',
      description: 'Termite control, rodent removal, and general pest management',
      base_price: 800,
      servicers_count: 22,
      icon: 'bug',
      popular: false
    },
    {
      _id: 'gardening',
      name: 'Gardening & Landscaping',
      description: 'Garden maintenance, landscaping, and plant care services',
      base_price: 600,
      servicers_count: 19,
      icon: 'leaf',
      popular: false
    },
    {
      _id: 'beauty-salon',
      name: 'Beauty & Salon Services',
      description: 'Haircut, styling, makeup, and beauty treatments at home',
      base_price: 500,
      servicers_count: 43,
      icon: 'scissors',
      popular: true
    },
    {
      _id: 'vehicle-wash',
      name: 'Vehicle Washing & Detailing',
      description: 'Car wash, bike wash, and vehicle detailing services',
      base_price: 350,
      servicers_count: 27,
      icon: 'droplet',
      popular: false
    },
    {
      _id: 'laundry',
      name: 'Laundry & Dry Cleaning',
      description: 'Washing, ironing, dry cleaning, and pickup/delivery',
      base_price: 300,
      servicers_count: 31,
      icon: 'home',
      popular: false
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
    fetchCategories();
    searchServicers();
  }, []);

  useEffect(() => {
    searchServicers();
  }, [selectedCategory, minRating, searchRadius, currentPage]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/user/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      
      // Merge API categories with default categories and add icons
      const mergedCategories = (data.categories || []).map(cat => {
        const defaultCat = defaultServiceCategories.find(dc => dc._id === cat._id || dc.name === cat.name);
        return {
          ...cat,
          icon: defaultCat?.icon || 'briefcase',
          popular: defaultCat?.popular || false
        };
      });
      
      setCategories(mergedCategories.length > 0 ? mergedCategories : defaultServiceCategories);
    } catch (err) {
      console.error('Category fetch error:', err);
      setCategories(defaultServiceCategories);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchServicers = async () => {
    setSearchLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        radius: searchRadius
      });

      if (selectedCategory && selectedCategory.trim() !== '') {
        params.append('category', selectedCategory);
      }
      if (minRating) params.append('min_rating', minRating);

      const response = await fetch(
        `${API_BASE_URL}/user/servicers/search?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to search servicers');
      }

      const data = await response.json();
      setServicers(data.servicers || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const addToFavorites = async (servicerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/favorites/${servicerId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to add to favorites');

      alert('Added to favorites!');
      searchServicers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBookNow = (servicer) => {
    const hasMultipleServices = servicer.service_categories && servicer.service_categories.length > 1;
    
    if (hasMultipleServices && !selectedCategory) {
      setSelectedServicerForBooking(servicer);
      setShowServiceSelectModal(true);
    } else {
      const categoryId = selectedCategory || 
                        (servicer.service_categories && servicer.service_categories.length > 0 
                          ? servicer.service_categories[0] 
                          : '');
      
      if (!categoryId || categoryId.trim() === '') {
        alert('Unable to determine service category. Please filter by a category first.');
        return;
      }
      
      onNavigate(`/user/bookings/create?servicer_id=${servicer._id}&category_id=${categoryId}`);
    }
  };

  const handleServiceSelect = (categoryId) => {
    if (selectedServicerForBooking && categoryId) {
      setShowServiceSelectModal(false);
      onNavigate(`/user/bookings/create?servicer_id=${selectedServicerForBooking._id}&category_id=${categoryId}`);
    }
  };

  const handlePhoneClick = (servicer) => {
    setSelectedServicer(servicer);
    setShowPhoneModal(true);
  };

  const handleChatClick = (servicer) => {
    setSelectedServicer(servicer);
    setShowChatConfirm(true);
  };

  const handleFirstChatConfirm = () => {
    setShowChatConfirm(false);
    setShowChatSecondConfirm(true);
  };

  const handleSecondChatConfirm = () => {
    setShowChatSecondConfirm(false);
    alert('Chat feature coming soon! You can contact the servicer directly via phone for now.');
  };

  const handleShowServices = (servicer) => {
    setSelectedServicer(servicer);
    setShowServicesModal(true);
  };

  // Show initial loading screen
  if (loading) {
    return <SearchServicesSkeletonLoader/>;
  }

  // Separate popular and other categories
  const popularCategories = categories.filter(cat => cat.popular);
  const otherCategories = categories.filter(cat => !cat.popular);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add CSS for animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Search Services</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              {/* Popular Categories - Quick Select */}
              {popularCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <label className="text-sm font-medium text-gray-700">Popular Services</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularCategories.map((cat) => {
                      const IconComponent = getIcon(cat.icon);
                      return (
                        <button
                          key={cat._id}
                          onClick={() => {
                            setSelectedCategory(cat._id === selectedCategory ? '' : cat._id);
                            setCurrentPage(1);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition ${
                            selectedCategory === cat._id
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-blue-300 text-gray-700'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{cat.name}</span>
                          {cat.servicers_count > 0 && (
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                              {cat.servicers_count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Categories Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    All Categories
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} ({cat.servicers_count || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => {
                      setMinRating(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius: {searchRadius} km
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={searchRadius}
                    onChange={(e) => {
                      setSearchRadius(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold">{servicers.length}</span> servicers
            {selectedCategory && (
              <span className="ml-2 text-sm">
                in <span className="font-semibold">
                  {categories.find(c => c._id === selectedCategory)?.name}
                </span>
              </span>
            )}
          </p>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Within {searchRadius} km</span>
          </div>
        </div>

        {searchLoading && <EnhancedLoading type="search" />}

        {error && !searchLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => searchServicers()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!searchLoading && servicers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicers.map((servicer) => (
              <div
                key={servicer._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  {servicer.profile_image_url && servicer.profile_image_url.trim() !== '' ? (
                    <img
                      src={servicer.profile_image_url}
                      alt={servicer.user_name || 'Service Provider'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-4xl font-bold text-white">
                        {servicer.user_name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => addToFavorites(servicer._id)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      servicer.availability_status === 'available' 
                        ? 'bg-green-100 text-green-800'
                        : servicer.availability_status === 'busy'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {servicer.availability_status === 'available' ? '✓ Available' : 
                       servicer.availability_status === 'busy' ? 'Busy' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {servicer.user_name || 'Service Provider'}
                  </h3>

                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold text-gray-900">
                        {servicer.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({servicer.total_ratings || 0} reviews)
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      <span>{servicer.total_jobs_completed || 0} jobs</span>
                    </div>
                    {servicer.distance_km && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{servicer.distance_km} km</span>
                      </div>
                    )}
                  </div>

                  {servicer.service_categories && servicer.service_categories.length > 0 ? (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {servicer.service_categories.slice(0, 2).map((catId, idx) => {
                          const cat = categories.find(c => c._id === catId);
                          if (!cat) return null;
                          const IconComponent = getIcon(cat.icon);
                          return (
                            <span
                              key={idx}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              <IconComponent className="w-3 h-3" />
                              {cat.name}
                            </span>
                          );
                        })}
                      </div>
                      {servicer.service_categories.length > 2 && (
                        <button
                          onClick={() => handleShowServices(servicer)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          +{servicer.service_categories.length - 2} more services
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 italic">No categories yet</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleBookNow(servicer)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Book Now
                    </button>
                    <button 
                      onClick={() => handlePhoneClick(servicer)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => handleChatClick(servicer)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searchLoading && servicers.length === 0 && !error && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No servicers found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search radius
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setMinRating('');
                setSearchRadius(10);
                setCurrentPage(1);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        )}

        {!searchLoading && servicers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Phone Modal */}
      {showPhoneModal && selectedServicer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
              <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedServicer.user_phone || 'Not available'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Service Provider</p>
                <p className="font-semibold text-gray-900">{selectedServicer.user_name}</p>
              </div>

              <a
                href={`tel:${selectedServicer.user_phone}`}
                className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Chat Confirmation Modal 1 */}
      {showChatConfirm && selectedServicer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Chat?</h3>
            <p className="text-gray-600 mb-6">
              Would you like to chat with <span className="font-semibold">{selectedServicer.user_name}</span> before booking?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowChatConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                No, Cancel
              </button>
              <button
                onClick={handleFirstChatConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Confirmation Modal 2 */}
      {showChatSecondConfirm && selectedServicer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Chat</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to start a conversation with <span className="font-semibold">{selectedServicer.user_name}</span>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowChatSecondConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                No, Go Back
              </button>
              <button
                onClick={handleSecondChatConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Yes, Start Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {showServicesModal && selectedServicer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Services Provided</h3>
              <button onClick={() => setShowServicesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">{selectedServicer.user_name}</span> provides:
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedServicer.service_categories?.map((catId, idx) => {
                const cat = categories.find(c => c._id === catId);
                if (!cat) return null;
                const IconComponent = getIcon(cat.icon);
                return (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                      <span className="text-sm text-blue-600 font-semibold">₹{cat.base_price}</span>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-gray-600 mt-2 ml-10">{cat.description}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowServicesModal(false)}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Service Selection Modal for Booking */}
      {showServiceSelectModal && selectedServicerForBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Select Service</h3>
              <button onClick={() => setShowServiceSelectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Choose which service you want to book with <span className="font-semibold">{selectedServicerForBooking.user_name}</span>:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedServicerForBooking.service_categories?.map((catId, idx) => {
                const cat = categories.find(c => c._id === catId);
                if (!cat) return null;
                const IconComponent = getIcon(cat.icon);
                return (
                  <button
                    key={idx}
                    onClick={() => handleServiceSelect(catId)}
                    className="w-full p-4 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-100 transition text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs text-gray-600 mt-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-600 ml-4">₹{cat.base_price}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowServiceSelectModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchServices;