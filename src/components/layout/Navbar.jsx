import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon, UserIcon, Bars3Icon } from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const cartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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
    switch (role) {
      case 'admin': return '/admin';
      case 'delivery': return '/delivery';
      default: return '/menu';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 safe-top">
      <div className="container-custom">
        <div className="flex justify-between items-center h-14">
          {/* Left section */}
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleSidebar}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center active:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="h-5 w-5 text-gray-700" />
            </button>

            <Link 
              to={getDashboardLink()} 
              className="flex items-center space-x-1.5 px-1 py-2 active:bg-gray-50 rounded-lg transition-colors"
            >
              <img src={logo} alt="Campus Food" className="h-6 w-auto" />
              <span className="font-semibold text-sm text-primary-600 hidden xs:inline">
                CampusFood
              </span>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-0.5">
            {role === 'student' && (
              <Link 
                to="/cart" 
                className="relative w-9 h-9 flex items-center justify-center active:bg-gray-100 rounded-lg transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCartIcon className="h-5 w-5 text-gray-700" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-primary-600 text-white text-[9px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </Link>
            )}

            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center active:bg-primary-100 transition-colors"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <UserIcon className="h-4 w-4 text-primary-600" />
              </button>

              {/* Dropdown Menu - iPhone Optimized */}
              {showUserMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-[13px] text-gray-700 active:bg-gray-50 transition-colors border-b border-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-3 text-[13px] text-gray-700 active:bg-gray-50 transition-colors border-b border-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-[13px] text-red-600 active:bg-red-50 transition-colors"
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
  );
};

export default Navbar;