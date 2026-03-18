import { db } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';

// Helper function to check if Notification API is supported
const isNotificationSupported = () => {
  if (typeof window === 'undefined') return false;
  return typeof Notification !== 'undefined' && 'Notification' in window;
};

// Request permission and get FCM token - SAFE VERSION for iOS
export const requestNotificationPermission = async (userId, userRole) => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment');
      return { success: false, error: 'Not in browser environment' };
    }

    // Check if Notification API is supported
    if (!isNotificationSupported()) {
      console.log('ℹ️ Notification API not supported in this browser');
      // Still return success to not break the flow, but mark as not supported
      return { 
        success: true, 
        notificationsSupported: false,
        message: 'Notifications not supported in this browser'
      };
    }

    // Check if we already have permission
    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return { success: false, error: 'Permission denied' };
    }

    // Request permission
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      let token = null;

      // Try to get FCM token if messaging is available
      if (messaging) {
        try {
          token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });
          console.log('FCM Token:', token);
        } catch (fcmError) {
          console.log('FCM not available:', fcmError);
        }
      }

      // Store user notification preference
      try {
        await addDoc(collection(db, 'user_notifications'), {
          userId,
          userRole,
          fcmToken: token || null,
          notificationsEnabled: true,
          updatedAt: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.log('Error storing notification preference:', firestoreError);
        // Continue even if storage fails
      }

      return { 
        success: true, 
        token, 
        notificationsSupported: true 
      };
    }

    return { 
      success: false, 
      error: 'Permission denied', 
      notificationsSupported: true 
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    // Don't throw error on iOS, just return gracefully
    return { 
      success: false, 
      error: error.message,
      notificationsSupported: false 
    };
  }
};

// Listen for foreground messages - SAFE VERSION
export const onMessageListener = () => {
  return new Promise((resolve, reject) => {
    // Check if messaging is available
    if (!messaging) {
      console.log('Messaging not initialized');
      reject('Messaging not initialized');
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      reject('Not in browser environment');
      return;
    }

    try {
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        resolve(payload);
      });
    } catch (error) {
      console.error('Error setting up message listener:', error);
      reject(error);
    }
  });
};

// Send notification to specific user
export const sendNotificationToUser = async (targetUserId, notification, data = {}) => {
  try {
    console.log(`Sending notification to user ${targetUserId}:`, notification);

    // Validate inputs
    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    const notificationData = {
      userId: targetUserId,
      title: notification.title || 'New Notification',
      body: notification.body || '',
      data: data || {},
      read: false,
      type: data.type || 'general',
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log('Notification saved with ID:', docRef.id);

    return {
      success: true,
      notificationId: docRef.id
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to all admins
export const sendNotificationToAdmins = async (notification, data = {}) => {
  try {
    console.log('Sending notification to all admins:', notification);

    // Get all admin users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No admin users found');
      return { success: true, count: 0 };
    }

    const promises = [];
    querySnapshot.forEach((doc) => {
      const adminId = doc.id;
      promises.push(sendNotificationToUser(adminId, notification, data));
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    console.log(`Notification sent to ${successful}/${results.length} admins`);

    return { success: true, count: successful };
  } catch (error) {
    console.error('Error sending notification to admins:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to role
export const sendNotificationToRole = async (role, notification, data = {}) => {
  try {
    console.log(`Sending notification to role ${role}:`, notification);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No users found with role: ${role}`);
      return { success: true, count: 0 };
    }

    const promises = [];
    querySnapshot.forEach((doc) => {
      const userId = doc.id;
      promises.push(sendNotificationToUser(userId, notification, data));
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    console.log(`Notification sent to ${successful}/${results.length} ${role}(s)`);

    return { success: true, count: successful };
  } catch (error) {
    console.error('Error sending role notification:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications (real-time listener) - SAFE VERSION
export const getUserNotifications = (userId, callback) => {
  try {
    console.log('Setting up notification listener for user:', userId);

    if (!userId) {
      console.error('User ID is required');
      callback([]);
      return () => {};
    }

    // Simple query without orderBy to avoid index requirements
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    return onSnapshot(q, 
      (snapshot) => {
        const notifications = [];
        snapshot.forEach(doc => {
          notifications.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort in JavaScript (newest first)
        notifications.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });

        console.log(`Received ${notifications.length} notifications for user ${userId}`);
        callback(notifications);
      }, 
      (error) => {
        console.error('Error in notification listener:', error);
        // Don't throw error, just return empty array
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Check if notifications are supported (utility function)
export const checkNotificationSupport = () => {
  return {
    supported: isNotificationSupported(),
    permission: isNotificationSupported() ? Notification.permission : 'unsupported',
    messagingAvailable: !!messaging
  };
};