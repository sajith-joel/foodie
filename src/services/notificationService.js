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

// Request permission and get FCM token
export const requestNotificationPermission = async (userId, userRole) => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return { success: false, error: 'Notifications not supported' };
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      let token = null;

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
      await addDoc(collection(db, 'user_notifications'), {
        userId,
        userRole,
        fcmToken: token || null,
        notificationsEnabled: true,
        updatedAt: new Date().toISOString()
      });

      return { success: true, token };
    }

    return { success: false, error: 'Permission denied' };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, error: error.message };
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  return new Promise((resolve, reject) => {
    if (!messaging) {
      reject('Messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);
    });
  });
};

// Send notification to specific user
export const sendNotificationToUser = async (targetUserId, notification, data = {}) => {
  try {
    console.log(`Sending notification to user ${targetUserId}:`, notification);

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

    const promises = [];
    querySnapshot.forEach((doc) => {
      const adminId = doc.id;
      promises.push(sendNotificationToUser(adminId, notification, data));
    });

    const results = await Promise.all(promises);
    console.log(`Notification sent to ${results.length} admins`);

    return { success: true, count: results.length };
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

    const promises = [];
    querySnapshot.forEach((doc) => {
      const userId = doc.id;
      promises.push(sendNotificationToUser(userId, notification, data));
    });

    const results = await Promise.all(promises);
    console.log(`Notification sent to ${results.length} ${role}(s)`);

    return { success: true, count: results.length };
  } catch (error) {
    console.error('Error sending role notification:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications (real-time listener)
// Get user notifications - SIMPLIFIED VERSION (no index needed)
export const getUserNotifications = (userId, callback) => {
  try {
    console.log('Setting up notification listener for user:', userId);

    // Simple query without orderBy
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
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

      console.log(`Received ${notifications.length} notifications`);
      callback(notifications);
    }, (error) => {
      console.error('Error in notification listener:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up notification listener:', error);
    callback([]);
    return () => { };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false };
  }
};