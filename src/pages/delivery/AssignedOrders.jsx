import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { getPartnerAssignedOrders, updateDeliveryStatus } from '../../services/deliveryService';
import { getOrderById } from '../../services/orderService';
import { useNotifications } from '../../hooks/useNotifications';
import { MapPinIcon, PhoneIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AssignedOrders = () => {
  const { user } = useAuth();
  const { notifyOrderStatus } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchAssignedOrders();
    }
  }, [user]);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching assigned orders for user:', user?.uid);
      const assignedOrders = await getPartnerAssignedOrders(user?.uid);
      console.log('Assigned orders:', assignedOrders);
      setOrders(assignedOrders);
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      toast.error('Failed to load assigned orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} to ${newStatus}`);
      
      const order = await getOrderById(orderId);
      await updateDeliveryStatus(orderId, newStatus);
      
      if (order && order.userId) {
        await notifyOrderStatus(order.userId, {
          id: orderId
        }, newStatus);
      }

      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      fetchAssignedOrders();
      
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

  const filteredOrders = orders.filter(order => 
    filter === 'all' ? true : order.status === filter
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Assigned Orders</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="all">All Orders</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
          <button
            onClick={fetchAssignedOrders}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Orders Assigned</h2>
          <p className="text-gray-600">
            You don't have any assigned orders at the moment.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <GlassCard key={order.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-semibold">Order #{order.id?.slice(-6)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>

                  {/* Customer Details Card */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Customer Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{' '}
                          {order.customerName || order.customer?.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Phone:</span>{' '}
                          {(order.customerPhone || order.customer?.phone) ? (
                            <a 
                              href={`tel:${order.customerPhone || order.customer?.phone}`}
                              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
                            >
                              {order.customerPhone || order.customer?.phone}
                              <PhoneIcon className="h-3 w-3 ml-1" />
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </p>
                      </div>

                      {/* Right Column - Delivery Location */}
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Delivery Location:</span>
                        </p>
                        {order.deliveryLocation ? (
                          <div className="bg-blue-50 p-2 rounded border border-blue-100">
                            <p className="text-sm font-medium text-blue-800">
                              {order.deliveryLocation.name}
                            </p>
                            <p className="text-xs text-blue-600 flex items-start mt-1">
                              <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                              {order.deliveryLocation.address}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Order Items:</p>
                    <div className="space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="text-gray-600">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary-600">₹{order.total}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 lg:ml-6 lg:min-w-[200px]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContactCustomer(order.customerPhone || order.customer?.phone)}
                    className="w-full"
                    disabled={!(order.customerPhone || order.customer?.phone)}
                  >
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Call Customer
                  </Button>

                  {order.status === 'assigned' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'picked_up')}
                      className="w-full"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Picked Up
                    </Button>
                  )}

                  {order.status === 'picked_up' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Out for Delivery
                    </Button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      className="w-full"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Delivered
                    </Button>
                  )}

                  <Link
                    to={`/order-tracking/${order.id}`}
                    className="text-center px-4 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50"
                  >
                    Track Order
                  </Link>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Assigned: {new Date(order.assignedAt || order.createdAt).toLocaleString()}</span>
                  {order.deliveryLocation && (
                    <span className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1" />
                      {order.deliveryLocation.name}
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedOrders;