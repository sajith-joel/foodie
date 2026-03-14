import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../../components/food/OrderCard';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { ClipboardDocumentListIcon, ArrowPathIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { fetchUserOrders } from '../../services/orderService';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      console.log('Loading orders for user:', user?.uid);
      const userOrders = await fetchUserOrders(user?.uid);
      console.log('Orders loaded:', userOrders);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    filter === 'all' ? true : order.status === filter
  );

  const getStatusCount = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - iPhone Optimized */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">My Orders</h1>
            <button
              onClick={loadOrders}
              className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-gray-100 transition-colors"
              aria-label="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Filter Chips - Horizontal Scroll */}
          <div className="mt-3 -mx-4 px-4 overflow-x-auto hide-scrollbar">
            <div className="flex space-x-2 pb-1">
              {statuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => setFilter(status.value)}
                  className={`
                    px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors
                    ${filter === status.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }
                  `}
                >
                  {status.label}
                  <span className={`
                    ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                    ${filter === status.value
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {getStatusCount(status.value)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 text-center mb-2">
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No ${filter} orders found`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/menu')}
                className="mt-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl active:bg-primary-700 transition-colors"
              >
                Browse Menu
              </button>
            )}
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-2 px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl active:bg-gray-200 transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} role="student" />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats - Optional Footer */}
      {orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 safe-bottom">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Total Orders: {orders.length}
            </span>
            <span className="text-xs text-gray-500">
              {orders.filter(o => o.status === 'delivered').length} Delivered
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;