import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon, UserIcon, BellIcon, Bars3Icon, GiftIcon } from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';
import GameModal from '../games/GameModal';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);

  const cartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getDashboardLink = () => {
    switch(role) {
      case 'admin': return '/admin';
      case 'delivery': return '/delivery';
      default: return '/menu';
    }
  };

  return (
    <>
      {/* Game Modal */}
      <GameModal isOpen={showGameModal} onClose={() => setShowGameModal(false)} />

      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Left section - Logo and menu button */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              
              <Link to={getDashboardLink()} className="flex items-center space-x-2">
                <img src={logo} alt="Campus Food" className="h-7 w-auto sm:h-8" />
                <span className="font-bold text-base sm:text-xl text-primary-600 hidden xs:inline">
                  CampusFood
                </span>
              </Link>
            </div>

            {/* Right section - Icons and user menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Play & Win Button - Text button */}
              {role === 'student' && (
                <button
                  onClick={() => setShowGameModal(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm sm:text-base font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  🎮 Play & Win
                </button>
              )}

              {/* Cart Icon - Only for students */}
              {role === 'student' && (
                <Link to="/cart" className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 hover:text-primary-600" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="User menu"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  </div>
                  <span className="hidden md:block text-xs sm:text-sm font-medium text-gray-700">
                    {user?.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 border z-50">
                    <Link
                      to="/profile"
                      className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;