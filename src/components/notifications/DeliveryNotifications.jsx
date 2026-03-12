import { useEffect, useState, useRef } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'delivery') return;

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

      const activeNotifications = newNotifications.filter(notif => {
        if (notif.type === 'order_assigned') return true;
        if (notif.type === 'order_status') {
          return notif.data?.status !== 'delivered';
        }
        return false;
      });

      setNotifications(activeNotifications);
      const unread = activeNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      const latestUnread = activeNotifications.find(n => !n.read && n.type === 'order_assigned');
      if (latestUnread) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-[90vw] sm:max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col sm:flex-row ring-1 ring-black ring-opacity-5 cursor-pointer mx-2 sm:mx-0`}
            onClick={() => {
              toast.dismiss(t.id);
              markAsRead(latestUnread.id);
              if (latestUnread.data?.orderId) {
                // ✅ Navigate to delivery order view page
                navigate(`/delivery/order/${latestUnread.data.orderId}`);
              } else {
                navigate('/delivery/orders');
              }
              setIsOpen(false);
            }}
          >
            <div className="flex-1 w-0 p-3 sm:p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-base sm:text-lg">🚚</span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {latestUnread.title}
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
                    {latestUnread.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-t sm:border-t-0 sm:border-l border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(t.id);
                }}
                className="w-full sm:w-auto border border-transparent rounded-b-lg sm:rounded-none sm:rounded-r-lg p-3 sm:p-4 flex items-center justify-center text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none touch-manipulation"
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
  }, [user, navigate]);

  // Auto-close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

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

  const markAllAsRead = async () => {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => markAsRead(n.id));
    await Promise.all(promises);
  };

  const handleViewOrder = (e, notification) => {
    e.stopPropagation();
    if (notification.data?.orderId) {
      // ✅ Navigate to delivery order view page
      navigate(`/delivery/order/${notification.data.orderId}`);
    } else {
      navigate('/delivery/orders');
    }
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  if (!user || user.role !== 'delivery') return null;

  return (
    <div className="relative delivery-notification-container">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          <div 
            ref={dropdownRef}
            className={`
              fixed sm:absolute z-50 
              bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mt-2
              w-full sm:w-80 md:w-96
              bg-white rounded-t-xl sm:rounded-lg shadow-xl border border-gray-200
              max-h-[80vh] sm:max-h-96
              flex flex-col
              animate-slide-up sm:animate-none
            `}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0 bg-white rounded-t-xl sm:rounded-t-lg">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 px-2 py-1 touch-manipulation rounded hover:bg-primary-50 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg touch-manipulation"
                aria-label="Close"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-gray-500">
                  <BellIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                  <p className="text-xs sm:text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${!notification.read ? 'bg-blue-50/50' : ''}
                    `}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'order_assigned' ? (
                          <span className="text-lg sm:text-xl">🚚</span>
                        ) : (
                          <span className="text-lg sm:text-xl">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        
                        <button
                          onClick={(e) => handleViewOrder(e, notification)}
                          className="mt-2 text-xs bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-1 rounded hover:bg-primary-700 touch-manipulation w-full sm:w-auto transition-colors"
                        >
                          View Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Close Button */}
            <div className="p-3 border-t border-gray-200 text-center sm:hidden flex-shrink-0 bg-white">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700 py-2 w-full touch-manipulation rounded hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryNotifications;