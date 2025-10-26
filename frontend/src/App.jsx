
import React, { useState, useEffect } from 'react';
import { Menu, Newspaper } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import SearchServices from './pages/user/SearchServices';
import MyBookings from './pages/user/MyBookings';
import BookingHistory from './pages/user/BookingHistory';
import BookingDetails from './pages/user/BookingDetails';
import Favorites from './pages/user/Favorites';
import UserWallet from './pages/user/Wallet';
import UserProfile from './pages/user/Profile';
import LiveTracking from './pages/user/LiveTracking';
import ChatMessaging from './pages/user/ChatMessaging';
import CreateBooking from './pages/user/CreateBooking';

// Servicer Pages
import ServicerDashboard from './pages/servicer/ServicerDashboard';
import ServicerUploadDocuments from './pages/servicer/ServicerUploadDocuments';
import ServicerRequests from './pages/servicer/ServicerRequests';
import ServicerActiveServices from './pages/servicer/ServicerActiveServices';
import ServicerEarningsPayouts from './pages/servicer/ServicerEarningsPayouts';
import ServicerReviews from './pages/servicer/Reviews';
import ServicerProfile from './pages/servicer/ServicerProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyServicers from './pages/admin/VerifyServicers';
import AdminManageUsers from './pages/admin/AdminManageUsers';
import AdminManageBookings from './pages/admin/AdminManageBookings';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminCategories from './pages/admin/AdminCategoriesPage';
import AdminLogin from './pages/admin/AdminLogin';
import ServicerProfileView from './pages/user/ServicerProfileView';
import UserNotifications from './pages/user/UserNotifications';

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync currentPath with browser URL on mount and when URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentPath]);

  // Set initial path based on user role (only if on root path)
  useEffect(() => {
    if (user && currentPath === '/') {
      let defaultPath = '/login';
      
      if (user.role === 'user') {
        defaultPath = '/user/dashboard';
      } else if (user.role === 'servicer') {
        defaultPath = '/servicer/dashboard';
      } else if (user.role === 'admin') {
        defaultPath = '/admin/dashboard';
      }
      
      navigateTo(defaultPath);
    } else if (!user && currentPath === '/') {
      navigateTo('/login');
    }
  }, [user, currentPath]);

  const navigateTo = (path) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  const handleLogout = () => {
    logout();
    navigateTo('/login');
  };

  const renderPage = () => {
    // Auth Routes
    if (currentPath === '/login') return <Login onNavigate={navigateTo} />;
    if (currentPath === '/signup') return <Signup onNavigate={navigateTo} />;
    if (currentPath === '/verify-email') return <VerifyEmail onNavigate={navigateTo} />;
    if (currentPath === '/forgot-password') return <ForgotPassword onNavigate={navigateTo} />;
    if (currentPath === '/reset-password') return <ResetPassword onNavigate={navigateTo} />;
    if (currentPath === '/admin/login') return <AdminLogin onNavigate={navigateTo} />;

    // Protected Routes - Check if user is logged in
    if (!user) {
      return <Login onNavigate={navigateTo} />;
    }

    // User Routes
    if (user.role === 'user') {
      // Static routes first
      switch (currentPath) {
        case '/user/dashboard':
          return <UserDashboard  onNavigate={navigateTo}/>;
        case '/user/search':
          return <SearchServices onNavigate={navigateTo} />;
        case '/user/bookings':
          return <MyBookings onNavigate={navigateTo} />;
        case '/user/bookings/create':
          return <CreateBooking onNavigate={navigateTo} />;
        case '/user/history':
          return <BookingHistory onNavigate={navigateTo} />;
        case '/user/favorites':
          return <Favorites />;
        case '/user/wallet':
          return <UserWallet />;
        case '/user/profile':
          return <UserProfile />;
        case '/user/notifications':  // ✅ ADD THIS
      return <UserNotifications/>;
      }

      // Dynamic routes - check these after static routes
      // Pattern: /user/bookings/{id}/track
      const trackingMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/track$/);
      if (trackingMatch) {
        const bookingId = trackingMatch[1];
        return <LiveTracking bookingId={bookingId} />;
      }

      // Pattern: /user/bookings/{id}/chat
      const chatMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/chat$/);
      if (chatMatch) {
        const bookingId = chatMatch[1];
        return <ChatMessaging bookingId={bookingId} />;
      }
   

      // Pattern: /user/bookings/{id} or /user/booking/{id}
      const bookingMatch = currentPath.match(/^\/user\/bookings?\/([^\/]+)$/);
      if (bookingMatch) {
        const bookingId = bookingMatch[1];
        return <BookingDetails bookingId={bookingId} onNavigate={navigateTo} />;
      }

           const servicerMatch = currentPath.match(/^\/user\/servicers\/([^\/]+)$/);
  if (servicerMatch) {
    const servicerId = servicerMatch[1];
    return <ServicerProfileView servicerId={servicerId} onNavigate={navigateTo} />;
  }


      // Legacy patterns for backwards compatibility
      if (currentPath.startsWith('/user/tracking/')) {
        const bookingId = currentPath.split('/').pop();
        return <LiveTracking bookingId={bookingId} />;
      }
      
      if (currentPath.startsWith('/user/chat/')) {
        const bookingId = currentPath.split('/').pop();
        return <ChatMessaging bookingId={bookingId} />;
      }

      // Default fallback
      return <UserDashboard onNavigate={navigateTo} />;
    }

    // Servicer Routes
    // Servicer Routes
if (user.role === 'servicer') {
  // Static routes first
  switch (currentPath) {
    case '/servicer/dashboard':
      return <ServicerDashboard />;
    case '/servicer/upload-documents':
      return <ServicerUploadDocuments />;
    case '/servicer/requests':
      return <ServicerRequests onNavigate={navigateTo} />;
    case '/servicer/active-services':
      return <ServicerActiveServices onNavigate={navigateTo} />;
    case '/servicer/earnings':
      return <ServicerEarningsPayouts />;
    case '/servicer/reviews':
      return <ServicerReviews />;
    case '/servicer/profile':
      return <ServicerProfile />;
  }

  // ✅ ADD DYNAMIC ROUTES FOR SERVICER
  // Pattern: /servicer/chat/{booking_id}
  const chatMatch = currentPath.match(/^\/servicer\/chat\/([^\/]+)$/);
  if (chatMatch) {
    const bookingId = chatMatch[1];
    return <ChatMessaging bookingId={bookingId} />;
  }

  // Pattern: /servicer/tracking/{booking_id}
  const trackingMatch = currentPath.match(/^\/servicer\/tracking\/([^\/]+)$/);
  if (trackingMatch) {
    const bookingId = trackingMatch[1];
    return <LiveTracking bookingId={bookingId} />;
  }

  // Pattern: /servicer/requests/{request_id}
  const requestMatch = currentPath.match(/^\/servicer\/requests\/([^\/]+)$/);
  if (requestMatch) {
    const requestId = requestMatch[1];
    // You can create a ServicerRequestDetails component later
    return <BookingDetails bookingId={requestId} onNavigate={navigateTo} />;
  }

  // Default fallback
  return <ServicerDashboard />;
}
    // Admin Routes
    if (user.role === 'admin') {
      switch (currentPath) {
        case '/admin/dashboard':
          return <AdminDashboard />;
        case '/admin/verify-servicers':
          return <VerifyServicers />;
        case '/admin/users':
          return <AdminManageUsers />;
        case '/admin/bookings':
          return <AdminManageBookings />;
        case '/admin/transactions':
          return <AdminTransactions />;
        case '/admin/payouts':
          return <AdminPayouts />;
        case '/admin/categories':
          return <AdminCategories />;
        default:
          return <AdminDashboard />;
      }
    }

    return <Login onNavigate={navigateTo} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages without sidebar
  if (!user || currentPath === '/login' || currentPath === '/signup' || currentPath === '/verify-email' || currentPath === '/forgot-password' || currentPath === '/reset-password' || currentPath === '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderPage()}
      </div>
    );
  }

  // Show dashboard layout with sidebar for logged-in users
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        role={user.role}
        currentPath={currentPath}
        onNavigate={navigateTo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              {user.role === 'user' && 'ServiceApp'}
              {user.role === 'servicer' && 'ServiceApp Pro'}
              {user.role === 'admin' && 'ServiceApp Admin'}
            </h1>
            <div className="w-10"></div>
          </div>
        </div>

        <main className="min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;