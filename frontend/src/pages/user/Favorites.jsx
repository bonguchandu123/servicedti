import React, { useState, useEffect } from 'react';
import { Heart, Star, Award, Phone, Mail, MapPin, Trash2, Calendar, TrendingUp } from 'lucide-react';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/user/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch favorites');

      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (servicerId) => {
    if (!window.confirm('Remove this servicer from favorites?')) {
      return;
    }

    setRemovingId(servicerId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/user/favorites/${servicerId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to remove favorite');

      // Remove from local state
      setFavorites(favorites.filter(fav => fav._id !== servicerId));
      alert('Removed from favorites');
    } catch (err) {
      alert(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const bookServicer = (servicerId) => {
    // Navigate to booking page with pre-selected servicer
    window.location.href = `/user/search?servicer=${servicerId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
              <p className="text-gray-600">
                {favorites.length} saved service {favorites.length === 1 ? 'provider' : 'providers'}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg flex items-center">
              <Heart className="w-6 h-6 text-red-600 fill-current mr-2" />
              <span className="text-2xl font-bold text-gray-900">{favorites.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start adding your preferred service providers to access them quickly
            </p>
            <button
              onClick={() => window.location.href = '/user/search'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((servicer) => (
              <div
                key={servicer._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                {/* Header with Image */}
                <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600">
                  {servicer.image ? (
                    <img
                      src={servicer.image}
                      alt={servicer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-4xl font-bold text-white">
                        {servicer.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFavorite(servicer._id)}
                    disabled={removingId === servicer._id}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 group"
                  >
                    {removingId === servicer._id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                    ) : (
                      <Heart className="w-5 h-5 text-red-600 fill-current group-hover:scale-110 transition" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {servicer.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold text-gray-900">
                        {servicer.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({servicer.jobs_completed || 0} jobs)
                    </span>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {servicer.service_categories?.slice(0, 3).map((category, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {servicer.service_categories?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{servicer.service_categories.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Added Date */}
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Added {new Date(servicer.added_at).toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => bookServicer(servicer._id)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Now
                    </button>

                    <button
                      onClick={() => window.location.href = `/user/servicers/${servicer._id}`}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        {favorites.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Tip</h3>
                <p className="text-sm text-gray-700">
                  Save your frequently used service providers here for quick access. You can book them directly from this page!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Popular Servicers Suggestion */}
        {favorites.length > 0 && favorites.length < 5 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Discover More</h3>
            <p className="text-gray-600 mb-4">
              Find more highly-rated service providers in your area
            </p>
            <button
              onClick={() => window.location.href = '/user/search'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Browse Services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;