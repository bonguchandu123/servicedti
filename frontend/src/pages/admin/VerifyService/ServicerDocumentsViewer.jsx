import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const ServicerDocumentsViewer = ({ servicerId, onNavigate }) => {
  const [servicer, setServicer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [zoom, setZoom] = useState(1);
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

  useEffect(() => {
    fetchServicerDetails();
  }, [servicerId]);

  useEffect(() => {
    if (servicer) {
      const images = [];
      
      if (servicer.aadhaar_front_url) {
        images.push({ url: servicer.aadhaar_front_url, label: 'Aadhaar Card - Front', type: 'identity' });
      }
      if (servicer.aadhaar_back_url) {
        images.push({ url: servicer.aadhaar_back_url, label: 'Aadhaar Card - Back', type: 'identity' });
      }
      if (servicer.certificate_urls) {
        servicer.certificate_urls.forEach((url, idx) => {
          images.push({ url, label: `Professional Certificate ${idx + 1}`, type: 'certificate' });
        });
      }
      if (servicer.vehicle_document_urls) {
        servicer.vehicle_document_urls.forEach((url, idx) => {
          images.push({ url, label: `Vehicle Document ${idx + 1}`, type: 'vehicle' });
        });
      }
      
      setAllImages(images);
    }
  }, [servicer]);

  const fetchServicerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/verifications/${servicerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch details');

      const data = await response.json();
      setServicer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (image, index) => {
    setSelectedImage(image);
    setImageIndex(index);
    setZoom(1);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setZoom(1);
  };

  const goToPrevious = () => {
    const newIndex = imageIndex > 0 ? imageIndex - 1 : allImages.length - 1;
    setImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
    setZoom(1);
  };

  const goToNext = () => {
    const newIndex = imageIndex < allImages.length - 1 ? imageIndex + 1 : 0;
    setImageIndex(newIndex);
    setSelectedImage(allImages[newIndex]);
    setZoom(1);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const downloadImage = () => {
    if (selectedImage) {
      window.open(selectedImage.url, '_blank');
    }
  };

  if (loading) {
    return (
   <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <img
        src="/newmg.svg"
        alt="Loading..."
        className="w-40 h-40 animate-logo"
      />
    </div>
    );
  }

  if (error || !servicer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate(`/admin/verify-servicers/${servicerId}/details`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Details
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Documents</h3>
            <p className="text-red-700">{error || 'Documents not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'identity': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'certificate': return 'bg-green-100 text-green-800 border-green-300';
      case 'vehicle': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate(`/admin/verify-servicers/${servicerId}/details`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Verification Details
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Gallery</h1>
                <p className="text-gray-600">
                  {servicer.user_details?.name || 'Servicer'} • {allImages.length} document(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  Pending Verification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Categories */}
        <div className="space-y-8">
          {/* Identity Documents */}
          {(servicer.aadhaar_front_url || servicer.aadhaar_back_url) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Identity Proof (Aadhaar Card)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servicer.aadhaar_front_url && (
                  <div
                    onClick={() => openImageModal(allImages.find(img => img.url === servicer.aadhaar_front_url), allImages.findIndex(img => img.url === servicer.aadhaar_front_url))}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <img
                      src={servicer.aadhaar_front_url}
                      alt="Aadhaar Front"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <p className="text-white text-sm font-medium">Aadhaar - Front</p>
                    </div>
                  </div>
                )}
                {servicer.aadhaar_back_url && (
                  <div
                    onClick={() => openImageModal(allImages.find(img => img.url === servicer.aadhaar_back_url), allImages.findIndex(img => img.url === servicer.aadhaar_back_url))}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <img
                      src={servicer.aadhaar_back_url}
                      alt="Aadhaar Back"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <p className="text-white text-sm font-medium">Aadhaar - Back</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Professional Certificates */}
          {servicer.certificate_urls && servicer.certificate_urls.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-600" />
                Professional Certificates
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {servicer.certificate_urls.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servicer.certificate_urls.map((url, index) => {
                  const imgIndex = allImages.findIndex(img => img.url === url);
                  return (
                    <div
                      key={index}
                      onClick={() => openImageModal(allImages[imgIndex], imgIndex)}
                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 cursor-pointer transition-all hover:shadow-lg"
                    >
                      <img
                        src={url}
                        alt={`Certificate ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <p className="text-white text-sm font-medium">Certificate {index + 1}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vehicle Documents */}
          {servicer.vehicle_document_urls && servicer.vehicle_document_urls.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Vehicle Documents
                <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  {servicer.vehicle_document_urls.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {servicer.vehicle_document_urls.map((url, index) => {
                  const imgIndex = allImages.findIndex(img => img.url === url);
                  return (
                    <div
                      key={index}
                      onClick={() => openImageModal(allImages[imgIndex], imgIndex)}
                      className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 cursor-pointer transition-all hover:shadow-lg"
                    >
                      <img
                        src={url}
                        alt={`Vehicle Document ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <p className="text-white text-sm font-medium">Vehicle Doc {index + 1}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {allImages.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-600">This servicer hasn't uploaded any documents yet.</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Image Container */}
          <div className="relative max-w-6xl max-h-[90vh] w-full flex flex-col items-center justify-center">
            {/* Image Info Header */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-xl font-bold">{selectedImage.label}</h3>
                  <p className="text-gray-300 text-sm">
                    {imageIndex + 1} of {allImages.length}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(selectedImage.type)}`}>
                  {selectedImage.type.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Image */}
            <div className="overflow-auto max-h-full">
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                style={{ transform: `scale(${zoom})` }}
                className="max-w-full h-auto transition-transform duration-200"
              />
            </div>

            {/* Controls Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all disabled:opacity-50"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-white font-medium px-4 py-2 bg-white bg-opacity-20 rounded-full">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all disabled:opacity-50"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={downloadImage}
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all ml-4"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicerDocumentsViewer;