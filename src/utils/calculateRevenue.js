export const calculateRevenue = (orders) => {
  const total = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  
  const byDay = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { revenue: 0, orders: 0 };
    }
    acc[date].revenue += order.total;
    acc[date].orders += 1;
    return acc;
  }, {});
  
  const byCategory = orders.reduce((acc, order) => {
    order.items?.forEach(item => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += item.price * item.quantity;
    });
    return acc;
  }, {});
  
  const averageOrderValue = orders.length > 0 ? total / orders.length : 0;
  
  return {
    total,
    byDay: Object.entries(byDay).map(([date, data]) => ({ date, ...data })),
    byCategory: Object.entries(byCategory).map(([category, revenue]) => ({ category, revenue })),
    averageOrderValue
  };
};

export const calculateDailyRevenue = (orders) => {
  const today = new Date().toLocaleDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt).toLocaleDateString() === today
  );
  
  return calculateRevenue(todayOrders);
};

export const calculateMonthlyRevenue = (orders) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === currentMonth && 
           orderDate.getFullYear() === currentYear;
  });
  
  return calculateRevenue(monthOrders);
};

export const calculateRevenueGrowth = (currentPeriod, previousPeriod) => {
  const currentRevenue = calculateRevenue(currentPeriod).total;
  const previousRevenue = calculateRevenue(previousPeriod).total;
  
  if (previousRevenue === 0) return 100;
  
  const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  return Math.round(growth * 100) / 100;
};