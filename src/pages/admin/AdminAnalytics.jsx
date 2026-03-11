import { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import RevenueChart from '../../components/charts/RevenueChart';
import OrdersTrendLine from '../../components/charts/OrdersTrendLine';
import DeliveryPerformanceChart from '../../components/charts/DeliveryPerformanceChart';
import MostSoldPie from '../../components/charts/MostSoldPie';
import { CalendarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { 
  getRevenueData, 
  getMostSoldItems, 
  getOrdersTrend, 
  getDeliveryPerformance,
  getDashboardStats
} from '../../services/analyticsService';

const AdminAnalytics = () => {
  const [dateRange, setDateRange] = useState(30);
  const [analytics, setAnalytics] = useState({
    revenueData: [],
    ordersData: [],
    deliveryData: [],
    popularItems: [],
    summary: {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalOrders: 0,
      avgDeliveryTime: 0,
      cancellationRate: 0,
      peakHour: ''
    }
  });
  const [insights, setInsights] = useState({
    bestDay: { date: 'N/A', revenue: 0 },
    mostPopularItem: { name: 'N/A', value: 0 },
    bestDeliveryPartner: { name: 'N/A', onTimeRate: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const calculateInsights = (data) => {
    // Calculate best performing day
    const bestDay = data.revenueData.reduce((best, current) => 
      current.revenue > best.revenue ? current : best
    , { revenue: 0, date: 'N/A' });

    // Calculate most popular item
    const mostPopular = data.popularItems.length > 0 
      ? data.popularItems[0] 
      : { name: 'N/A', value: 0 };

    // Calculate best delivery partner
    let bestPartner = { name: 'N/A', onTimeRate: 0 };
    if (data.deliveryData.length > 0) {
      bestPartner = data.deliveryData.reduce((best, current) => {
        const currentRate = current.onTime / (current.onTime + current.delayed) * 100;
        const bestRate = best.onTime / (best.onTime + best.delayed) * 100;
        return currentRate > bestRate ? current : best;
      }, data.deliveryData[0]);
      
      // Calculate on-time rate for display
      const totalDeliveries = bestPartner.onTime + bestPartner.delayed;
      bestPartner.onTimeRate = totalDeliveries > 0 
        ? Math.round((bestPartner.onTime / totalDeliveries) * 100) 
        : 0;
    }

    setInsights({
      bestDay: { date: bestDay.date, revenue: bestDay.revenue },
      mostPopularItem: { name: mostPopular.name, value: mostPopular.value },
      bestDeliveryPartner: { 
        name: bestPartner.name || 'N/A', 
        onTimeRate: bestPartner.onTimeRate || 0 
      }
    });
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics data...');
      
      // Fetch all data in parallel
      const [revenue, ordersTrend, delivery, popular, stats] = await Promise.all([
        getRevenueData(dateRange),
        getOrdersTrend(),
        getDeliveryPerformance(),
        getMostSoldItems(10),
        getDashboardStats()
      ]);
      
      // Calculate summary metrics
      const totalOrders = stats.totalOrders || 0;
      const totalRevenue = stats.totalRevenue || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Find peak hour
      const peakHourData = ordersTrend.reduce((max, current) => 
        current.orders > max.orders ? current : max
      , { orders: 0, time: '' });
      
      const analyticsData = {
        revenueData: revenue,
        ordersData: ordersTrend,
        deliveryData: delivery,
        popularItems: popular,
        summary: {
          totalRevenue,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          totalOrders,
          avgDeliveryTime: 28,
          cancellationRate: 3.2,
          peakHour: peakHourData.time || '12:00 PM'
        }
      };
      
      setAnalytics(analyticsData);
      calculateInsights(analyticsData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xl font-bold text-primary-600">₹{analytics.summary.totalRevenue.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-xl font-bold">₹{analytics.summary.averageOrderValue}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-xl font-bold">{analytics.summary.totalOrders}</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Avg Delivery Time</p>
          <p className="text-xl font-bold">{analytics.summary.avgDeliveryTime} min</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Cancellation Rate</p>
          <p className="text-xl font-bold text-red-600">{analytics.summary.cancellationRate}%</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-gray-600">Peak Hour</p>
          <p className="text-sm font-bold">{analytics.summary.peakHour}</p>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Revenue Trend</h2>
          {analytics.revenueData.length > 0 ? (
            <RevenueChart data={analytics.revenueData} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No revenue data available
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Orders Throughout Day</h2>
          {analytics.ordersData.length > 0 ? (
            <OrdersTrendLine data={analytics.ordersData} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No orders data available
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Performance</h2>
          {analytics.deliveryData.length > 0 ? (
            <DeliveryPerformanceChart data={analytics.deliveryData} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No delivery data available
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Most Popular Items</h2>
          {analytics.popularItems.length > 0 ? (
            <MostSoldPie data={analytics.popularItems} />
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No sales data available
            </div>
          )}
        </GlassCard>
      </div>

      {/* Insights */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-semibold">Best Performing Day</p>
            <p className="text-2xl font-bold text-green-600">
              {insights.bestDay.date}
            </p>
            <p className="text-xs text-green-700 mt-1">
              ₹{insights.bestDay.revenue} revenue
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-semibold">Most Popular Item</p>
            <p className="text-2xl font-bold text-blue-600">
              {insights.mostPopularItem.name}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {insights.mostPopularItem.value} orders
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800 font-semibold">Best Delivery Partner</p>
            <p className="text-2xl font-bold text-purple-600">
              {insights.bestDeliveryPartner.name}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              {insights.bestDeliveryPartner.onTimeRate}% on-time
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminAnalytics;