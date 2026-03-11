import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  requestNotificationPermission, 
  onMessageListener,
  getUserNotifications,
  markNotificationAsRead,
  sendNotificationToUser,
  sendNotificationToRole,
  sendNotificationToAdmins
} from '../services/notificationService';

export const useNotifications = () => { 
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState(Notification?.permission || 'default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Listen for Firestore notifications
    const unsubscribeFirestore = getUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
      setLoading(false);
    });

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        console.log('New notification received:', payload);
        
        const newNotification = {
          id: Date.now().toString(),
          title: payload.notification?.title,
          body: payload.notification?.body,
          data: payload.data,
          read: false,
          createdAt: new Date().toISOString()
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .catch(err => console.log('Message listener error:', err));

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [user]);

  const initializeNotifications = async () => {
    const result = await requestNotificationPermission(user.uid, user.role);
    if (result.success) {
      setPermission('granted');
    } else {
      setPermission('denied');
    }
  };

  const markAsRead = async (notificationId) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => markNotificationAsRead(n.id));
    
    await Promise.all(promises);
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  // Send notification to admins about new order
  const notifyNewOrder = async (orderData) => {
    if (user?.role !== 'student') {
      console.log('Only students can send order notifications');
      return { success: false, error: 'Not authorized' };
    }
    
    try {
      const result = await sendNotificationToAdmins({
        title: '🆕 New Order Placed',
        body: `Order #${orderData.id} - ₹${orderData.total} by ${user?.email || 'Student'}`
      }, {
        type: 'new_order',
        orderId: orderData.id,
        customerEmail: user?.email,
        customerName: user?.displayName || user?.email?.split('@')[0],
        amount: orderData.total,
        timestamp: new Date().toISOString()
      });
      
      console.log('New order notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error in notifyNewOrder:', error);
      return { success: false, error: error.message };
    }
  };

  const notifyDeliveryAssigned = async (deliveryUserId, orderData) => {
    if (user?.role !== 'admin') {
      console.log('Only admins can send delivery assignments');
      return { success: false, error: 'Not authorized' };
    }
    
    try {
      const result = await sendNotificationToUser(deliveryUserId, {
        title: '🚚 New Delivery Assignment',
        body: `Order #${orderData.id} assigned to you. Customer: ${orderData.customerName}`
      }, {
        type: 'order_assigned',
        orderId: orderData.id,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        address: orderData.address,
        amount: orderData.total
      });
      
      return result;
    } catch (error) {
      console.error('Error in notifyDeliveryAssigned:', error);
      return { success: false, error: error.message };
    }
  };

  const notifyOrderStatus = async (studentUserId, orderData, status) => {
    const statusMessages = {
      'confirmed': '✅ Your order has been confirmed',
      'preparing': '👨‍🍳 Your order is being prepared',
      'out_for_delivery': '🚚 Your order is out for delivery',
      'delivered': '🎉 Your order has been delivered'
    };

    try {
      const result = await sendNotificationToUser(studentUserId, {
        title: 'Order Status Update',
        body: statusMessages[status] || `Order #${orderData.id} status: ${status}`
      }, {
        type: 'order_status',
        orderId: orderData.id,
        status: status
      });
      
      return result;
    } catch (error) {
      console.error('Error in notifyOrderStatus:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    notifications,
    unreadCount,
    permission,
    loading,
    markAsRead,
    markAllAsRead,
    requestPermission: initializeNotifications,
    notifyNewOrder,
    notifyDeliveryAssigned,
    notifyOrderStatus
  };
};