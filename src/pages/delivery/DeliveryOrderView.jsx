import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { getOrderById } from '../../services/orderService';
import { updateDeliveryStatus, getOrderDelivery } from '../../services/deliveryService';
import { useNotifications } from '../../hooks/useNotifications';
import {
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DeliveryOrderView = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { notifyOrderStatus } = useNotifications();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrderDetails();
  }, [orderId, user]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching order details for delivery:', orderId);
      
      const orderData = await getOrderById(orderId);
      console.log('Order data:', orderData);
      
      if (!orderData) {
        toast.error('Order not found');
        navigate('/delivery/orders');
        return;
      }
      
      // Verify this delivery partner is assigned to this order
      if (orderData.deliveryPartnerId !== user.uid && orderData.deliveryBoy?.id !== user.uid) {
        toast.error('You are not assigned to this order');
        navigate('/delivery/orders');
        return;
      }
      
      setOrder(orderData);
      
      // Get delivery details
      try {
        const deliveryData = await getOrderDelivery(orderId);
        setDelivery(deliveryData);
      } catch (error) {
        console.log('No delivery record yet');
      }
      
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await updateDeliveryStatus(orderId, newStatus);
      
      // Notify customer
      if (order.userId) {
        await notifyOrderStatus(order.userId, {
          id: orderId
        }, newStatus);
      }
      
      toast.success(`Order marked as ${newStatus.replace('_', ' ')}`);
      loadOrderDetails(); // Refresh data
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleContactCustomer = () => {
    const phone = order.customerPhone || order.customer?.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.error('Customer phone number not available');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Order not found.</p>
        <Button onClick={() => navigate('/delivery/orders')} variant="primary" className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Delivery Order #{order.id?.slice(-6)}
        </h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadOrderDetails}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/delivery/orders')}>
            Back to List
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Banner */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Current Status</p>
              <div className="flex items-center mt-1">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-600">Assigned Time</p>
              <p className="text-sm sm:text-base font-medium">
                {new Date(order.assignedAt || order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Customer Information */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-primary-600" />
            Customer Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Name</p>
                <p className="text-sm sm:text-base font-medium">
                  {order.customerName || order.customer?.name}
                </p>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                {order.customerPhone || order.customer?.phone ? (
                  <a 
                    href={`tel:${order.customerPhone || order.customer?.phone}`}
                    className="text-sm sm:text-base text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {order.customerPhone || order.customer?.phone}
                  </a>
                ) : (
                  <p className="text-sm sm:text-base text-gray-400">Not provided</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Delivery Location</p>
                {order.deliveryLocation ? (
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      {order.deliveryLocation.name}
                    </p>
                    <p className="text-xs text-blue-600 flex items-start mt-1">
                      <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                      {order.deliveryLocation.address}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                    {order.customerAddress || 'Address not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={handleContactCustomer}
              className="w-full sm:w-auto"
              disabled={!order.customerPhone && !order.customer?.phone}
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call Customer
            </Button>
          </div>
        </GlassCard>

        {/* Order Items */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-primary-600" />
            Order Items
          </h2>
          
          <div className="space-y-3">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <div>
                  <span className="text-sm sm:text-base font-medium">{item.quantity}x </span>
                  <span className="text-sm sm:text-base">{item.name}</span>
                </div>
                <span className="text-sm sm:text-base font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
{/* 
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal || order.total - 30 - (order.total * 0.05)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee || 30}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Tax (5%)</span>
                <span>₹{order.tax || (order.total * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm sm:text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">₹{order.total}</span>
              </div>
            </div> */}
          </div>
        </GlassCard>

        {/* Status Update Actions */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Update Delivery Status</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {order.status === 'assigned' && (
              <Button
                onClick={() => handleUpdateStatus('picked_up')}
                loading={updating}
                className="w-full"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Picked Up
              </Button>
            )}
            
            {order.status === 'picked_up' && (
              <Button
                onClick={() => handleUpdateStatus('out_for_delivery')}
                loading={updating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                Out for Delivery
              </Button>
            )}
            
            {order.status === 'out_for_delivery' && (
              <Button
                onClick={() => handleUpdateStatus('delivered')}
                loading={updating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Delivered
              </Button>
            )}
            
            {order.status === 'delivered' && (
              <div className="col-span-full text-center p-4 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-green-700 font-medium">This order has been delivered</p>
                <p className="text-xs text-gray-500 mt-1">
                  Delivered at: {new Date(order.deliveredAt || order.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default DeliveryOrderView;