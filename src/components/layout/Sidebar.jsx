import { NavLink } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useState } from 'react';
import {
  HomeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  XMarkIcon,
  CubeIcon,
  CurrencyRupeeIcon,
  GiftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import GameModal from '../games/GameModal';

const Sidebar = ({ isOpen, onClose }) => {
  const { role, isAdmin, isDelivery, isStudent } = useRole();
  const [showGameModal, setShowGameModal] = useState(false);

  const studentLinks = [
    { to: '/menu', icon: ShoppingBagIcon, label: 'Browse Menu' },
    { to: '/cart', icon: ShoppingBagIcon, label: 'My Cart' },
    { to: '/my-orders', icon: ClipboardDocumentListIcon, label: 'My Orders' },
    { 
      to: '#', 
      icon: GiftIcon, 
      label: 'Play & Win', 
      onClick: () => setShowGameModal(true),
      special: true 
    },
  ];

  const adminLinks = [
    { to: '/admin', icon: HomeIcon, label: 'Dashboard' },
    { to: '/admin/analytics', icon: ChartBarIcon, label: 'Analytics' },
    { to: '/admin/menu', icon: CubeIcon, label: 'Manage Menu' },
    { to: '/admin/orders', icon: ClipboardDocumentListIcon, label: 'All Orders' },
    { to: '/admin/delivery-boys', icon: UserGroupIcon, label: 'Delivery Partners' },
    { to: '/admin/spin-wheel', icon: SparklesIcon, label: 'Spin Wheel' },
  ];

  const deliveryLinks = [
    { to: '/delivery', icon: HomeIcon, label: 'Dashboard' },
    { to: '/delivery/orders', icon: TruckIcon, label: 'Assigned Orders' },
  ];

  const getLinks = () => {
    if (isAdmin) return adminLinks;
    if (isDelivery) return deliveryLinks;
    return studentLinks;
  };

  const links = getLinks();

  const handleLinkClick = (link) => {
    if (link.onClick) {
      link.onClick();
    }
    onClose();
  };

  return (
    <>
      <GameModal isOpen={showGameModal} onClose={() => setShowGameModal(false)} />

      {/* Mobile Sidebar - Slide from left */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Sidebar Panel */}
        <div 
          className={`absolute left-0 top-0 h-full w-64 sm:w-72 bg-white transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-primary-600 text-base sm:text-lg">
                {isAdmin ? 'Admin Panel' : isDelivery ? 'Delivery Panel' : 'Student Menu'}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
              {links.map((link) => (
                link.special ? (
                  <button
                    key={link.label}
                    onClick={() => handleLinkClick(link)}
                    className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 group"
                  >
                    <link.icon className="h-5 w-5 sm:h-5 sm:w-5 group-hover:text-purple-600" />
                    <span className="font-medium flex items-center">
                      {link.label}
                      <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 text-yellow-500 animate-pulse" />
                    </span>
                  </button>
                ) : (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <link.icon className="h-5 w-5 sm:h-5 sm:w-5" />
                    <span className="font-medium">{link.label}</span>
                  </NavLink>
                )
              ))}
            </nav>

            {/* User Info Footer */}
            <div className="p-3 sm:p-4 border-t">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-xs sm:text-sm">
                    {role === 'admin' ? 'A' : role === 'delivery' ? 'D' : 'S'}
                  </span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 capitalize">{role}</p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden lg:block w-64 xl:w-72 bg-white shadow-lg h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        <div className="h-full flex flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => (
              link.special ? (
                <button
                  key={link.label}
                  onClick={() => handleLinkClick(link)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 group"
                >
                  <link.icon className="h-5 w-5 group-hover:text-purple-600" />
                  <span className="font-medium flex items-center">
                    {link.label}
                    <SparklesIcon className="h-4 w-4 ml-2 text-yellow-500 animate-pulse" />
                  </span>
                </button>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </NavLink>
              )
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {role === 'admin' ? 'A' : role === 'delivery' ? 'D' : 'S'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 capitalize">{role}</p>
                <p className="text-xs text-gray-500">Logged in</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;