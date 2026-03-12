export const USER_ROLES = {
  STUDENT: 'student',
  DELIVERY: 'delivery',
  ADMIN: 'admin'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  ONLINE: 'online',
  CARD: 'card'
};

export const FOOD_CATEGORIES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACKS: 'snacks',
  BEVERAGES: 'beverages',
  DESSERTS: 'desserts'
};

export const DELIVERY_STATUS = {
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

export const NOTIFICATION_TYPES = {
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_READY: 'order_ready',
  ORDER_OUT_FOR_DELIVERY: 'order_out_for_delivery',
  ORDER_DELIVERED: 'order_delivered',
  DELIVERY_ASSIGNED: 'delivery_assigned',
  PAYMENT_RECEIVED: 'payment_received'
};

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  MENU: '/api/menu',
  ORDERS: '/api/orders',
  DELIVERIES: '/api/deliveries',
  ANALYTICS: '/api/analytics',
  USERS: '/api/users'
};

export const APP_CONFIG = {
  COMPANY_NAME: 'Campus Food Delivery',
  SUPPORT_EMAIL: 'support@campusfood.com',
  SUPPORT_PHONE: '+91 12345 67890',
  DELIVERY_FEE: 0,
  TAX_RATE: 0.0,
  MAX_ORDER_QUANTITY: 10,
  MIN_ORDER_AMOUNT: 50
};