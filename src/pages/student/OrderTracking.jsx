import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { getOrderById } from '../../services/orderService';
import { getOrderDelivery } from '../../services/deliveryService';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  TruckIcon, 
  XCircleIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: ClockIcon, color: 'yellow' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircleIcon, color: 'blue' },
    { key: 'preparing', label: 'Preparing', icon: ClockIcon, color: 'purple' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: TruckIcon, color: 'indigo' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon, color: 'green' },
  ];

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
      console.log('Fetching order details for ID:', orderId);
      
      // Fetch order from Firestore
      const orderData = await getOrderById(orderId);
      console.log('Order data:', orderData);
      
      if (!orderData) {
        toast.error('Order not found');
        navigate('/my-orders');
        return;
      }
      
      setOrder(orderData);
      
      // Fetch delivery information if order is assigned
      if (orderData.deliveryBoy || orderData.deliveryPartnerId) {
        try {
          const deliveryData = await getOrderDelivery(orderId);
          console.log('Delivery data:', deliveryData);
          setDelivery(deliveryData);
        } catch (deliveryError) {
          console.log('No delivery info yet:', deliveryError);
        }
      }
      
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'out_for_delivery': return 'text-blue-600 bg-blue-100';
      case 'preparing': return 'text-purple-600 bg-purple-100';
      case 'confirmed': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-yellow-600 bg-yellow-100';
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
        <Button onClick={() => navigate('/my-orders')} variant="primary" className="mt-4">
          Back to My Orders
        </Button>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <div className="container-custom py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Track Order #{order.id}</h1>
        <Button variant="outline" size="sm" onClick={loadOrderDetails}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* Order Status Banner */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <div className="flex items-center mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        {/* Status Timeline (only show if not cancelled) */}
        {!isCancelled && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-6">Order Progress</h2>
            
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
                {!isDelivered && currentStepIndex >= 0 && (
                  <div 
                    className="h-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 2)) * 100}%` }}
                  />
                )}
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => {
                  if (step.key === 'cancelled') return null;
                  
                  const StepIcon = step.icon;
                  const isCompleted = index <= currentStepIndex && !isCancelled;
                  const isCurrent = index === currentStepIndex && !isCancelled;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center z-10
                        ${isCompleted ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
                        ${isCurrent ? 'ring-4 ring-primary-200' : ''}
                      `}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      <span className="mt-2 text-sm font-medium text-center">
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-primary-600 font-semibold mt-1">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Cancelled Order Message */}
        {isCancelled && (
          <GlassCard className="p-6 bg-red-50">
            <div className="flex items-center space-x-3">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Order Cancelled</h3>
                <p className="text-sm text-red-600">This order has been cancelled.</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Delivery Information */}
        {(order.deliveryBoy || delivery) && !isCancelled && (
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Delivery Partner</p>
                    <p className="font-medium">
                      {order.deliveryBoy?.name || delivery?.partnerName || 'Assigned'}
                    </p>
                  </div>
                </div>
                
                {order.deliveryBoy?.phone && (
                  <div className="flex items-start space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{order.deliveryBoy.phone}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="text-sm text-primary-600 mb-2">Delivery Status</p>
                <p className="text-lg font-bold text-primary-700">
                  {order.status === 'out_for_delivery' ? 'On the way' : 
                   order.status === 'delivered' ? 'Delivered' : 'Preparing'}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Order Details */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          
          <div className="space-y-4">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{item.quantity}x </span>
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}

            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal || order.total - 30 - (order.total * 0.05)}</span>
              </div>
              {/* <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee || 30}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%)</span>
                <span>₹{order.tax || (order.total * 0.05).toFixed(2)}</span>
              </div> */}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">₹{order.total}</span>
              </div>
            </div>
          </div>

          {order.customerAddress && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
              <p className="font-medium">{order.customerAddress}</p>
            </div>
          )}
        </GlassCard>

        {/* Action Buttons */}
        {role === 'student' && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/my-orders')}
            >
              Back to Orders
            </Button>
            <Button
              variant="primary"
              onClick={loadOrderDetails}
            >
              Refresh Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;