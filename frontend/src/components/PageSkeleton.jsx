import React from 'react';

// Base Skeleton Components
const SkeletonBox = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const SkeletonCircle = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-full ${className}`}></div>
);

const SkeletonText = ({ lines = 3, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {[...Array(lines)].map((_, i) => (
      <SkeletonBox 
        key={i} 
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
      />
    ))}
  </div>
);

// Dashboard Skeleton
export const DashboardSkeleton = ({ role = 'user' }) => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <SkeletonBox className="h-8 w-64" />
      <SkeletonBox className="h-4 w-96" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <SkeletonCircle className="w-12 h-12" />
            <SkeletonBox className="h-6 w-16" />
          </div>
          <SkeletonBox className="h-4 w-24 mb-2" />
          <SkeletonBox className="h-6 w-20" />
        </div>
      ))}
    </div>

    {/* Content Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <SkeletonBox className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <SkeletonCircle className="w-12 h-12" />
              <div className="flex-1">
                <SkeletonBox className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-3 w-48" />
              </div>
              <SkeletonBox className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <SkeletonBox className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between mb-2">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-4 w-16" />
              </div>
              <SkeletonBox className="h-3 w-full mb-2" />
              <SkeletonBox className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Search/List Skeleton
export const SearchListSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Search Bar */}
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <SkeletonBox className="h-12 w-full" />
    </div>

    {/* Filters */}
    <div className="flex gap-4 overflow-x-auto">
      {[...Array(5)].map((_, i) => (
        <SkeletonBox key={i} className="h-10 w-32 flex-shrink-0" />
      ))}
    </div>

    {/* Grid Items */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <SkeletonBox className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <SkeletonBox className="h-6 w-3/4" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-5/6" />
            <div className="flex justify-between items-center pt-2">
              <SkeletonBox className="h-5 w-20" />
              <SkeletonBox className="h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Booking Details Skeleton
export const BookingDetailsSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <SkeletonBox className="h-8 w-64 mb-2" />
          <SkeletonBox className="h-4 w-48" />
        </div>
        <SkeletonBox className="h-10 w-32" />
      </div>
    </div>

    {/* Details Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Service Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div className="flex gap-4">
              <SkeletonCircle className="w-16 h-16" />
              <div className="flex-1">
                <SkeletonBox className="h-5 w-48 mb-2" />
                <SkeletonBox className="h-4 w-64" />
              </div>
            </div>
            <SkeletonText lines={3} />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <SkeletonCircle className="w-8 h-8" />
                <div className="flex-1">
                  <SkeletonBox className="h-4 w-40 mb-2" />
                  <SkeletonBox className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <SkeletonBox className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="flex items-center gap-4 mb-4">
            <SkeletonCircle className="w-16 h-16" />
            <div className="flex-1">
              <SkeletonBox className="h-5 w-32 mb-2" />
              <SkeletonBox className="h-4 w-24" />
            </div>
          </div>
          <SkeletonBox className="h-10 w-full" />
        </div>
      </div>
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <SkeletonBox className="h-8 w-48" />
      <SkeletonBox className="h-10 w-32" />
    </div>

    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonBox key={i} className="h-4" />
          ))}
        </div>
      </div>

      {/* Table Rows */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 border-b">
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, j) => (
              <SkeletonBox key={j} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Profile Skeleton
export const ProfileSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-6 mb-6">
        <SkeletonCircle className="w-24 h-24" />
        <div className="flex-1">
          <SkeletonBox className="h-6 w-48 mb-2" />
          <SkeletonBox className="h-4 w-64 mb-3" />
          <SkeletonBox className="h-10 w-32" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
          <SkeletonBox className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_, j) => (
              <div key={j}>
                <SkeletonBox className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Chat Skeleton
export const ChatSkeleton = () => (
  <div className="flex flex-col h-screen bg-gray-50">
    {/* Header */}
    <div className="bg-white border-b p-4">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="w-10 h-10" />
        <div className="flex-1">
          <SkeletonBox className="h-4 w-32 mb-2" />
          <SkeletonBox className="h-3 w-24" />
        </div>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs ${i % 2 === 0 ? 'bg-blue-100' : 'bg-white'} rounded-lg p-3`}>
            <SkeletonBox className="h-4 w-48 mb-2" />
            <SkeletonBox className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>

    {/* Input */}
    <div className="bg-white border-t p-4">
      <SkeletonBox className="h-12 w-full" />
    </div>
  </div>
);

// Navigation Loading Spinner (appears during page transitions)
export const NavigationLoader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-blue-400 opacity-20"></div>
      </div>
      <p className="text-gray-700 font-medium mt-4">Loading...</p>
    </div>
  </div>
);

// Main Skeleton Router Component
export const PageSkeleton = ({ type = 'dashboard', role = 'user' }) => {
  switch (type) {
    case 'dashboard':
      return <DashboardSkeleton role={role} />;
    case 'search':
    case 'list':
      return <SearchListSkeleton />;
    case 'details':
      return <BookingDetailsSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'chat':
      return <ChatSkeleton />;
    default:
      return <DashboardSkeleton role={role} />;
  }
};

// Demo Component
const SkeletonDemo = () => {
  const [currentType, setCurrentType] = React.useState('dashboard');
  const [role, setRole] = React.useState('user');

  const skeletonTypes = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'search', label: 'Search/List' },
    { value: 'details', label: 'Booking Details' },
    { value: 'table', label: 'Table View' },
    { value: 'profile', label: 'Profile' },
    { value: 'chat', label: 'Chat' },
  ];

  const roles = ['user', 'servicer', 'admin'];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Controls */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ServiceApp Skeleton Loaders
          </h1>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skeleton Type
              </label>
              <select
                value={currentType}
                onChange={(e) => setCurrentType(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {skeletonTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton Display */}
      <PageSkeleton type={currentType} role={role} />
    </div>
  );
};

export default SkeletonDemo;