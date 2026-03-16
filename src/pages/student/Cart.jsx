import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import CartItem from '../../components/food/CartItem';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import { ShoppingBagIcon, CreditCardIcon, MapPinIcon, GiftIcon } from '@heroicons/react/24/outline';
import { createOrder } from '../../services/orderService';
import { useNotifications } from '../../hooks/useNotifications';
import toast from 'react-hot-toast';

// Predefined campus locations
const CAMPUS_LOCATIONS = [
  { id: 'admission', name: 'Admission Office', address: 'Admission Office Block' },
  { id: 'canteen', name: 'Main Canteen', address: 'Near Academic Block' },
  { id: 'store', name: 'University Store', address: 'Store Complex' },
  { id: 'mainblock', name: 'Main Block', address: 'Main Academic Building' },
  { id: 'library', name: 'Central Library', address: 'Library Building' },
  { id: 'event', name: 'Event Place', address: 'Event Ground' },
  { id: 'hostel1', name: 'Hostel Block A', address: 'Boys Hostel Area' },
  { id: 'hostel2', name: 'Hostel Block B', address: 'Girls Hostel Area' },
  { id: 'sports', name: 'Sports Complex', address: 'Sports Ground' },
  { id: 'lab', name: 'Computer Lab', address: 'Lab Complex' }
];

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemCount } = useCart();
  const { user } = useAuth();
  const { notifyNewOrder } = useNotifications();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Ensure cart is loaded
  useEffect(() => {
    setIsLoading(false);
  }, [cart]);

  const subtotal = getCartTotal();
  const deliveryFee = 0;
  const tax = 0;
  const total = subtotal;

  // Calculate total savings from discounts
  const totalSavings = cart.reduce((sum, item) => {
    if (item.discountApplied) {
      return sum + ((item.originalPrice - item.price) * item.quantity);
    }
    return sum;
  }, 0);

  // Calculate original total without discounts
  const originalTotal = cart.reduce((sum, item) => {
    return sum + ((item.originalPrice || item.price) * item.quantity);
  }, 0);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSelectedLocation(value);

    if (value === 'other') {
      setShowCustomInput(true);
      setCustomLocation('');
    } else {
      setShowCustomInput(false);
      setCustomLocation('');
    }
  };

  const getDeliveryAddress = () => {
    if (showCustomInput && customLocation.trim()) {
      return customLocation.trim();
    }

    const location = CAMPUS_LOCATIONS.find(loc => loc.id === selectedLocation);
    return location ? `${location.name} - ${location.address}` : '';
  };

  const validateOrder = () => {
    if (!selectedLocation && !customLocation) {
      toast.error('Please select a delivery location');
      return false;
    }

    if (showCustomInput && !customLocation.trim()) {
      toast.error('Please enter your delivery location');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please login to place order');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateOrder()) {
      return;
    }

    setPlacingOrder(true);

    try {
      const deliveryAddress = getDeliveryAddress();
      const selectedLocationData = CAMPUS_LOCATIONS.find(loc => loc.id === selectedLocation);

      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        customerName: user.displayName || user.name || user.email?.split('@')[0] || 'Customer',
        customerPhone: user.phoneNumber || user.phone || '',
        deliveryLocation: {
          id: selectedLocation || 'custom',
          name: selectedLocationData?.name || 'Custom Location',
          address: deliveryAddress
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          discountApplied: item.discountApplied || null,
          total: item.price * item.quantity
        })),
        subtotal,
        originalTotal,
        totalSavings,
        deliveryFee,
        tax,
        total,
        status: 'pending',
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString()
      };

      console.log('Placing order with data:', orderData);

      const result = await createOrder(orderData);
      console.log('Order created successfully:', result);

      // Send notification to admins
      try {
        await notifyNewOrder({
          id: result.id,
          total: total
        });
      } catch (notifyError) {
        console.log('Notification error (non-blocking):', notifyError);
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate('/my-orders');

    } catch (error) {
      console.error('Order placement error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-custom py-8 sm:py-16">
        <GlassCard className="max-w-md mx-auto text-center p-6 sm:p-12">
          <ShoppingBagIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Looks like you haven't added any items yet.</p>
          <Button 
            onClick={() => navigate('/menu')} 
            variant="primary" 
            className="w-full sm:w-auto"
            style={{ WebkitAppearance: 'none' }}
          >
            Browse Menu
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container-custom py-4 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-8">Your Cart</h1>

      {/* Main grid - use block on mobile, grid on desktop */}
      <div className="block lg:grid lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 mb-4 lg:mb-0">
          <GlassCard className="p-4 sm:p-6">
            <div className="space-y-4">
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-sm text-gray-600">
                Total Items: <span className="font-semibold">{getItemCount()}</span>
              </span>
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full sm:w-auto"
                style={{ WebkitAppearance: 'none' }}
              >
                Clear Cart
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Order Summary - stack below on mobile */}
        <div className="lg:col-span-1">
          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            {/* Savings Banner */}
            {totalSavings > 0 && (
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-green-200">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-green-700">🎉 You're Saving!</p>
                    <p className="text-xs text-green-600 mt-1 break-words">
                      Total savings: <span className="font-bold">₹{totalSavings}</span>
                    </p>
                    <p className="text-xs text-green-600 break-words">
                      Original total: <span className="line-through">₹{originalTotal}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Location Selection */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="h-4 w-4 inline mr-1" />
                Delivery Location *
              </label>

              <select
                value={selectedLocation}
                onChange={handleLocationChange}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                style={{ WebkitAppearance: 'menulist' }}
              >
                <option value="">Select a location</option>
                {CAMPUS_LOCATIONS.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
                <option value="other">Other (Custom Location)</option>
              </select>

              {showCustomInput && (
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="Enter your delivery location"
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mt-2"
                  style={{ WebkitAppearance: 'none' }}
                />
              )}

              {selectedLocation && !showCustomInput && (
                <p className="text-xs text-gray-500 mt-1 break-words">
                  {CAMPUS_LOCATIONS.find(l => l.id === selectedLocation)?.address}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {originalTotal > subtotal && (
                <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span>Original Total</span>
                  <span className="line-through">₹{originalTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-green-600">
                  <span>Discount Savings</span>
                  <span>-₹{totalSavings.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 sm:pt-3">
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                style={{ WebkitAppearance: 'menulist' }}
              >
                <option value="Cash">Cash on Delivery</option>
                <option value="Online">Online Payment</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-sm sm:text-base py-3"
              onClick={handlePlaceOrder}
              loading={placingOrder}
              disabled={cart.length === 0}
              style={{ WebkitAppearance: 'none' }}
            >
              <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {placingOrder ? 'Placing Order...' : 'Place Order'}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By placing this order, you agree to our Terms of Service and Privacy Policy
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Cart;