import React, { useState, useEffect } from 'react';
import { Star, Filter, MessageSquare, User, Calendar, Search } from 'lucide-react';

const ServicerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchReviews();
  }, [filterRating, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filterRating 
        ? `${API_BASE_URL}/servicer/reviews?rating=${filterRating}&page=${page}&limit=10`
        : `${API_BASE_URL}/servicer/reviews?page=${page}&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setReviews(data.reviews || []);
      setTotalPages(data.pages || 1);
      
      // Calculate stats
      if (data.reviews && data.reviews.length > 0) {
        const total = data.total || data.reviews.length;
        const avgRating = data.reviews.reduce((sum, r) => sum + r.overall_rating, 0) / data.reviews.length;
        
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.reviews.forEach(r => {
          distribution[r.overall_rating] = (distribution[r.overall_rating] || 0) + 1;
        });
        
        setStats({
          averageRating: avgRating,
          totalReviews: total,
          ratingDistribution: distribution
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const handleResponseClick = (review) => {
    setSelectedReview(review);
    setResponseText(review.response_from_servicer || '');
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (!responseText.trim()) {
      alert('Please write a response');
      return;
    }

    try {
      setResponding(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('response', responseText);

      const response = await fetch(
        `${API_BASE_URL}/servicer/reviews/${selectedReview._id}/respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        alert('Response submitted successfully!');
        setShowResponseModal(false);
        setResponseText('');
        setSelectedReview(null);
        fetchReviews();
      } else {
        alert('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredReviews = reviews.filter(review => 
    review.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and respond to customer reviews</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Overall Rating Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Overall Rating</p>
            <div className="flex items-center gap-2">
              {renderStars(Math.round(stats.averageRating))}
              <span className="text-xs text-gray-500">({stats.totalReviews})</span>
            </div>
          </div>

          {/* Total Reviews Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats.totalReviews}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Total Reviews</p>
            <p className="text-xs text-gray-500">All time feedback</p>
          </div>

          {/* Response Rate Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {reviews.filter(r => r.response_from_servicer).length}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Responded</p>
            <p className="text-xs text-gray-500">
              {stats.totalReviews > 0 
                ? `${((reviews.filter(r => r.response_from_servicer).length / stats.totalReviews) * 100).toFixed(0)}% response rate`
                : 'No responses yet'}
            </p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-16">
                    <span className="font-medium text-gray-700 text-sm">{rating}</span>
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews by customer name or text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter:</span>
              </div>
              <button
                onClick={() => {
                  setFilterRating(null);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterRating === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => {
                    setFilterRating(rating);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating} <Star className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {review.user_image ? (
                        <img
                          src={review.user_image}
                          alt={review.user_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.user_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.overall_rating)}
                        <span className={`text-sm font-bold ${getRatingColor(review.overall_rating)}`}>
                          {review.overall_rating}.0
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Review Text */}
                {review.review_text && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{review.review_text}</p>
                  </div>
                )}

                {/* Rating Breakdown */}
                {(review.quality_rating || review.professionalism_rating || review.punctuality_score) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    {review.quality_rating && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Quality</p>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <p className="text-sm font-semibold text-gray-900">{review.quality_rating}/5</p>
                        </div>
                      </div>
                    )}
                    {review.professionalism_rating && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Professional</p>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <p className="text-sm font-semibold text-gray-900">{review.professionalism_rating}/5</p>
                        </div>
                      </div>
                    )}
                    {review.punctuality_score && (
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Punctuality</p>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <p className="text-sm font-semibold text-gray-900">{review.punctuality_score}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Servicer Response */}
                {review.response_from_servicer ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">Your Response</p>
                        <p className="text-sm text-blue-800 leading-relaxed">{review.response_from_servicer}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          {new Date(review.response_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleResponseClick(review)}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Respond to Review
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-sm text-gray-600">
              {filterRating 
                ? `No ${filterRating}-star reviews found`
                : "Complete services to start receiving reviews from customers"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Respond to Review</h3>
            
            {/* Review Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gray-200 p-2 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedReview.user_name}</p>
                  {renderStars(selectedReview.overall_rating)}
                </div>
              </div>
              {selectedReview.review_text && (
                <p className="text-sm text-gray-700 leading-relaxed mt-2">{selectedReview.review_text}</p>
              )}
            </div>

            {/* Response Input */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write a professional response to this review..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="6"
            />
            <p className="text-xs text-gray-500 mt-2 mb-4">
              💡 Tip: Thank the customer, address any concerns, and maintain a professional tone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                  setSelectedReview(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                disabled={!responseText.trim() || responding}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {responding ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicerReviews;