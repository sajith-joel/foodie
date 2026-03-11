import { NavLink, useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useEffect } from 'react';
import {
  HomeIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  XMarkIcon,
  CubeIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, onClose }) => {
  const { role, isAdmin, isDelivery, isStudent } = useRole();

  useEffect(() => {
    console.log('📱 Sidebar - Current role:', role);
    console.log('📱 Sidebar - isAdmin:', isAdmin);
    console.log('📱 Sidebar - isDelivery:', isDelivery);
    console.log('📱 Sidebar - isStudent:', isStudent);
  }, [role, isAdmin, isDelivery, isStudent]);

  // Student links - ONLY for students
  const studentLinks = [
    { to: '/menu', icon: ShoppingBagIcon, label: 'Browse Menu' },
    { to: '/cart', icon: ShoppingBagIcon, label: 'My Cart' },
    { to: '/my-orders', icon: ClipboardDocumentListIcon, label: 'My Orders' },
  ];

  // Admin links - ONLY for admins
  const adminLinks = [
    { to: '/admin', icon: HomeIcon, label: 'Dashboard' },
    { to: '/admin/analytics', icon: ChartBarIcon, label: 'Analytics' },
    { to: '/admin/menu', icon: CubeIcon, label: 'Manage Menu' },
    { to: '/admin/orders', icon: ClipboardDocumentListIcon, label: 'All Orders' },
    { to: '/admin/delivery-boys', icon: UserGroupIcon, label: 'Delivery Partners' },
  ];

  // Delivery links - ONLY for delivery partners
  const deliveryLinks = [
    { to: '/delivery', icon: HomeIcon, label: 'Dashboard' },
    { to: '/delivery/orders', icon: TruckIcon, label: 'Assigned Orders' },
  ];

  const getLinks = () => {
    if (isAdmin) {
      console.log('📱 Sidebar - Rendering admin links');
      return adminLinks;
    } else if (isDelivery) {
      console.log('📱 Sidebar - Rendering delivery links');
      return deliveryLinks;
    } else {
      console.log('📱 Sidebar - Rendering student links');
      return studentLinks;
    }
  };

  const links = getLinks();

  // Mobile Sidebar
  const sidebarContent = (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-primary-600 text-lg">
          {isAdmin ? 'Admin Panel' : isDelivery ? 'Delivery Panel' : 'Student Menu'}
        </h2>
        <button onClick={onClose} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
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
        ))}
      </nav>

      {/* User info footer */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold text-sm">
              {role === 'admin' ? 'A' : role === 'delivery' ? 'D' : 'S'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 capitalize">Role: {role}</p>
            <p className="text-xs text-gray-500">Logged in</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={`absolute left-0 top-0 h-full w-72 bg-white transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 bg-white shadow-lg h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;