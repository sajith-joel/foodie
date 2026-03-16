import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import OrderCard from '../../components/food/OrderCard';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import { ClipboardDocumentListIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { fetchUserOrders } from '../../services/orderService';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading orders for user:', user.uid);
      
      if (!user?.uid) {
        throw new Error('User ID not found');
      }

      const userOrders = await fetchUserOrders(user.uid);
      console.log('Orders loaded:', userOrders);
      
      setOrders(userOrders);
      
      if (userOrders.length === 0) {
        console.log('No orders found for this user');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message);
      toast.error('Failed to load orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order => 
    filter === 'all' ? true : order.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-4 sm:py-8">
        <GlassCard className="p-6 sm:p-12 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Error Loading Orders</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <Button onClick={loadOrders} variant="primary" size="sm" className="sm:w-auto">
            Try Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container-custom py-4 sm:py-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Orders</h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="w-full sm:w-auto justify-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm sm:text-base"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <GlassCard className="p-6 sm:p-12 text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No orders found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't placed any orders yet." 
              : `No ${filter} orders found.`}
          </p>
          {filter === 'all' && (
            <Button onClick={() => navigate('/menu')} variant="primary" className="w-full sm:w-auto">
              Browse Menu
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} role="student" />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;