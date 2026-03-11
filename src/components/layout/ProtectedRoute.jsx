import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  console.log('🛡️ ProtectedRoute - Path:', location.pathname);
  console.log('🛡️ ProtectedRoute - User:', user?.email);
  console.log('🛡️ ProtectedRoute - Role:', role);
  console.log('🛡️ ProtectedRoute - Allowed roles:', allowedRoles);

  // Show loading while checking auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    console.log('🛡️ No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has allowed role
  if (!allowedRoles.includes(role)) {
    console.log(`🛡️ Role ${role} not allowed. Redirecting to appropriate page`);
    
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'delivery') {
      return <Navigate to="/delivery" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  // User has correct role - show the page with Navbar and Sidebar
  console.log('🛡️ Access granted - showing page with Navbar');
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;