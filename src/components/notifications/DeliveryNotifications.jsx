import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DeliveryNotifications = ({ onOrderComplete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'delivery') return;

    // Listen for new assignments and status updates
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('type', 'in', ['order_assigned', 'order_status']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = [];
      snapshot.forEach(doc => {
        newNotifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Filter out notifications for delivered orders
      const activeNotifications = newNotifications.filter(notif => {
        // Keep assigned notifications
        if (notif.type === 'order_assigned') return true;
        
        // For status updates, only show if not delivered
        if (notif.type === 'order_status') {
          return notif.data?.status !== 'delivered';
        }
        
        return false;
      });

      setNotifications(activeNotifications);
      
      // Show toast for new unread notifications
      const unread = activeNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Show toast for the latest unread assignment
      const latestUnread = activeNotifications.find(n => !n.read && n.type === 'order_assigned');
      if (latestUnread) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
            onClick={() => {
              toast.dismiss(t.id);
              markAsRead(latestUnread.id);
              navigate(`/delivery/orders`);
            }}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-lg">🚚</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {latestUnread.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {latestUnread.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 10000,
          position: 'top-right',
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = () => {
    navigate('/delivery/orders');
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  if (!user || user.role !== 'delivery') return null;

  return (
    <div className="relative">
      <button
        onClick={handleNotificationClick}
        className="relative p-2 hover:bg-gray-100 rounded-lg"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default DeliveryNotifications;