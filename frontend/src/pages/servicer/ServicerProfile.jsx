import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Camera, Briefcase, Award, DollarSign, CreditCard, Building } from 'lucide-react';


const ServicerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;
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
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/servicer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data);
      
      // Set form data
      if (data.user_details) {
        setFormData({
          name: data.user_details.name || '',
          email: data.user_details.email || '',
          phone: data.user_details.phone || '',
          address_line1: data.user_details.address_line1 || '',
          address_line2: data.user_details.address_line2 || '',
          city: data.user_details.city || '',
          state: data.user_details.state || '',
          pincode: data.user_details.pincode || '',
          bio: data.bio || '',
          experience_years: data.experience_years || 0,
          service_radius_km: data.service_radius_km || 10
        });
        
        // Set image preview from servicer profile_photo_url first, fallback to user profile_image_url
        const photoUrl = data.profile_photo_url || data.user_details.profile_image_url || null;
        if (photoUrl && !photoUrl.startsWith('http')) {
          setImagePreview(`${API_BASE_URL}${photoUrl}`);
        } else {
          setImagePreview(photoUrl);
        }
      }

      setBankDetails({
        bank_account_number: data.bank_account_number || '',
        ifsc_code: data.ifsc_code || '',
        upi_id: data.upi_id || ''
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile. Please try again.');
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
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
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Update user profile (personal details)
      const formDataToSend = new FormData();
      if (formData.name) formDataToSend.append('name', formData.name);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.address_line1) formDataToSend.append('address_line1', formData.address_line1);
      if (formData.address_line2) formDataToSend.append('address_line2', formData.address_line2);
      if (formData.city) formDataToSend.append('city', formData.city);
      if (formData.state) formDataToSend.append('state', formData.state);
      if (formData.pincode) formDataToSend.append('pincode', formData.pincode);

      const userResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!userResponse.ok) {
        throw new Error('Failed to update user profile');
      }

      // Update servicer profile (professional details)
      const servicerFormData = new FormData();
      if (formData.bio) servicerFormData.append('bio', formData.bio);
      if (formData.experience_years) servicerFormData.append('experience_years', formData.experience_years);
      if (formData.service_radius_km) servicerFormData.append('service_radius_km', formData.service_radius_km);
      if (profileImage) servicerFormData.append('profile_photo', profileImage);

      const servicerResponse = await fetch( `${API_BASE_URL}/api/servicer/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: servicerFormData
      });

      if (!servicerResponse.ok) {
        throw new Error('Failed to update servicer profile');
      }

      alert('Profile updated successfully!');
      setEditing(false);
      setProfileImage(null); // Clear the file input state
      
      // Fetch updated profile
      await fetchProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateBankDetails = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      if (bankDetails.bank_account_number) formDataToSend.append('bank_account_number', bankDetails.bank_account_number);
      if (bankDetails.ifsc_code) formDataToSend.append('ifsc_code', bankDetails.ifsc_code);
      if (bankDetails.upi_id) formDataToSend.append('upi_id', bankDetails.upi_id);

      const response = await fetch(`${API_BASE_URL}/api/servicer/bank-details`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Bank details updated successfully!');
        await fetchProfile();
      } else {
        throw new Error('Failed to update bank details');
      }
    } catch (error) {
      console.error('Error updating bank details:', error);
      alert('Failed to update bank details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
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