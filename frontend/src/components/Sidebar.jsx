import React from 'react';
import {
  Home, Search, Calendar, Wallet, Bell, User, X, Clock, Star, 
  MessageCircle, FileText, Shield, Users, DollarSign, Package, 
  TrendingUp, Briefcase, Upload, BarChart3, Inbox, History, 
  FileWarning, Settings, ListChecks, ClipboardList, Ban
} from 'lucide-react';

const Sidebar = ({ role, currentPath, onNavigate, sidebarOpen, setSidebarOpen, onLogout }) => {

  // ========== MENU ITEMS ==========
  const getMenuItems = () => {
    switch(role) {
      case 'user':
        return [
          { title: 'Dashboard', icon: Home, path: '/user/dashboard' },
          { title: 'Search Services', icon: Search, path: '/user/search' },
          { title: 'My Bookings', icon: Calendar, path: '/user/bookings' },
          { title: 'Booking History', icon: History, path: '/user/history' },
          { title: 'Favorites', icon: Star, path: '/user/favorites' },
          { title: 'Complaints', icon: FileWarning, path: '/user/complaints' },
          { title: 'Create Complaint', icon: MessageCircle, path: '/user/complaints/create' },
          { title: 'Wallet', icon: Wallet, path: '/user/wallet' },
          { title: 'Profile', icon: User, path: '/user/profile' },
        ];

      case 'servicer':
        return [
          { title: 'Dashboard', icon: Home, path: '/servicer/dashboard' },
          { title: 'Upload Documents', icon: Upload, path: '/servicer/upload-documents' },
          { title: 'Service Requests', icon: Inbox, path: '/servicer/requests' },
          { title: 'Active Services', icon: Briefcase, path: '/servicer/active-services' },
          { title: 'Earnings & Payouts', icon: DollarSign, path: '/servicer/earnings' },
          { title: 'Reviews', icon: Star, path: '/servicer/reviews' },
          { title: 'Notifications', icon: Bell, path: '/servicer/notifications' },
          { title: 'Refunds', icon: ClipboardList, path: '/servicer/refunds' },
          { title: 'Status', icon: BarChart3, path: '/servicer/status' },
          { title: 'Profile', icon: User, path: '/servicer/profile' },
        ];

      case 'admin':
        return [
          { title: 'Dashboard', icon: Home, path: '/admin/dashboard' },
          { title: 'Verify Servicers', icon: Shield, path: '/admin/verify-servicers' },
          { title: 'Manage Users', icon: Users, path: '/admin/users' },
          { title: 'Manage Bookings', icon: Calendar, path: '/admin/bookings' },
          { title: 'Transactions', icon: DollarSign, path: '/admin/transactions' },
          { title: 'Payout Requests', icon: TrendingUp, path: '/admin/payouts' },
          { title: 'Service Categories', icon: Package, path: '/admin/categories' },
          { title: 'Booking Issues', icon: FileWarning, path: '/admin/issues' },
          { title: 'Transaction Issues', icon: ListChecks, path: '/admin/issues/transcation' },
          { title: 'Complaints', icon: MessageCircle, path: '/admin/complaints' },
          { title: 'Blacklist', icon: Ban, path: '/admin/Blacklist' },
         
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  // ========== ROLE COLORS ==========
  const getBrandColor = () => {
    switch(role) {
      case 'user': return 'bg-indigo-600';
      case 'servicer': return 'bg-green-600';
      case 'admin': return 'bg-purple-600';
      default: return 'bg-indigo-600';
    }
  };

  const getActiveColor = () => {
    switch(role) {
      case 'user': return 'bg-indigo-50 text-indigo-600';
      case 'servicer': return 'bg-green-50 text-green-600';
      case 'admin': return 'bg-purple-50 text-purple-600';
      default: return 'bg-indigo-50 text-indigo-600';
    }
  };

  const getRoleTitle = () => {
    switch(role) {
      case 'user': return 'ServiceApp';
      case 'servicer': return 'ServiceApp Pro';
      case 'admin': return 'ServiceApp Admin';
      default: return 'ServiceApp';
    }
  };

  // ========== JSX ==========
  return (
    <>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className={`w-10 h-10 ${getBrandColor()} rounded-lg flex items-center justify-center`}>
              <Home className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <span className="text-lg font-bold text-gray-900">{getRoleTitle()}</span>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition ${
                  isActive ? getActiveColor() : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium text-sm">{item.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
