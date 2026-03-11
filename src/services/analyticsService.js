import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Get real-time dashboard stats
export const getDashboardStats = async () => {
  try {
    console.log('🔵 Fetching dashboard stats...');
    
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Get all orders
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    
    let totalRevenue = 0;
    let totalOrders = 0;
    let todayOrders = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let preparingOrders = 0;
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.total || 0;
      totalOrders++;
      
      if (order.createdAt >= today) {
        todayOrders++;
      }
      
      switch(order.status) {
        case 'pending':
          pendingOrders++;
          break;
        case 'preparing':
        case 'confirmed':
          preparingOrders++;
          break;
        case 'delivered':
          deliveredOrders++;
          break;
      }
    });
    
    // Get total users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;
    
    // Get active delivery partners
    const partnersRef = collection(db, 'delivery_partners');
    const partnersQuery = query(partnersRef, where('status', '==', 'active'));
    const partnersSnapshot = await getDocs(partnersQuery);
    const activeDeliveries = partnersSnapshot.size;
    
    return {
      totalRevenue,
      totalOrders,
      todayOrders,
      totalUsers,
      activeDeliveries,
      pendingOrders,
      preparingOrders,
      deliveredOrders
    };
    
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      todayOrders: 0,
      totalUsers: 0,
      activeDeliveries: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      deliveredOrders: 0
    };
  }
};

// Get revenue data for charts
export const getRevenueData = async (days = 7) => {
  try {
    console.log(`🔵 Fetching revenue data for last ${days} days...`);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('createdAt', '>=', startDate.toISOString()),
      where('createdAt', '<=', endDate.toISOString()),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Group by date
    const revenueByDay = {};
    const ordersByDay = {};
    
    querySnapshot.forEach(doc => {
      const order = doc.data();
      const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
      
      revenueByDay[date] = (revenueByDay[date] || 0) + (order.total || 0);
      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });
    
    // Fill in missing dates
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
      
      result.push({
        date: dateStr,
        revenue: revenueByDay[dateStr] || 0,
        orders: ordersByDay[dateStr] || 0
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching revenue data:', error);
    return [];
  }
};

// Get most sold items
export const getMostSoldItems = async (limitCount = 5) => {
  try {
    console.log('🔵 Fetching most sold items...');
    
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);
    
    const itemCounts = {};
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const itemName = item.name;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
        });
      }
    });
    
    // Convert to array and sort
    const result = Object.entries(itemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limitCount);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching most sold items:', error);
    return [];
  }
};

// Get recent orders for dashboard
export const getRecentOrders = async (limitCount = 5) => {
  try {
    console.log('🔵 Fetching recent orders...');
    
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        customerName: data.customerName || data.customer?.name || 'Customer',
        total: data.total || 0,
        status: data.status || 'pending',
        createdAt: data.createdAt,
        paymentMethod: data.paymentMethod || 'Cash'
      });
    });
    
    return orders;
    
  } catch (error) {
    console.error('❌ Error fetching recent orders:', error);
    return [];
  }
};

// Get delivery performance data
export const getDeliveryPerformance = async () => {
  try {
    console.log('🔵 Fetching delivery performance...');
    
    const deliveriesRef = collection(db, 'deliveries');
    const deliveriesSnapshot = await getDocs(deliveriesRef);
    
    const partnerPerformance = {};
    
    deliveriesSnapshot.forEach(doc => {
      const delivery = doc.data();
      const partnerId = delivery.partnerId;
      
      if (!partnerPerformance[partnerId]) {
        partnerPerformance[partnerId] = {
          name: delivery.partnerName || 'Unknown',
          onTime: 0,
          delayed: 0,
          total: 0
        };
      }
      
      // Calculate if delivery was on time (within 30 minutes of estimated time)
      const assignedTime = new Date(delivery.assignedAt);
      const deliveredTime = delivery.deliveredAt ? new Date(delivery.deliveredAt) : null;
      
      if (deliveredTime) {
        const deliveryTime = (deliveredTime - assignedTime) / (1000 * 60); // in minutes
        if (deliveryTime <= 30) {
          partnerPerformance[partnerId].onTime++;
        } else {
          partnerPerformance[partnerId].delayed++;
        }
        partnerPerformance[partnerId].total++;
      }
    });
    
    return Object.values(partnerPerformance);
    
  } catch (error) {
    console.error('❌ Error fetching delivery performance:', error);
    return [];
  }
};

// Get orders trend by hour
export const getOrdersTrend = async () => {
  try {
    console.log('🔵 Fetching orders trend...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('createdAt', '>=', today.toISOString())
    );
    
    const querySnapshot = await getDocs(q);
    
    const hourlyData = {};
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      hourlyData[hour] = 0;
    }
    
    querySnapshot.forEach(doc => {
      const order = doc.data();
      const hour = new Date(order.createdAt).getHours();
      const hourStr = hour.toString().padStart(2, '0') + ':00';
      hourlyData[hourStr] = (hourlyData[hourStr] || 0) + 1;
    });
    
    return Object.entries(hourlyData).map(([time, orders]) => ({
      time,
      orders
    }));
    
  } catch (error) {
    console.error('❌ Error fetching orders trend:', error);
    return [];
  }
};