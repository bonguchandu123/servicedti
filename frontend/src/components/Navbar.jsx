import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Search, Calendar, Wallet, Bell, User, Clock, Star, 
  MessageCircle, FileText, Shield, Users, DollarSign, Package, 
  TrendingUp, Briefcase, Upload, BarChart3, Inbox, History, 
  FileWarning, Settings, ListChecks, ClipboardList, Ban, ChevronDown, LogOut, Menu, X, LayoutGrid
} from 'lucide-react';

const Navbar = ({ role, currentPath, onNavigate, onLogout, layoutMode, onLayoutToggle, user }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef({});

  // Get user's display name and email
  const userName = user?.name || user?.full_name || 'User';
  const userEmail = user?.email || 'user@example.com';
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown].contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // ========== MENU ITEMS ==========
  const getMenuItems = () => {
    switch(role) {
      case 'user':
        return [
          { 
            title: 'Home', 
            icon: Home, 
            path: '/user/dashboard',
            items: [
              { 
                title: 'Dashboard', 
                path: '/user/dashboard', 
                icon: Home,
                description: 'View your overview, stats, and recent activities'
              },
              { 
                title: 'Search Services', 
                path: '/user/search', 
                icon: Search,
                description: 'Find and book service providers near you'
              },
            ]
          },
          { 
            title: 'Bookings', 
            icon: Calendar,
            items: [
              { 
                title: 'My Bookings', 
                path: '/user/bookings', 
                icon: Calendar,
                description: 'Manage and track your active service bookings'
              },
              { 
                title: 'Booking History', 
                path: '/user/history', 
                icon: History,
                description: 'View past bookings and completed services'
              },
            ]
          },
          { 
            title: 'Account', 
            icon: User,
            items: [
              { 
                title: 'Favorites', 
                path: '/user/favorites', 
                icon: Star,
                description: 'Quick access to your favorite service providers'
              },
              { 
                title: 'Complaints', 
                path: '/user/complaints', 
                icon: FileWarning,
                description: 'Track and manage your service complaints'
              },
              { 
                title: 'Create Complaint', 
                path: '/user/complaints/create', 
                icon: MessageCircle,
                description: 'Report an issue or file a new complaint'
              },
              { 
                title: 'Wallet', 
                path: '/user/wallet', 
                icon: Wallet,
                description: 'Manage payments, transactions, and refunds'
              },
              { 
                title: 'Profile', 
                path: '/user/profile', 
                icon: User,
                description: 'Update your personal information and settings'
              },
            ]
          }
        ];

      case 'servicer':
        return [
          { 
            title: 'Home', 
            icon: Home, 
            path: '/servicer/dashboard',
            items: [
              { 
                title: 'Dashboard', 
                path: '/servicer/dashboard', 
                icon: Home,
                description: 'View your earnings, requests, and performance metrics'
              },
              { 
                title: 'Upload Documents', 
                path: '/servicer/upload-documents', 
                icon: Upload,
                description: 'Submit verification documents and certificates'
              },
            ]
          },
          { 
            title: 'Services', 
            icon: Briefcase,
            items: [
              { 
                title: 'Service Requests', 
                path: '/servicer/requests', 
                icon: Inbox,
                description: 'Accept or decline new service booking requests'
              },
              { 
                title: 'Active Services', 
                path: '/servicer/active-services', 
                icon: Briefcase,
                description: 'Manage ongoing jobs and in-progress bookings'
              },
              { 
                title: 'Reviews', 
                path: '/servicer/reviews', 
                icon: Star,
                description: 'View customer feedback and service ratings'
              },
            ]
          },
          { 
            title: 'Management', 
            icon: Settings,
            items: [
              { 
                title: 'Earnings & Payouts', 
                path: '/servicer/earnings', 
                icon: DollarSign,
                description: 'Track income, request withdrawals, and view history'
              },
              { 
                title: 'Refunds', 
                path: '/servicer/refunds', 
                icon: ClipboardList,
                description: 'Process and manage customer refund requests'
              },
              { 
                title: 'Status', 
                path: '/servicer/status', 
                icon: BarChart3,
                description: 'Monitor account health, warnings, and compliance'
              },
              { 
                title: 'Notifications', 
                path: '/servicer/notifications', 
                icon: Bell,
                description: 'Stay updated with important alerts and messages'
              },
              { 
                title: 'Profile', 
                path: '/servicer/profile', 
                icon: User,
                description: 'Manage your professional profile and services'
              },
            ]
          }
        ];

      case 'admin':
        return [
          { 
            title: 'Home', 
            icon: Home, 
            path: '/admin/dashboard',
            description: 'Overview of platform metrics and system health'
          },
          { 
            title: 'Users', 
            icon: Users,
            items: [
              { 
                title: 'Verify Servicers', 
                path: '/admin/verify-servicers', 
                icon: Shield,
                description: 'Review and approve new service provider applications'
              },
              { 
                title: 'Manage Users', 
                path: '/admin/users', 
                icon: Users,
                description: 'View, edit, and manage user accounts and permissions'
              },
              { 
                title: 'Blacklist', 
                path: '/admin/Blacklist', 
                icon: Ban,
                description: 'Manage suspended accounts and blocked users'
              },
            ]
          },
          { 
            title: 'Operations', 
            icon: Briefcase,
            items: [
              { 
                title: 'Manage Bookings', 
                path: '/admin/bookings', 
                icon: Calendar,
                description: 'Monitor and oversee all platform service bookings'
              },
              { 
                title: 'Transactions', 
                path: '/admin/transactions', 
                icon: DollarSign,
                description: 'Track payments, refunds, and financial transactions'
              },
              { 
                title: 'Payout Requests', 
                path: '/admin/payouts', 
                icon: TrendingUp,
                description: 'Process and approve servicer withdrawal requests'
              },
            ]
          },
          { 
            title: 'Support', 
            icon: MessageCircle,
            items: [
              { 
                title: 'Service Categories', 
                path: '/admin/categories', 
                icon: Package,
                description: 'Add and manage available service categories'
              },
              { 
                title: 'Booking Issues', 
                path: '/admin/issues', 
                icon: FileWarning,
                description: 'Resolve disputes and problems with bookings'
              },
              { 
                title: 'Transaction Issues', 
                path: '/admin/issues/transcation', 
                icon: ListChecks,
                description: 'Handle payment and transaction-related problems'
              },
              { 
                title: 'Complaints', 
                path: '/admin/complaints', 
                icon: MessageCircle,
                description: 'Review and mediate customer service complaints'
              },
            ]
          }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getBrandColor = () => {
    switch(role) {
      case 'user': return 'bg-blue-600 hover:bg-blue-700';
      case 'servicer': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'admin': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-blue-600 hover:bg-blue-700';
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

  const handleNavigate = (path) => {
    onNavigate(path);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getBrandColor().split(' ')[0]} rounded-xl flex items-center justify-center shadow-md`}>
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">{getRoleTitle()}</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:!flex items-center gap-1">
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                className="relative"
                ref={el => dropdownRefs.current[item.title] = el}
              >
                {item.items ? (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.title ? null : item.title)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span>{item.title}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.title ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {openDropdown === item.title && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {item.items.map((subItem, subIndex) => (
                          <button
                            key={subIndex}
                            onClick={() => handleNavigate(subItem.path)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                              currentPath === subItem.path ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              currentPath === subItem.path ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <subItem.icon className={`w-5 h-5 ${
                                currentPath === subItem.path ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-sm mb-0.5 ${
                                currentPath === subItem.path ? 'text-blue-700' : 'text-gray-900'
                              }`}>
                                {subItem.title}
                              </div>
                              {subItem.description && (
                                <div className="text-xs text-gray-600 leading-relaxed">
                                  {subItem.description}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleNavigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPath === item.path 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Layout Toggle - Small Switch */}
            <div className="hidden lg:!flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <button
                onClick={() => onLayoutToggle?.('sidebar')}
                className={`p-1.5 rounded transition-all ${
                  layoutMode === 'sidebar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Sidebar Layout"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLayoutToggle?.('navbar')}
                className={`p-1.5 rounded transition-all ${
                  layoutMode === 'navbar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Navbar Layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications */}
            <button className="hidden lg:!flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="hidden lg:!block relative" ref={el => dropdownRefs.current['profile'] = el}>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {userInitial}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${openDropdown === 'profile' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'profile' && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{userEmail}</p>
                  </div>
                  <button
                    onClick={() => handleNavigate(`/${role}/profile`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavigate(`/${role}/notifications`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => handleNavigate(`/${role}/profile`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="lg:hidden fixed inset-y-0 right-0 w-80 max-w-full bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
            <div className="p-4">
              {/* Close Button */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <div key={index}>
                    {item.items ? (
                      <>
                        <button
                          onClick={() => {
                            setOpenDropdown(openDropdown === item.title ? null : item.title);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.title ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === item.title && (
                          <div className="mt-2 ml-4 space-y-1 pb-2">
                            {item.items.map((subItem, subIndex) => (
                              <button
                                key={subIndex}
                                onClick={() => {
                                  handleNavigate(subItem.path);
                                }}
                                className={`w-full flex items-start gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
                                  currentPath === subItem.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <subItem.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="text-left flex-1">
                                  <div className="font-medium">{subItem.title}</div>
                                  {subItem.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">{subItem.description}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleNavigate(item.path);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          currentPath === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <span>{item.title}</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* User Profile Section */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {userInitial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{userName}</p>
                        <p className="text-xs text-gray-500">{userEmail}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleNavigate(`/${role}/profile`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleNavigate(`/${role}/notifications`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Layout Toggle - Mobile */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-4 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Layout Mode</p>
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => {
                          onLayoutToggle?.('sidebar');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md transition-all ${
                          layoutMode === 'sidebar'
                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Menu className="w-4 h-4" />
                        <span className="text-sm">Sidebar</span>
                      </button>
                      <button
                        onClick={() => {
                          onLayoutToggle?.('navbar');
                          setMobileMenuOpen(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md transition-all ${
                          layoutMode === 'navbar'
                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-sm">Navbar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;