import { useState, useEffect } from 'react'; // Add useEffect
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { useCart } from '../../hooks/useCart';
import { ShoppingCartIcon, UserIcon, BellIcon, Bars3Icon } from '@heroicons/react/24/outline';
import NotificationBell from '../notifications/NotificationBell';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔍 Navbar - Current role:', role);
    console.log('🔍 Navbar - Dashboard link:', getDashboardLink());
  }, [role]);

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
      case 'admin': 
        console.log('🔍 Navbar - Admin detected, linking to /admin');
        return '/admin';
      case 'delivery': 
        console.log('🔍 Navbar - Delivery detected, linking to /delivery');
        return '/delivery';
      default: 
        console.log('🔍 Navbar - Student detected, linking to /menu');
        return '/menu';
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <Link to={getDashboardLink()} className="flex items-center space-x-2">
              <img src={logo} alt="Campus Food" className="h-8 w-auto" />
              <span className="font-bold text-xl text-primary-600">CampusFood</span>
            </Link>
            
            {/* Debug badge - remove after testing */}
            <span className="hidden lg:inline-block ml-2 px-2 py-1 bg-gray-100 text-xs rounded">
              Role: {role}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {role === 'student' && (
              <Link to="/cart" className="relative p-2">
                <ShoppingCartIcon className="h-6 w-6 text-gray-600 hover:text-primary-600" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            <NotificationBell />

            {/* User Menu with Logout */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary-600" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.email?.split('@')[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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