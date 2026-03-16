import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import RevenueChart from '../../components/charts/RevenueChart';
import MostSoldPie from '../../components/charts/MostSoldPie';
import { 
  CurrencyRupeeIcon, 
  ShoppingBagIcon, 
  UserGroupIcon, 
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  getDashboardStats, 
  getRevenueData, 
  getMostSoldItems, 
  getRecentOrders 
} from '../../services/analyticsService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalUsers: 0,
    activeDeliveries: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    deliveredOrders: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [mostSoldData, setMostSoldData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);
  const [dateRange, setDateRange] = useState(7);

  // Set chart ready after container is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading dashboard data...');
      
      const [statsData, revenue, mostSold, recent] = await Promise.all([
        getDashboardStats(),
        getRevenueData(dateRange),
        getMostSoldItems(5),
        getRecentOrders(5)
      ]);
      
      setStats(statsData);
      setRevenueData(revenue);
      setMostSoldData(mostSold);
      setRecentOrders(recent);
      
      console.log('Dashboard data loaded:', { statsData, revenue, mostSold, recent });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      change: '+8.2%'
    },
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: 'Today'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      change: '+5.3%'
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: TruckIcon,
      color: 'bg-orange-500',
      change: '+2.1%'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: 'Awaiting'
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={index} className="p-3 sm:p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 mb-1 truncate">{stat.title}</p>
                  <p className="text-base sm:text-xl font-bold truncate">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg ml-2 flex-shrink-0`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Order Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Pending Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg">
              <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
          <Link to="/admin/orders?filter=pending" className="text-xs text-primary-600 hover:text-primary-700 mt-2 block">
            View pending orders →
          </Link>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Preparing</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.preparingOrders}</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
              <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <Link to="/admin/orders?filter=preparing" className="text-xs text-primary-600 hover:text-primary-700 mt-2 block">
            View preparing orders →
          </Link>
        </GlassCard>

        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Delivered Today</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <Link to="/admin/orders?filter=delivered" className="text-xs text-primary-600 hover:text-primary-700 mt-2 block">
            View delivered orders →
          </Link>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <GlassCard className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Revenue Overview</h2>
            <span className="text-xs sm:text-sm text-gray-500">Last {dateRange} days</span>
          </div>
          <div className="w-full h-64 sm:h-80" style={{ minHeight: '250px' }}>
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : revenueData.length > 0 ? (
              chartReady && <RevenueChart data={revenueData} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Most Sold Items</h2>
            <span className="text-xs sm:text-sm text-gray-500">All time</span>
          </div>
          <div className="w-full h-64 sm:h-80" style={{ minHeight: '250px' }}>
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : mostSoldData.length > 0 ? (
              chartReady && <MostSoldPie data={mostSoldData} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Recent Orders */}
      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
            View All →
          </Link>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium">#{order.id?.slice(-6)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm">{order.customerName}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-semibold">₹{order.total}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.paymentMethod === 'Online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-4 py-8 text-center text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/admin/menu"
            className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-primary-600" />
            <span className="text-xs sm:text-sm font-medium">Manage Menu</span>
          </Link>
          <Link
            to="/admin/orders"
            className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium">Pending Orders</span>
          </Link>
          <Link
            to="/admin/delivery-boys"
            className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <TruckIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600" />
            <span className="text-xs sm:text-sm font-medium">Delivery Partners</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <CurrencyRupeeIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600" />
            <span className="text-xs sm:text-sm font-medium">View Analytics</span>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminDashboard;