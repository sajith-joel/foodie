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
      
      const orderData = await getOrderById(orderId);
      console.log('Order data:', orderData);
      
      if (!orderData) {
        toast.error('Order not found');
        // Redirect based on role
        if (role === 'delivery') {
          navigate('/delivery/orders');
        } else {
          navigate('/my-orders');
        }
        return;
      }
      
      // Check if delivery partner has access to this order
      if (role === 'delivery' && orderData.deliveryPartnerId !== user.uid) {
        toast.error('You are not assigned to this order');
        navigate('/delivery/orders');
        return;
      }
      
      setOrder(orderData);
      
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
        <Button 
          onClick={() => {
            if (role === 'delivery') {
              navigate('/delivery/orders');
            } else {
              navigate('/my-orders');
            }
          }} 
          variant="primary" 
          className="mt-4"
        >
          Back to Orders
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {role === 'delivery' ? 'Delivery Details' : 'Track Order'} #{order.id?.slice(-6)}
        </h1>
        <Button variant="outline" size="sm" onClick={loadOrderDetails}>
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* Order Status Banner */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Current Status</p>
              <div className="flex items-center mt-1">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-600">Order Date</p>
              <p className="text-sm sm:text-base font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        {/* Status Timeline - Mobile Optimized */}
        {!isCancelled && (
          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Progress</h2>
            
            <div className="relative">
              {/* Progress Bar - Hidden on mobile, shown on desktop */}
              <div className="hidden sm:block absolute top-5 left-0 w-full h-1 bg-gray-200">
                {!isDelivered && currentStepIndex >= 0 && (
                  <div 
                    className="h-full bg-primary-600 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (statusSteps.length - 2)) * 100}%` }}
                  />
                )}
              </div>

              {/* Steps - Vertical on mobile, horizontal on desktop */}
              <div className="sm:relative sm:flex sm:justify-between space-y-4 sm:space-y-0">
                {statusSteps.map((step, index) => {
                  if (step.key === 'cancelled') return null;
                  
                  const StepIcon = step.icon;
                  const isCompleted = index <= currentStepIndex && !isCancelled;
                  const isCurrent = index === currentStepIndex && !isCancelled;

                  return (
                    <div key={step.key} className="flex items-center sm:flex-col sm:items-center">
                      <div className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0
                        ${isCompleted ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
                        ${isCurrent ? 'ring-4 ring-primary-200' : ''}
                      `}>
                        <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="ml-3 sm:ml-0 sm:mt-2">
                        <span className="text-xs sm:text-sm font-medium">
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] sm:text-xs text-primary-600 font-semibold block">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Customer Information - For Delivery Partners */}
        {role === 'delivery' && (
          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Name</p>
                  <p className="text-sm sm:text-base font-medium">
                    {order.customerName || order.customer?.name}
                  </p>
                </div>
              </div>
              
              {order.customerPhone && (
                <div className="flex items-start space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                    <a 
                      href={`tel:${order.customerPhone}`}
                      className="text-sm sm:text-base text-primary-600 hover:text-primary-700"
                    >
                      {order.customerPhone}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Delivery Address</p>
                  <p className="text-sm sm:text-base">
                    {order.deliveryLocation?.address || order.customerAddress}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Order Details */}
        <GlassCard className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Details</h2>
          
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

            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Subtotal</span>
                <span>₹{order.subtotal || order.total - 0 - (order.total * 0)}</span>
              </div>
              {/* <div className="flex justify-between text-xs sm:text-sm">
                <span>Delivery Fee</span>
                <span>₹{order.deliveryFee || 0}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Tax (5%)</span>
                <span>₹{order.tax || (order.total * 0.0).toFixed(2)}</span>
              </div> */}
              <div className="flex justify-between font-bold text-sm sm:text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary-600">₹{order.total}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              if (role === 'delivery') {
                navigate('/delivery/orders');
              } else {
                navigate('/my-orders');
              }
            }}
            className="w-full sm:w-auto"
          >
            Back to Orders
          </Button>
          <Button
            variant="primary"
            onClick={loadOrderDetails}
            className="w-full sm:w-auto"
          >
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;