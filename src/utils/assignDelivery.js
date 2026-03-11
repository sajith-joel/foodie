/**
 * Assign a delivery partner to an order
 * @param {string} orderId - The order ID
 * @param {Array} availableDeliveryBoys - List of available delivery partners
 * @returns {Promise<Object>} - The assigned delivery partner
 */
export const assignDelivery = async (orderId, availableDeliveryBoys) => {
  try {
    // Filter available delivery boys (active and with less than 3 orders)
    const availableBoys = availableDeliveryBoys.filter(boy => 
      boy.status === 'active' && (boy.currentOrders || 0) < 3
    );
    
    if (availableBoys.length === 0) {
      throw new Error('No delivery boys available at the moment');
    }
    
    // Simple algorithm: assign to the one with fewest current orders
    const selectedBoy = availableBoys.reduce((prev, current) => 
      (prev.currentOrders || 0) < (current.currentOrders || 0) ? prev : current
    );
    
    // In a real app, you would:
    // 1. Update the order in Firestore with deliveryBoyId
    // 2. Update the delivery boy's current orders count
    // 3. Create a delivery record
    
    console.log(`Order ${orderId} assigned to ${selectedBoy.name}`);
    
    return {
      id: selectedBoy.id,
      name: selectedBoy.name,
      assignedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in assignDelivery:', error);
    throw error;
  }
};

/**
 * Calculate estimated delivery time based on distance
 * @param {Object} restaurantLocation 
 * @param {Object} deliveryLocation 
 * @returns {number} - Estimated time in minutes
 */
export const calculateEstimatedTime = (restaurantLocation, deliveryLocation) => {
  // Mock calculation - in production, use Google Maps API
  const baseTime = 15; // minutes
  const distance = Math.random() * 3 + 1; // 1-4 km
  const timePerKm = 5; // minutes per km
  
  return Math.round(baseTime + (distance * timePerKm));
};

/**
 * Optimize delivery route for multiple orders
 * @param {Array} deliveries - List of deliveries
 * @returns {Array} - Optimized route order
 */
export const optimizeRoute = (deliveries) => {
  // Simple optimization by distance
  // In production, implement proper route optimization algorithm
  return [...deliveries].sort((a, b) => (a.distance || 0) - (b.distance || 0));
};