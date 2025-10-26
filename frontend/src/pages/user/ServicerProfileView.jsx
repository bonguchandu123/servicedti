import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, MapPin, Briefcase, Award, Clock, 
  CheckCircle, Phone, Mail, Heart, Calendar, 
  Shield, DollarSign, User, FileText, Car, Camera,
  TrendingUp, Package, Target, MessageCircle,
  Aperture
} from 'lucide-react';

const ServicerProfileView = ({ servicerId, onNavigate }) => {
  const [servicer, setServicer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingFavorite, setAddingFavorite] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchServicerDetails();
    checkIfFavorite();
  }, [servicerId]);

  const fetchServicerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/servicers/${servicerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch servicer details');

      const data = await response.json();
      console.log('Servicer Data:', data);
      setServicer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/user/favorites`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const isFav = data.favorites?.some(fav => fav._id === servicerId);
        setIsFavorite(isFav);
      }
    } catch (err) {
      console.error('Error checking favorites:', err);
    }
  };

  const toggleFavorite = async () => {
    setAddingFavorite(true);
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/user/favorites/${servicerId}`;
      const method = isFavorite ? 'DELETE' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to update favorite');

      setIsFavorite(!isFavorite);
      alert(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingFavorite(false);
    }
  };

  const bookServicer = () => {
    onNavigate('/user/bookings/create?servicer=' + servicerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading servicer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !servicer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Servicer not found'}</p>
            <button
              onClick={() => onNavigate('/user/search')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => onNavigate('/user/search')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                {servicer.profile_image_url ? (
                  <img
                    src={servicer.profile_image_url}
                    alt={servicer.user_name}
                    className="w-32 h-32 rounded-full mx-auto border-4 border-gray-200 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto border-4 border-gray-200 bg-blue-600 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {servicer.user_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}

                <h1 className="text-2xl font-bold text-gray-900 mt-4">
                  {servicer.user_name}
                </h1>

                {/* Verification Badge */}
                {servicer.verification_status === 'approved' && (
                  <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm mt-2">
                    <Shield className="w-4 h-4 mr-1" />
                    Verified Professional
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center mb-6 pb-6 border-b border-gray-200">
                <Star className="w-6 h-6 text-yellow-400 fill-current mr-2" />
                <span className="text-3xl font-bold text-gray-900">
                  {servicer.average_rating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-gray-500 ml-2">
                  ({servicer.total_ratings || 0} reviews)
                </span>
              </div>

              {/* Stats */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Jobs Completed</p>
                    <p className="font-semibold">{servicer.total_jobs_completed || 0}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-semibold">{servicer.experience_years || 0} years</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <Target className="w-5 h-5 mr-3 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Service Radius</p>
                    <p className="font-semibold">{servicer.service_radius_km || 10} km</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <TrendingUp className="w-5 h-5 mr-3 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="font-semibold capitalize">
                      {servicer.availability_status || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm">{servicer.user_phone}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm break-all">{servicer.user_email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={bookServicer}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center font-medium"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </button>

                <button
                  onClick={toggleFavorite}
                  disabled={addingFavorite}
                  className={`w-full px-6 py-3 rounded-lg flex items-center justify-center font-medium ${
                    isFavorite
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {addingFavorite ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                  ) : (
                    <>
                      <Heart
                        className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`}
                      />
                      {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => alert('Contact feature coming soon')}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center font-medium"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Servicer
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {servicer.bio && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  About
                </h2>
                <p className="text-gray-700 leading-relaxed">{servicer.bio}</p>
              </div>
            )}

            {/* Services & Pricing */}
            {servicer.pricing && servicer.pricing.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                  Services & Pricing
                </h2>
                <div className="space-y-4">
                  {servicer.pricing.map((price, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {price.category_name}
                        </h3>
                        {price.price_per_hour && (
                          <p className="text-sm text-gray-600">
                            ₹{price.price_per_hour} per hour
                          </p>
                        )}
                      </div>
                      {price.fixed_price && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ₹{price.fixed_price}
                          </p>
                          <p className="text-xs text-gray-500">Fixed Price</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Documents */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-purple-600" />
                Verification Documents
              </h2>
              
              <div className="space-y-4">
                {/* Aadhaar */}
                {(servicer.aadhaar_front_url || servicer.aadhaar_back_url) && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Camera className="w-5 h-5 mr-2 text-blue-600" />
                      Aadhaar Card
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {servicer.aadhaar_front_url && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Front</p>
                          <a
                            href={servicer.aadhaar_front_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition"
                          >
                            <img
                              src={servicer.aadhaar_front_url}
                              alt="Aadhaar Front"
                              className="w-full h-40 object-cover"
                            />
                          </a>
                        </div>
                      )}
                      {servicer.aadhaar_back_url && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Back</p>
                          <a
                            href={servicer.aadhaar_back_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition"
                          >
                            <img
                              src={servicer.aadhaar_back_url}
                              alt="Aadhaar Back"
                              className="w-full h-40 object-cover"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Certificates */}
                {servicer.certificate_urls && servicer.certificate_urls.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-yellow-600" />
                      Certificates ({servicer.certificate_urls.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {servicer.certificate_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition"
                        >
                          <img
                            src={url}
                            alt={`Certificate ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicle Documents */}
                {servicer.vehicle_document_urls && servicer.vehicle_document_urls.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Car className="w-5 h-5 mr-2 text-green-600" />
                      Vehicle Documents ({servicer.vehicle_document_urls.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {servicer.vehicle_document_urls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition"
                        >
                          <img
                            src={url}
                            alt={`Vehicle Doc ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {!servicer.aadhaar_front_url && !servicer.aadhaar_back_url && 
                 (!servicer.certificate_urls || servicer.certificate_urls.length === 0) &&
                 (!servicer.vehicle_document_urls || servicer.vehicle_document_urls.length === 0) && (
                  <p className="text-gray-500 text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
              </div>
            </div>

            {/* Reviews */}
            {servicer.ratings && servicer.ratings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-600" />
                  Customer Reviews ({servicer.ratings.length})
                </h2>
                <div className="space-y-4">
                  {servicer.ratings.map((rating, idx) => (
                    <div
                      key={idx}
                      className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {rating.user_name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="font-semibold text-gray-900">
                            {rating.overall_rating}
                          </span>
                        </div>
                      </div>
                      {rating.review_text && (
                        <p className="text-gray-700 leading-relaxed">
                          {rating.review_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Reviews Message */}
            {(!servicer.ratings || servicer.ratings.length === 0) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-600" />
                  Customer Reviews
                </h2>
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Be the first to book and review this servicer
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicerProfileView;