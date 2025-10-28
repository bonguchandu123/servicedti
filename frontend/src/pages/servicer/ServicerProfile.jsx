import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, Briefcase, Award, DollarSign, CreditCard, Building } from 'lucide-react';

// ============= SKELETON COMPONENTS =============
const SkeletonPulse = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Profile Header Skeleton
const ProfileHeaderSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
    <div className="flex items-center gap-6">
      {/* Profile Image Skeleton */}
      <SkeletonPulse className="w-32 h-32 rounded-full flex-shrink-0" />
      
      {/* Basic Info Skeleton */}
      <div className="flex-1 space-y-3">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-5 w-64" />
        <div className="flex items-center gap-4 mt-4">
          <SkeletonPulse className="h-6 w-20" />
          <SkeletonPulse className="h-6 w-24" />
          <SkeletonPulse className="h-6 w-28 rounded-full" />
        </div>
      </div>
      
      {/* Edit Button Skeleton */}
      <SkeletonPulse className="h-12 w-36 rounded-lg" />
    </div>
  </div>
);

// Tabs Skeleton
const TabsSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
    <div className="flex border-b border-gray-200">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 px-6 py-4">
          <SkeletonPulse className="h-5 w-32 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// Form Fields Skeleton
const FormFieldSkeleton = () => (
  <div>
    <SkeletonPulse className="h-4 w-24 mb-2" />
    <SkeletonPulse className="h-10 w-full rounded-lg" />
  </div>
);

// Personal Info Tab Skeleton
const PersonalInfoSkeleton = () => (
  <div className="space-y-6">
    <SkeletonPulse className="h-7 w-48 mb-4" />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <FormFieldSkeleton key={i} />
      ))}
    </div>
    
    <FormFieldSkeleton />
    <FormFieldSkeleton />
  </div>
);

// Professional Tab Skeleton
const ProfessionalInfoSkeleton = () => (
  <div className="space-y-6">
    <SkeletonPulse className="h-7 w-48 mb-4" />
    
    <div>
      <SkeletonPulse className="h-4 w-32 mb-2" />
      <SkeletonPulse className="h-24 w-full rounded-lg" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
    </div>
    
    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4">
          <SkeletonPulse className="h-4 w-24 mb-2" />
          <SkeletonPulse className="h-8 w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Banking Tab Skeleton
const BankingInfoSkeleton = () => (
  <div className="space-y-6">
    <SkeletonPulse className="h-7 w-48 mb-4" />
    <SkeletonPulse className="h-4 w-full mb-6" />
    
    <div className="space-y-6">
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <FormFieldSkeleton />
      <SkeletonPulse className="h-12 w-full rounded-lg" />
    </div>
    
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
      <SkeletonPulse className="h-4 w-full mb-2" />
      <SkeletonPulse className="h-4 w-3/4" />
    </div>
  </div>
);

// Full Page Skeleton
const ProfilePageSkeleton = () => {
  const [activeTab, setActiveTab] = useState('personal');
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <SkeletonPulse className="h-9 w-64 mb-2" />
          <SkeletonPulse className="h-5 w-96" />
        </div>

        {/* Animated Loading Indicator */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <User className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600 font-medium">Loading your profile...</p>
          <div className="flex justify-center space-x-2 mt-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Profile Header Skeleton */}
        <ProfileHeaderSkeleton />

        {/* Tabs Skeleton */}
        <TabsSkeleton />

        {/* Tab Content Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <PersonalInfoSkeleton />
        </div>
      </div>
    </div>
  );
};

// ============= MAIN COMPONENT =============
const ServicerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    bio: '',
    experience_years: 0,
    service_radius_km: 10
  });

  const [bankDetails, setBankDetails] = useState({
    bank_account_number: '',
    ifsc_code: '',
    upi_id: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockProfile = {
        user_details: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 9876543210',
          address_line1: '123 Main Street',
          address_line2: 'Apartment 4B',
          city: 'Visakhapatnam',
          state: 'Andhra Pradesh',
          pincode: '530001',
          profile_image_url: null
        },
        bio: 'Experienced AC technician with 8+ years in the industry. Specialized in all types of AC repairs and maintenance.',
        experience_years: 8,
        service_radius_km: 15,
        average_rating: 4.8,
        total_jobs_completed: 234,
        total_ratings: 189,
        verification_status: 'approved',
        bank_account_number: '1234567890',
        ifsc_code: 'SBIN0001234',
        upi_id: 'johndoe@paytm',
        profile_photo_url: null
      };

      setProfile(mockProfile);
      setFormData({
        name: mockProfile.user_details.name,
        email: mockProfile.user_details.email,
        phone: mockProfile.user_details.phone,
        address_line1: mockProfile.user_details.address_line1,
        address_line2: mockProfile.user_details.address_line2,
        city: mockProfile.user_details.city,
        state: mockProfile.user_details.state,
        pincode: mockProfile.user_details.pincode,
        bio: mockProfile.bio,
        experience_years: mockProfile.experience_years,
        service_radius_km: mockProfile.service_radius_km
      });

      setBankDetails({
        bank_account_number: mockProfile.bank_account_number,
        ifsc_code: mockProfile.ifsc_code,
        upi_id: mockProfile.upi_id
      });

      setLoading(false);
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    setTimeout(() => {
      alert('Profile updated successfully!');
      setEditing(false);
      setProfileImage(null);
      setSaving(false);
    }, 1500);
  };

  const updateBankDetails = async () => {
    setSaving(true);
    setTimeout(() => {
      alert('Bank details updated successfully!');
      setSaving(false);
    }, 1500);
  };

  // Show skeleton loading
  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load profile</p>
          <button 
            onClick={fetchProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal and professional information</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100">
                    <User className="w-16 h-16 text-blue-600" />
                  </div>
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile?.user_details?.name}</h2>
              <p className="text-gray-600 mt-1">{profile?.user_details?.email}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">{profile?.average_rating?.toFixed(1) || '0.0'} ⭐</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{profile?.total_jobs_completed || 0} Jobs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profile?.verification_status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : profile?.verification_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {profile?.verification_status?.toUpperCase() || 'NOT VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setProfileImage(null);
                    fetchProfile();
                  }}
                  disabled={saving}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'personal'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab('professional')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'professional'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Professional Details
            </button>
            <button
              onClick={() => setActiveTab('banking')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'banking'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Banking Details
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    disabled={!editing}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                  disabled={!editing}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({...formData, address_line2: e.target.value})}
                  disabled={!editing}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Professional Details Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / About Me
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!editing}
                  rows="4"
                  placeholder="Tell customers about your experience and expertise..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                    disabled={!editing}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Radius (km)
                  </label>
                  <input
                    type="number"
                    value={formData.service_radius_km}
                    onChange={(e) => setFormData({...formData, service_radius_km: parseFloat(e.target.value) || 10})}
                    disabled={!editing}
                    min="1"
                    max="50"
                    step="0.5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Jobs</p>
                  <p className="text-2xl font-bold text-blue-900">{profile?.total_jobs_completed || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-900">{profile?.average_rating?.toFixed(1) || '0.0'} ⭐</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Ratings</p>
                  <p className="text-2xl font-bold text-green-900">{profile?.total_ratings || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Banking Details Tab */}
          {activeTab === 'banking' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Banking Details</h3>
              <p className="text-gray-600 text-sm mb-6">
                Add your banking details to receive payouts directly to your account
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bank_account_number}
                    onChange={(e) => setBankDetails({...bankDetails, bank_account_number: e.target.value})}
                    placeholder="Enter your bank account number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifsc_code}
                    onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                    placeholder="Enter IFSC code"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={bankDetails.upi_id}
                    onChange={(e) => setBankDetails({...bankDetails, upi_id: e.target.value})}
                    placeholder="yourname@paytm"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={updateBankDetails}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Banking Details'}
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Your banking details are securely stored and will only be used for processing payouts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicerProfile;