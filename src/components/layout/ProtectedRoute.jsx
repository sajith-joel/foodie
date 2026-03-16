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

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'delivery') {
      return <Navigate to="/delivery" replace />;
    } else {
      return <Navigate to="/menu" replace />;
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;