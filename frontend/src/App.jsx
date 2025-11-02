
// import React, { useState, useEffect } from 'react';
// import { Menu, Newspaper } from 'lucide-react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import { SocketProvider } from './context/SocketContext';
// import Sidebar from './components/Sidebar';

// // Auth Pages
// import Login from './pages/auth/Login';
// import Signup from './pages/auth/Signup';
// import VerifyEmail from './pages/auth/VerifyEmail';
// import ForgotPassword from './pages/auth/ForgotPassword';
// import ResetPassword from './pages/auth/ResetPassword';

// // User Pages
// import UserDashboard from './pages/user/Dashboard';
// import SearchServices from './pages/user/SearchServices';
// import MyBookings from './pages/user/MyBookings';
// import BookingHistory from './pages/user/BookingHistory';
// import BookingDetails from './pages/user/BookingDetails';
// import Favorites from './pages/user/Favorites';
// import UserWallet from './pages/user/Wallet';
// import UserProfile from './pages/user/Profile';
// import LiveTracking from './pages/user/LiveTracking';
// import ChatMessaging from './pages/user/ChatMessaging';
// import CreateBooking from './pages/user/CreateBooking';
// import  ComplaintDetails from './pages/user/ComplaintsDetails';

// // Servicer Pages
// import ServicerDashboard from './pages/servicer/ServicerDashboard';
// import ServicerUploadDocuments from './pages/servicer/ServicerUploadDocuments';
// import ServicerRequests from './pages/servicer/ServicerRequests';
// import ServicerActiveServices from './pages/servicer/ServicerActiveServices';
// import ServicerEarningsPayouts from './pages/servicer/ServicerEarningsPayouts';
// import ServicerReviews from './pages/servicer/Reviews';
// import ServicerProfile from './pages/servicer/ServicerProfile';

// // Admin Pages
// import AdminDashboard from './pages/admin/AdminDashboard';
// import VerifyServicers from './pages/admin/VerifyServicers';
// import AdminManageUsers from './pages/admin/AdminManageUsers';
// import AdminManageBookings from './pages/admin/AdminManageBookings';
// import AdminTransactions from './pages/admin/AdminTransactions';
// import AdminPayouts from './pages/admin/AdminPayouts';
// import AdminCategories from './pages/admin/AdminCategoriesPage';
// import AdminLogin from './pages/admin/AdminLogin';
// import ServicerProfileView from './pages/user/ServicerProfileView';
// import UserNotifications from './pages/user/UserNotifications';
// import { ToastProvider, useToast } from './context/ToastContext';
// import { NotificationProvider } from './context/NotificationContext';
// import ServicerNotifications from './pages/servicer/ServicerNotifications';
// import { DarkProgressBar} from './components/NavigationProgressBar';
// import AdminManageIssues from './pages/admin/AdminManageIssues';
// import AdminTransactionIssues from './pages/admin/AdminTransactionIssue';
// import AdminComplaints from './pages/admin/AdminComplaints';
// import AdminBlacklist from './pages/admin/AdminBlackList';
// import MyComplaints from './pages/user/MyComplaints';
// import CreateComplaint from './pages/user/CreateComplaint';
// import ServicerComplaints from './pages/servicer/MyComplaints';
// import RefundManagement from './pages/servicer/RefundManagement';
// import ServicerAccountStatus from './pages/servicer/ServicerAccountStatus';
// import ServicerTransactionIssues from './components/ServicerTransactionIssues';
// import UserTransactionIssueChat from './components/UserTransactionIssueChat';
// import TransactionIssueChat from './components/TransactionIssueChat';



// const AppContent = () => {
//   const { user, loading, logout } = useAuth();
//   const [currentPath, setCurrentPath] = useState(window.location.pathname);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//    const [isNavigating, setIsNavigating] = useState(false); 
//   const toast = useToast();



  
  
// useEffect(() => {
//   if (!user) return;

//   const pageNames = {
//     '/user/dashboard': '🏠 Dashboard',
//     '/user/search': '🔍 Search Services',
//     '/user/bookings': '📅 My Bookings',
//     '/user/history': '🕘 Booking History',
//     '/user/favorites': '❤️ Favorites',
//     '/user/wallet': '💰 Wallet',
//     '/user/profile': '👤 Profile',
//     '/user/notifications': '🔔 Notifications',

//     '/servicer/dashboard': '🛠️ Servicer Dashboard',
//     '/servicer/requests': '📩 Service Requests',
//     '/servicer/active-services': '✅ Active Services',
//     '/servicer/profile': '👤 Servicer Profile',

//     '/admin/dashboard': '📊 Admin Dashboard',
//     '/admin/users': '👥 Manage Users',
//     '/admin/bookings': '📂 Manage Bookings',
//   };

//   const name = pageNames[currentPath];
//   if (name) {
//     toast.info(`👋 Welcome to ${name}`);
//   }
// }, [currentPath]);

//   // Sync currentPath with browser URL on mount and when URL changes
//   useEffect(() => {
//     const handleLocationChange = () => {
//       setCurrentPath(window.location.pathname);
//     };

//     handleLocationChange();
//     window.addEventListener('popstate', handleLocationChange);

//     return () => {
//       window.removeEventListener('popstate', handleLocationChange);
//     };
//   }, [currentPath]);

//   // Set initial path based on user role (only if on root path)
//   useEffect(() => {
//     if (user && currentPath === '/') {
//       let defaultPath = '/login';
      
//       if (user.role === 'user') {
//         defaultPath = '/user/dashboard';
//       } else if (user.role === 'servicer') {
//         defaultPath = '/servicer/dashboard';
//       } else if (user.role === 'admin') {
//         defaultPath = '/admin/dashboard';
//       }
      
//       navigateTo(defaultPath);
//     } else if (!user && currentPath === '/') {
//       navigateTo('/login');
//     }
//   }, [user, currentPath]);

// const navigateTo = (path) => {
//   setIsNavigating(true);
//   setCurrentPath(path);
//   window.history.pushState({}, '', path);
  
//   setTimeout(() => {
//     setIsNavigating(false);
//   }, 1400); // Increased from 600ms to match the loading time
// };
//   const handleLogout = () => {
//     logout();
//     navigateTo('/login');
//   };

//   const renderPage = () => {
//     // Auth Routes
//     if (currentPath === '/login') return <Login onNavigate={navigateTo} />;
//     if (currentPath === '/signup') return <Signup onNavigate={navigateTo} />;
//     if (currentPath === '/verify-email') return <VerifyEmail onNavigate={navigateTo} />;
//     if (currentPath === '/forgot-password') return <ForgotPassword onNavigate={navigateTo} />;
//     if (currentPath === '/reset-password') return <ResetPassword onNavigate={navigateTo} />;
//     if (currentPath === '/admin/login') return <AdminLogin onNavigate={navigateTo} />;

//     // Protected Routes - Check if user is logged in
//     if (!user) {
//       return <Login onNavigate={navigateTo} />;
//     }

//     // User Routes
//     if (user.role === 'user') {
//       // Static routes first
//       switch (currentPath) {
//         case '/user/dashboard':
//           return <UserDashboard  onNavigate={navigateTo}/>;
//         case '/user/search':
//           return <SearchServices onNavigate={navigateTo} />;
//         case '/user/bookings':
//           return <MyBookings onNavigate={navigateTo} />;
//         case '/user/bookings/create':
//           return <CreateBooking onNavigate={navigateTo} />;
//         case '/user/history':
//           return <BookingHistory onNavigate={navigateTo} />;
//         case '/user/favorites':
//           return <Favorites />;
//         case '/user/wallet':
//           return <UserWallet />;
//         case '/user/profile':
//           return <UserProfile />;
//         case '/user/notifications':
//           return <UserNotifications/>;
//         case '/user/complaints':
//           return <MyComplaints onNavigate={navigateTo} />;
//         case '/user/complaints/create':
//           return <CreateComplaint onNavigate={navigateTo} />;
//         case '/user/chat':
//           return <UserTransactionIssueChat/>;
//       }
      



      
//       // Dynamic routes - check these after static routes
//       // Pattern: /user/bookings/{id}/track
//       const trackingMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/track$/);
//       if (trackingMatch) {
//         const bookingId = trackingMatch[1];
//         return <LiveTracking bookingId={bookingId} />;
//       }

//       // Pattern: /user/bookings/{id}/chat
//       const chatMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/chat$/);
//       if (chatMatch) {
//         const bookingId = chatMatch[1];
//         return <ChatMessaging bookingId={bookingId} />;
//       }
   

//       // Pattern: /user/bookings/{id} or /user/booking/{id}
//       const bookingMatch = currentPath.match(/^\/user\/bookings?\/([^\/]+)$/);
//       if (bookingMatch) {
//         const bookingId = bookingMatch[1];
//         return <BookingDetails bookingId={bookingId} onNavigate={navigateTo} />;
//       }

//            const servicerMatch = currentPath.match(/^\/user\/servicers\/([^\/]+)$/);
//   if (servicerMatch) {
//     const servicerId = servicerMatch[1];
//     return <ServicerProfileView servicerId={servicerId} onNavigate={navigateTo} />;
//   }

//   const complaintMatch = currentPath.match(/^\/user\/complaints\/([^\/]+)$/);
// if (complaintMatch) {
//   const complaintId = complaintMatch[1];
//   return <ComplaintDetails  complaintId={complaintId} onNavigate={navigateTo} />;
// }


//       // Legacy patterns for backwards compatibility
//       if (currentPath.startsWith('/user/tracking/')) {
//         const bookingId = currentPath.split('/').pop();
//         return <LiveTracking bookingId={bookingId} />;
//       }
      
//       if (currentPath.startsWith('/user/chat/')) {
//         const bookingId = currentPath.split('/').pop();
//         return <ChatMessaging bookingId={bookingId} />;
//       }


//       // Default fallback
//       return <UserDashboard onNavigate={navigateTo} />;
//     }

//     // Servicer Routes
//     // Servicer Routes
// if (user.role === 'servicer') {
//   // Static routes first
//   switch (currentPath) {
//     case '/servicer/dashboard':
//       return <ServicerDashboard />;
//     case '/servicer/upload-documents':
//       return <ServicerUploadDocuments />;
//     case '/servicer/requests':
//       return <ServicerRequests onNavigate={navigateTo} />;
//     case '/servicer/active-services':
//       return <ServicerActiveServices onNavigate={navigateTo} />;
//     case '/servicer/earnings':
//       return <ServicerEarningsPayouts />;
//     case '/servicer/reviews':
//       return <ServicerReviews />;
//     case '/servicer/profile':
//       return <ServicerProfile />;
//     case '/servicer/notifications':
//       return <ServicerNotifications/>;
//     case '/servicer/mycomplaints':
//       return <ServicerComplaints/>
//     case '/servicer/refunds':
//   return <RefundManagement onNavigate={navigateTo} />;
//   case '/servicer/status':
//     return <ServicerAccountStatus />
//   case '/servicer/chat':
//       return <ServicerTransactionIssues/>
    
//   }

//   // ✅ ADD DYNAMIC ROUTES FOR SERVICER
//   // Pattern: /servicer/chat/{booking_id}
//   const chatMatch = currentPath.match(/^\/servicer\/chat\/([^\/]+)$/);
//   if (chatMatch) {
//     const bookingId = chatMatch[1];
//     return <ChatMessaging bookingId={bookingId} />;
//   }

//   // Pattern: /servicer/tracking/{booking_id}
//   const trackingMatch = currentPath.match(/^\/servicer\/tracking\/([^\/]+)$/);
//   if (trackingMatch) {
//     const bookingId = trackingMatch[1];
//     return <LiveTracking bookingId={bookingId} />;
//   }

//   // Pattern: /servicer/requests/{request_id}
//   const requestMatch = currentPath.match(/^\/servicer\/requests\/([^\/]+)$/);
//   if (requestMatch) {
//     const requestId = requestMatch[1];
//     // You can create a ServicerRequestDetails component later
//     return <BookingDetails bookingId={requestId} onNavigate={navigateTo} />;
//   }

//   // Default fallback
//   return <ServicerDashboard />;
// }
//     // Admin Routes
//     if (user.role === 'admin') {
//       switch (currentPath) {
//         case '/admin/dashboard':
//           return <AdminDashboard />;
//         case '/admin/verify-servicers':
//           return <VerifyServicers />;
//         case '/admin/users':
//           return <AdminManageUsers />;
//         case '/admin/bookings':
//           return <AdminManageBookings />;
//         case '/admin/transactions':
//           return <AdminTransactions />;
//         case '/admin/payouts':
//           return <AdminPayouts />;
//         case '/admin/categories':
//           return <AdminCategories />;
//         case '/admin/issues':
//           return <AdminManageIssues/>;
//         case '/admin/issues/transcation':
//           return <AdminTransactionIssues/>;
//           // In your Admin Routes section, add:
//         case '/admin/complaints':
//            return <AdminComplaints />;
//         case '/admin/Blacklist':
//            return <AdminBlacklist/>;
//         case '/admin/chat':
//           return <TransactionIssueChat/>;
//         default:
//           return <AdminDashboard />;
//       }
//     }

//     return <Login onNavigate={navigateTo} />;
//   };

//     if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 text-lg">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show auth pages without sidebar
//   if (!user || currentPath === '/login' || currentPath === '/signup' || currentPath === '/verify-email' || currentPath === '/forgot-password' || currentPath === '/reset-password' || currentPath === '/admin/login') {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         {renderPage()}
//       </div>
//     );
//   }

//   // Show dashboard layout with sidebar for logged-in users
//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {/* ✅ ADD PROGRESS BAR HERE */}
//       {isNavigating && <DarkProgressBar/>}
      
//       <Sidebar
//         role={user.role}
//         currentPath={currentPath}
//         onNavigate={navigateTo}
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         onLogout={handleLogout}
//       />

//       <div className="flex-1 lg:ml-64">
//         <div className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
//           <div className="flex items-center justify-between p-4">
//             <button
//               onClick={() => setSidebarOpen(true)}
//               className="p-2 rounded-lg hover:bg-gray-100"
//             >
//               <Menu className="w-6 h-6 text-gray-700" />
//             </button>
//             <h1 className="text-lg font-bold text-gray-800">
//               {user.role === 'user' && 'ServiceApp'}
//               {user.role === 'servicer' && 'ServiceApp Pro'}
//               {user.role === 'admin' && 'ServiceApp Admin'}
//             </h1>
//             <div className="w-10"></div>
//           </div>
//         </div>

//         <main className="min-h-screen">
//           {renderPage()}
//         </main>
//       </div>
//     </div>
//   );
// };

// const App = () => {
//   return (
//     <AuthProvider>
//       <SocketProvider>
//         <ToastProvider>
//           <NotificationProvider>
//         <AppContent />
//         </NotificationProvider>
//         </ToastProvider>
//       </SocketProvider>
//     </AuthProvider>
//   );
// };

// export default App;


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
import MyBookings from './pages/user/MyBookings/MyBookings';
import BookingHistory from './pages/user/BookingHistory';
import BookingDetails from './pages/user/BookingDetails';
import Favorites from './pages/user/Favorites';
import UserWallet from './pages/user/Wallet/Wallet';
import UserProfile from './pages/user/Profile';
import LiveTracking from './pages/user/LiveTracking';
import ChatMessaging from './pages/user/ChatMessaging';
import CreateBooking from './pages/user/CreateBooking';
import ComplaintDetails from './pages/user/ComplaintsDetails';

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
import VerifyServicers from './pages/admin/VerifyService/VerifyServicers';
import AdminManageUsers from './pages/admin/AdminUserManagement/AdminManageUsers';
import AdminManageBookings from './pages/admin/AdminBookingMangement/AdminManageBookings';
import AdminTransactions from './pages/admin/AdminTransactions/AdminTransactions';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminCategories from './pages/admin/AdminCategoriesPage';
import AdminLogin from './pages/admin/AdminLogin';
import ServicerProfileView from './pages/user/ServicerProfileView';
import UserNotifications from './pages/user/UserNotifications';
import { ToastProvider, useToast } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ServicerNotifications from './pages/servicer/ServicerNotifications';
import { DarkProgressBar } from './components/NavigationProgressBar';
import AdminManageIssues from './pages/admin/AdminManageIssues/AdminManageIssues';
import AdminTransactionIssues from './pages/admin/AdminTranscationIssues.jsx/AdminTransactionIssue';
import AdminComplaints from './pages/admin/AdminComplaints/AdminComplaints';
import AdminBlacklist from './pages/admin/AdminBlackList/AdminBlackList';
import MyComplaints from './pages/user/MyComplaints';
import CreateComplaint from './pages/user/CreateComplaint';
import ServicerComplaints from './pages/servicer/MyComplaints';
import RefundManagement from './pages/servicer/RefundManagement/RefundManagement';
import ServicerAccountStatus from './pages/servicer/ServicerAccountStatus/ServicerAccountStatus';
import ServicerTransactionIssues from './components/ServicerTransactionIssues';
import UserTransactionIssueChat from './components/UserTransactionIssueChat';
import TransactionIssueChat from './components/TransactionIssueChat';
import SuspendUserPage from './pages/admin/AdminUserManagement/AdminSuspendUser';
import ViewUserDetails from './pages/admin/AdminUserManagement/ViewUserDetails';
import ViewBookingDetails from './pages/admin/AdminBookingMangement/ViewBookingDetails';
import ViewTransactionDetails from './pages/admin/AdminTransactions/ViewTransactionDetails';
import ViewIssueDetails from './pages/admin/AdminManageIssues/ViewIssueDetails';
import ViewTransactionIssues from './pages/admin/AdminTranscationIssues.jsx/ViewTransactionIssues';
import ResolveTransactionIssue from './pages/admin/AdminTranscationIssues.jsx/ResolveTransactionIssue';
import ResolveComplaint from './pages/admin/AdminComplaints/ResolveComplaint';
import ViewComplaintDetails from './pages/admin/AdminComplaints/ViewComplaintDetails';
import SuspendServicerPage from './pages/admin/AdminComplaints/SuspendServicer';
import UnsuspendUserPage from './pages/admin/AdminBlackList/UnsuspendUser';
import BanUserPage from './pages/admin/AdminBlackList/BanUser';
import ViewServicerDocDetails from './pages/admin/VerifyService/ViewServicerDocDetails';
import ServicerComplaintDetails from './pages/servicer/ServicerAccountStatus/ServicerComplaintDetails';
import ServicerDocumentsViewer from './pages/admin/VerifyService/ServicerDocumentsViewer';
import ReportTransactionIssuePage from './pages/user/MyBookings/ReportTransactionIssuePage';
import ReportBookingIssuePage from './pages/user/MyBookings/ReportBookingIssuePage';
import ReportRefundDelayPage from './pages/user/MyBookings/ReportRefundDelayPage';
import CancelBookingPage from './pages/user/MyBookings/CancelBookingPage';
import ProcessRefund from './pages/servicer/RefundManagement/ProcessRefund';
import TransactionDetails from './pages/user/Wallet/TransactionDetails';

const AppContent = () => {
  const { user, loading, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const toast = useToast();

  // Helper function to get query parameters
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      issue_id: params.get('issue_id')
    };
  };

  useEffect(() => {
    if (!user) return;

    const pageNames = {
      '/user/dashboard': '🏠 Dashboard',
      '/user/search': '🔍 Search Services',
      '/user/bookings': '📅 My Bookings',
      '/user/history': '🕘 Booking History',
      '/user/favorites': '❤️ Favorites',
      '/user/wallet': '💰 Wallet',
      '/user/profile': '👤 Profile',
      '/user/notifications': '🔔 Notifications',
      '/servicer/dashboard': '🛠️ Servicer Dashboard',
      '/servicer/requests': '📩 Service Requests',
      '/servicer/active-services': '✅ Active Services',
      '/servicer/profile': '👤 Servicer Profile',
      '/admin/dashboard': '📊 Admin Dashboard',
      '/admin/users': '👥 Manage Users',
      '/admin/bookings': '📂 Manage Bookings',
    };

    const name = pageNames[currentPath];
    if (name) {
      toast.info(`👋 Welcome to ${name}`);
    }
  }, [currentPath]);

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
    setIsNavigating(true);
    setCurrentPath(path);
    window.history.pushState({}, '', path);

    setTimeout(() => {
      setIsNavigating(false);
    }, 1400);
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

  // Protected Routes
    if (!user) {
      return <Login onNavigate={navigateTo} />;
    }

    // User Routes
    if (user.role === 'user') {
      switch (currentPath) {
        case '/user/dashboard':
          return <UserDashboard onNavigate={navigateTo} />;
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
          return <UserWallet onNavigate={navigateTo} />;
        case '/user/profile':
          return <UserProfile />;
        case '/user/notifications':
          return <UserNotifications />;
        case '/user/complaints':
          return <MyComplaints onNavigate={navigateTo} />;
        case '/user/complaints/create':
          return <CreateComplaint onNavigate={navigateTo} />;
        case '/user/book': {
  return <CreateBooking onNavigate={navigateTo} />;
}

      

        
        // ✅ UPDATED: Transaction Issue Chat Route
        case '/user/chat': {
          const { issue_id } = getQueryParams();
          if (issue_id) {
            // Show standalone chat page with specific issue
            return <TransactionIssueChat issueId={issue_id} userRole="user" onNavigate={navigateTo} />;
          }
          // Show list of all transaction issues
          return <UserTransactionIssueChat />;
        }
      }

      const transactionMatch = currentPath.match(/^\/user\/transactions\/([^\/]+)$/);
  if (transactionMatch) {
    const transactionId = transactionMatch[1];
    return <TransactionDetails transactionId={transactionId} onNavigate={navigateTo} />;
  }

        // ✅ NEW: Report Refund Delay Page
  const refundDelayMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/report-refund-delay$/);
  if (refundDelayMatch) {
    const bookingId = refundDelayMatch[1];
    return <ReportRefundDelayPage bookingId={bookingId} onNavigate={navigateTo} />;
  }

  // ✅ NEW: Report Booking Issue Page
  const bookingIssueMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/report-booking-issue$/);
  if (bookingIssueMatch) {
    const bookingId = bookingIssueMatch[1];
    return <ReportBookingIssuePage bookingId={bookingId} onNavigate={navigateTo} />;
  }

  // ✅ NEW: Report Transaction Issue Page
  const transactionIssueMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/report-transaction-issue$/);
  if (transactionIssueMatch) {
    const bookingId = transactionIssueMatch[1];
    return <ReportTransactionIssuePage bookingId={bookingId} onNavigate={navigateTo} />;
  }

       const cancelMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/cancel$/);
  if (cancelMatch) {
    const bookingId = cancelMatch[1];
    return <CancelBookingPage bookingId={bookingId} onNavigate={navigateTo} />;
  }


      // Dynamic routes
      const trackingMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/track$/);
      if (trackingMatch) {
        const bookingId = trackingMatch[1];
        return <LiveTracking bookingId={bookingId} />;
      }

      const chatMatch = currentPath.match(/^\/user\/bookings\/([^\/]+)\/chat$/);
      if (chatMatch) {
        const bookingId = chatMatch[1];
        return <ChatMessaging bookingId={bookingId} />;
      }

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

      const complaintMatch = currentPath.match(/^\/user\/complaints\/([^\/]+)$/);
      if (complaintMatch) {
        const complaintId = complaintMatch[1];
        return <ComplaintDetails complaintId={complaintId} onNavigate={navigateTo} />;
      }

      // Legacy patterns
      if (currentPath.startsWith('/user/tracking/')) {
        const bookingId = currentPath.split('/').pop();
        return <LiveTracking bookingId={bookingId} />;
      }

      if (currentPath.startsWith('/user/chat/')) {
        const bookingId = currentPath.split('/').pop();
        return <ChatMessaging bookingId={bookingId} />;
      }

      return <UserDashboard onNavigate={navigateTo} />;
    }

    // Servicer Routes
    if (user.role === 'servicer') {
      switch (currentPath) {
        case '/servicer/dashboard':
          return <ServicerDashboard onNavigate={navigateTo}/>;
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
        case '/servicer/notifications':
          return <ServicerNotifications />;
        case '/servicer/mycomplaints':
          return <ServicerComplaints  />;
        case '/servicer/refunds':
          return <RefundManagement onNavigate={navigateTo} />;
        case '/servicer/status':
          return <ServicerAccountStatus onNavigate={navigateTo}/>;
        
        // ✅ UPDATED: Transaction Issue Chat Route
        case '/servicer/chat': {
          const { issue_id } = getQueryParams();
          if (issue_id) {
            // Show standalone chat page with specific issue
            return <TransactionIssueChat issueId={issue_id} userRole="servicer" onNavigate={navigateTo} />;
          }
          // Show list of all transaction issues
          return <ServicerTransactionIssues />;
        }
      }

      const refundMatch = currentPath.match(/^\/servicer\/refunds\/([^\/]+)$/);
if (refundMatch) {
  const bookingId = refundMatch[1];
  return <ProcessRefund bookingId={bookingId} onNavigate={navigateTo} />;
}
      // Dynamic routes
      const chatMatch = currentPath.match(/^\/servicer\/chat\/([^\/]+)$/);
      if (chatMatch) {
        const bookingId = chatMatch[1];
        return <ChatMessaging bookingId={bookingId} />;
      }

      const trackingMatch = currentPath.match(/^\/servicer\/tracking\/([^\/]+)$/);
      if (trackingMatch) {
        const bookingId = trackingMatch[1];
        return <LiveTracking bookingId={bookingId} />;
      }

      const requestMatch = currentPath.match(/^\/servicer\/requests\/([^\/]+)$/);
      if (requestMatch) {
        const requestId = requestMatch[1];
        return <BookingDetails bookingId={requestId} onNavigate={navigateTo} />;
      }

       const complaintMatch = currentPath.match(/^\/servicer\/complaint\/([^\/]+)$/);
  if (complaintMatch) {
    const complaintId = complaintMatch[1];
    return <ServicerComplaintDetails complaintId={complaintId} onNavigate={navigateTo} />;
  }


      return <ServicerDashboard />;
    }

    // Admin Routes
   if (user.role === 'admin') {

     const servicerDocumentsMatch = currentPath.match(/^\/admin\/verify-servicers\/([^\/]+)\/documents$/);
  if (servicerDocumentsMatch) {
    const servicerId = servicerDocumentsMatch[1];
    return <ServicerDocumentsViewer servicerId={servicerId} onNavigate={navigateTo} />;
  }

     // ✅ NEW: Servicer Verification Details Route (add this near the top)
  const servicerVerificationMatch = currentPath.match(/^\/admin\/verify-servicers\/([^\/]+)\/details$/);
  if (servicerVerificationMatch) {
    const servicerId = servicerVerificationMatch[1];
    return <ViewServicerDocDetails servicerId={servicerId} onNavigate={navigateTo} />;
  }
  // ✅ Check dynamic routes FIRST before the switch statement
  const suspendMatch = currentPath.match(/^\/admin\/users\/([^\/]+)\/suspend$/);
  if (suspendMatch) {
    const userId = suspendMatch[1];
    return <SuspendUserPage userId={userId} onNavigate={navigateTo} />;
  }

  const viewDetailsMatch = currentPath.match(/^\/admin\/users\/([^\/]+)\/details$/);
  if (viewDetailsMatch) {
    const userId = viewDetailsMatch[1];
    return <ViewUserDetails userId={userId} onNavigate={navigateTo} />;
  }

    const bookingDetailsMatch = currentPath.match(/^\/admin\/bookings\/([^\/]+)\/details$/);
  if (bookingDetailsMatch) {
    const bookingId = bookingDetailsMatch[1];
    return <ViewBookingDetails bookingId={bookingId} onNavigate={navigateTo} />;
  }

   const transactionDetailsMatch = currentPath.match(/^\/admin\/transactions\/([^\/]+)\/details$/);
  if (transactionDetailsMatch) {
    const transactionId = transactionDetailsMatch[1];
    return <ViewTransactionDetails transactionId={transactionId} onNavigate={navigateTo} />;
  }
  const issueDetailsMatch = currentPath.match(/^\/admin\/issues\/([^\/]+)\/details$/);
  if (issueDetailsMatch) {
    const issueId = issueDetailsMatch[1];
    return <ViewIssueDetails issueId={issueId} onNavigate={navigateTo} />;
  }
  const transactionIssueResolveMatch = currentPath.match(/^\/admin\/issues\/transaction\/([^\/]+)\/resolve$/);
  if (transactionIssueResolveMatch) {
    const issueId = transactionIssueResolveMatch[1];
    return <ResolveTransactionIssue issueId={issueId} onNavigate={navigateTo} />;
  }

 const transactionIssueDetailsMatch = currentPath.match(/^\/admin\/issues\/transaction\/([^\/]+)\/details$/);
  if (transactionIssueDetailsMatch) {
    const issueId = transactionIssueDetailsMatch[1];
    return <ViewTransactionIssues issueId={issueId} onNavigate={navigateTo} />;
  }


  // ✅ NEW: Complaint Routes (must come before servicer suspend route to avoid conflicts)
  const complaintResolveMatch = currentPath.match(/^\/admin\/complaints\/([^\/]+)\/resolve$/);
  if (complaintResolveMatch) {
    const complaintId = complaintResolveMatch[1];
    return <ResolveComplaint complaintId={complaintId} onNavigate={navigateTo} />;
  }

  const complaintDetailsMatch = currentPath.match(/^\/admin\/complaints\/([^\/]+)\/details$/);
  if (complaintDetailsMatch) {
    const complaintId = complaintDetailsMatch[1];
    return <ViewComplaintDetails complaintId={complaintId} onNavigate={navigateTo} />;
  }

  // ✅ Servicer Suspend Route
  const servicerSuspendMatch = currentPath.match(/^\/admin\/servicers\/([^\/]+)\/suspend$/);
  if (servicerSuspendMatch) {
    const servicerId = servicerSuspendMatch[1];
    return <SuspendServicerPage servicerId={servicerId} onNavigate={navigateTo} />;
  }

  const unsuspendMatch = currentPath.match(/^\/admin\/unsuspend-user\/([^\/]+)$/);
if (unsuspendMatch) {
  const userId = unsuspendMatch[1];
  return <UnsuspendUserPage userId={userId} onNavigate={navigateTo} />;
}




  // ✅ Then handle static routes
  switch (currentPath) {
    case '/admin/dashboard':
      return <AdminDashboard  onNavigate={navigateTo}/>;
    case '/admin/verify-servicers':
      return <VerifyServicers onNavigate={navigateTo}/>;
    case '/admin/users':
      return <AdminManageUsers onNavigate={navigateTo}/>;
    case '/admin/bookings':
      return <AdminManageBookings onNavigate={navigateTo} />;
    case '/admin/transactions':
      return <AdminTransactions onNavigate={navigateTo} />;
    case '/admin/payouts':
      return <AdminPayouts />;
    case '/admin/categories':
      return <AdminCategories />;
    case '/admin/issues':
      return <AdminManageIssues onNavigate={navigateTo} />;
    case '/admin/issues/transcation':
      return <AdminTransactionIssues onNavigate={navigateTo} />;
    case '/admin/complaints':
      return <AdminComplaints onNavigate={navigateTo} />;
    case '/admin/Blacklist':
      return <AdminBlacklist onNavigate={navigateTo} />;
    case '/admin/ban-user':
      return <BanUserPage onNavigate={navigateTo} />;

    // ✅ UPDATED: Transaction Issue Chat Route
    case '/admin/chat': {
      const { issue_id } = getQueryParams();
      if (issue_id) {
        return <TransactionIssueChat issueId={issue_id} userRole="admin" onNavigate={navigateTo} />;
      }
      return <AdminTransactionIssues />;
    }
    
    default:
      return <AdminDashboard onNavigate={navigateTo} />;
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

  if (!user || currentPath === '/login' || currentPath === '/signup' || currentPath === '/verify-email' || currentPath === '/forgot-password' || currentPath === '/reset-password' || currentPath === '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {isNavigating && <DarkProgressBar />}

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
        <ToastProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;