import { useState, useEffect } from 'react';
import { calculateRevenue } from '../utils/calculateRevenue';
import { fetchOrdersByDateRange } from '../services/orderService';

export const useRevenue = (startDate, endDate) => {
  const [revenue, setRevenue] = useState({
    total: 0,
    byDay: [],
    byCategory: [],
    averageOrderValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (startDate && endDate) {
      loadRevenueData();
    }
  }, [startDate, endDate]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const orders = await fetchOrdersByDateRange(startDate, endDate);
      const revenueData = calculateRevenue(orders);
      setRevenue(revenueData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    ...revenue,
    loading,
    error,
    refreshRevenue: loadRevenueData
  };
};