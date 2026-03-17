import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { RoleProvider } from './context/RoleContext';
import { DiscountProvider } from './context/DiscountContext'; // ✅ Import DiscountProvider
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
import StudentDashboard from './pages/student/StudentDashboard';
import ManageSpinWheel from './pages/admin/ManageSpinWheel';
import DeliveryOrderView from './pages/delivery/DeliveryOrderView';
import TailwindTest from './TailwindTest';


// Layout component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { role } = useRole();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 sm:p-6">
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
      // Add this route temporarily
      <Route path="/tailwind-test" element={<TailwindTest />} />
      {/* Student Dashboard Route */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />

      {/* Profile and Settings Routes */}
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
        <ProtectedRoute allowedRoles={['student']}>
          <Menu />
        </ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Cart />
        </ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute allowedRoles={['student', 'admin']}>
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

      {/* Admin Spin Wheel Management Route */}
      <Route path="/admin/spin-wheel" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <ManageSpinWheel />
        </ProtectedRoute>
      } />

      {/* Delivery Routes - only delivery can access */}
      <Route path="/delivery" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <DeliveryDashboard />
        </ProtectedRoute>
      } />
      <Route path="/delivery/order/:orderId" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <DeliveryOrderView />
        </ProtectedRoute>
      } />

      {/* Assigned Orders List Route */}
      <Route path="/delivery/orders" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <AssignedOrders />
        </ProtectedRoute>
      } />

      {/* Individual Order Tracking Route for Delivery */}
      <Route path="/delivery/orders/:orderId" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <OrderTracking />
        </ProtectedRoute>
      } />

      {/* Default route - redirect to menu */}
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
        <DiscountProvider> {/* ✅ Add DiscountProvider here */}
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </DiscountProvider>
      </RoleProvider>
    </AuthProvider>
  );
}

export default App;