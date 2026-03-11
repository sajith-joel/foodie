import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/ui/GlassCard';
import { useNotifications } from '../../hooks/useNotifications';
import { getPartnerAssignedOrders, updateDeliveryStatus } from '../../services/deliveryService';
import { getOrderById } from '../../services/orderService';
import DeliveryNotifications from '../../components/notifications/DeliveryNotifications';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ArrowPathIcon,
  PhoneIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { notifyOrderStatus } = useNotifications();
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    totalEarnings: 0,
    currentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Fetching delivery dashboard data for partner:', user?.uid);
      
      // Get all orders for this partner
      const assignedOrders = await getPartnerAssignedOrders(user?.uid);
      console.log('All orders:', assignedOrders);
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Calculate stats
      const completedDeliveries = assignedOrders.filter(order => 
        order.status === 'delivered'
      ).length;
      
      const pendingDeliveries = assignedOrders.filter(order => 
        ['out_for_delivery', 'assigned', 'picked_up'].includes(order.status)
      ).length;
      
      // Calculate today's deliveries (orders delivered today)
      const todayDeliveries = assignedOrders.filter(order => {
        if (order.status !== 'delivered') return false;
        const deliveredAt = order.deliveredAt || order.updatedAt;
        if (!deliveredAt) return false;
        const deliveredDate = new Date(deliveredAt);
        return deliveredDate >= today && deliveredDate < tomorrow;
      }).length;
      
      // Calculate earnings (₹50 per delivered order)
      const totalEarnings = completedDeliveries * 50;

      // Format current orders for display - ONLY non-delivered orders
      const currentOrders = assignedOrders
        .filter(order => {
          // Only show orders that are NOT delivered and NOT cancelled
          return !['delivered', 'cancelled'].includes(order.status);
        })
        .map(order => ({
          id: order.id?.slice(-6),
          fullId: order.id,
          customerName: order.customerName || order.customer?.name || 'Customer',
          customerPhone: order.customerPhone || order.customer?.phone || '',
          address: order.customerAddress || order.customer?.address || 'Address not specified',
          deliveryLocation: order.deliveryLocation || null,
          items: order.items?.map(item => 
            `${item.name} (${item.quantity}x)`
          ) || [],
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          assignedAt: order.assignedAt
        }));

      console.log('Current orders (non-delivered):', currentOrders);
      console.log('Today deliveries:', todayDeliveries);
      console.log('Completed deliveries:', completedDeliveries);

      setStats({
        todayDeliveries,
        completedDeliveries,
        pendingDeliveries,
        totalEarnings,
        currentOrders
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to ${newStatus}`);
      
      // Get order details before update
      const order = await getOrderById(orderId);
      
      // Update status in Firestore
      await updateDeliveryStatus(orderId, newStatus);
      
      // Notify student about status change
      if (order && order.userId) {
        await notifyOrderStatus(order.userId, {
          id: orderId
        }, newStatus);
      }

      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      
      // Immediately refresh dashboard data
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleContactCustomer = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('Customer phone number not available');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Notification Bell */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <div className="flex items-center space-x-4">
          <DeliveryNotifications onOrderComplete={fetchDashboardData} />
          <button
            onClick={fetchDashboardData}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Deliveries</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayDeliveries}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedDeliveries}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingDeliveries}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Earnings</p>
              <p className="text-2xl font-bold text-primary-600">₹{stats.totalEarnings}</p>
            </div>
            <div className="bg-primary-500 p-3 rounded-lg">
              <CurrencyRupeeIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Current Orders - Only shows active orders */}
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Current Orders</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {stats.currentOrders.length} active orders
            </span>
            <button
              onClick={fetchDashboardData}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {stats.currentOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No active orders at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.currentOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">Order #{order.id}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Customer Name */}
                    <div className="flex items-center mt-2">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p className="text-sm font-medium text-gray-700">{order.customerName}</p>
                    </div>
                    
                    {/* Phone Number with Call Button */}
                    {order.customerPhone && (
                      <div className="flex items-center mt-1">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-600 mr-2">{order.customerPhone}</span>
                        <button
                          onClick={() => handleContactCustomer(order.customerPhone)}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          Call
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-primary-600">₹{order.total}</span>
                </div>

                {/* Delivery Location */}
                {order.deliveryLocation ? (
                  <div className="bg-blue-50 p-3 rounded-lg mb-3">
                    <div className="flex items-start">
                      <MapPinIcon className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          {order.deliveryLocation.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {order.deliveryLocation.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 text-sm text-gray-600 mb-3">
                    <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{order.address}</span>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-3 bg-gray-50 p-2 rounded">
                  <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
                  <ul className="text-sm text-gray-700">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                  <div className="space-x-2">
                    {order.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(order.fullId, 'picked_up')}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Picked Up
                      </button>
                    )}
                    {order.status === 'picked_up' && (
                      <button
                        onClick={() => handleUpdateStatus(order.fullId, 'out_for_delivery')}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleUpdateStatus(order.fullId, 'delivered')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            to="/delivery/orders"
            className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
          >
            View All Orders
            <span className="ml-1">→</span>
          </Link>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={fetchDashboardData}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <ArrowPathIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={() => window.location.href = '/delivery/orders'}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">All Orders</span>
          </button>
          <button
            onClick={() => toast.success('Location shared')}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Share Location</span>
          </button>
          <button
            onClick={() => toast.success('Status updated to Available')}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Mark Available</span>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default DeliveryDashboard;