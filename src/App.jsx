import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RoleProvider } from './context/RoleContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useRole } from './hooks/useRole';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Menu from './pages/student/Menu';
import Cart from './pages/student/Cart';
import MyOrders from './pages/student/MyOrders';
import OrderTracking from './pages/student/OrderTracking';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import ManageMenu from './pages/admin/ManageMenu';
import ManageDeliveryBoys from './pages/admin/ManageDeliveryBoys';
import OrdersManagement from './pages/admin/OrdersManagement';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import AssignedOrders from './pages/delivery/AssignedOrders';
import NotFound from './pages/NotFound';
import UserProfile from './components/profile/UserProfile';
import UserSettings from './components/profile/UserSettings';

// Layout component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className="flex-1 p-6">
          {children}
          {/* Debug info - remove in production */}
          <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
            <p><strong>Debug:</strong> Logged in as: {user?.email} | Role: {role}</p>
          </div>
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      // Add these routes inside your Routes component
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['student', 'admin', 'delivery']}>
          <UserProfile />
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['student', 'admin', 'delivery']}>
          <UserSettings />
        </ProtectedRoute>
      } />
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student Routes - only students can access */}
      <Route path="/menu" element={
        <ProtectedRoute allowedRoles={['student']}>  {/* Removed admin and delivery */}
          <Menu />
        </ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Cart />
        </ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}> {/* Admin can view orders */}
          <MyOrders />
        </ProtectedRoute>
      } />
      <Route path="/order-tracking/:orderId" element={
        <ProtectedRoute allowedRoles={['student', 'admin', 'delivery']}>
          <OrderTracking />
        </ProtectedRoute>
      } />

      {/* Admin Routes - only admin can access */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/admin/menu" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageMenu />
        </ProtectedRoute>
      } />
      <Route path="/admin/delivery-boys" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageDeliveryBoys />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <OrdersManagement />
        </ProtectedRoute>
      } />

      {/* Delivery Routes - only delivery can access */}
      <Route path="/delivery" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <DeliveryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/delivery/orders" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <AssignedOrders />
        </ProtectedRoute>
      } />

      {/* Default route - redirect based on role */}
      <Route path="/" element={<Navigate to="/menu" replace />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;