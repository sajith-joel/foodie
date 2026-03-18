import { useState, useEffect } from 'react';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import { useNotifications } from '../../hooks/useNotifications';
import toast from 'react-hot-toast';

// Simplified Cart component for iOS
const CartIOS = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getItemCount } = useCart();
  const { user } = useAuth();
  const { notifyNewOrder } = useNotifications();
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Force background color on mount
    document.body.style.backgroundColor = '#f9fafb';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const subtotal = getCartTotal();
  const total = subtotal; // No delivery fee or tax

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

    setPlacingOrder(true);

    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        customerName: user.displayName || user.name || user.email?.split('@')[0] || 'Customer',
        customerPhone: user.phoneNumber || user.phone || '',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        total,
        status: 'pending',
        paymentMethod: 'Cash',
        createdAt: new Date().toISOString()
      };

      const result = await createOrder(orderData);
      
      try {
        await notifyNewOrder({
          id: result.id,
          total: total
        });
      } catch (notifyError) {
        console.log('Notification error:', notifyError);
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

  if (cart.length === 0) {
    return (
      <div style={{ 
        padding: '2rem 1rem', 
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem 1rem',
          maxWidth: '400px',
          margin: '0 auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Your cart is empty
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Looks like you haven't added any items yet.
          </p>
          <button
            onClick={() => navigate('/menu')}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              width: '100%'
            }}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      padding: '1rem'
    }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Your Cart
      </h1>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Cart Items */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {cart.map(item => (
            <div key={item.id} style={{
              display: 'flex',
              padding: '1rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.name}</h3>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>₹{item.price} each</p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      backgroundColor: '#e5e7eb',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      opacity: item.quantity <= 1 ? 0.5 : 1
                    }}
                  >
                    -
                  </button>
                  <span style={{ width: '2rem', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      backgroundColor: '#e5e7eb',
                      border: 'none',
                      fontSize: '1.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', color: '#2563eb' }}>
                  ₹{item.price * item.quantity}
                </p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span>Total Items: {getItemCount()}</span>
            <button
              onClick={clearCart}
              style={{
                color: '#666',
                background: 'none',
                border: 'none',
                textDecoration: 'underline'
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Order Summary
          </h2>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '1.125rem',
            marginTop: '0.5rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <span>Total</span>
            <span style={{ color: '#2563eb' }}>₹{total.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              width: '100%',
              marginTop: '1rem',
              opacity: placingOrder ? 0.7 : 1,
              cursor: placingOrder ? 'not-allowed' : 'pointer'
            }}
          >
            {placingOrder ? 'Placing Order...' : 'Place Order'}
          </button>

          <p style={{
            fontSize: '0.75rem',
            color: '#666',
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartIOS;