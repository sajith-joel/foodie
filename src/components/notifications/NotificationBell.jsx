import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Set up real-time notification listener
    const unsubscribe = getUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    // No need to update state here as the real-time listener will update
  };

  const markAllAsRead = async () => {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => markNotificationAsRead(n.id));
    await Promise.all(promises);
  };

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type and user role
    handleNavigation(notification);
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleViewOrder = (e, notification) => {
    e.stopPropagation();
    handleNavigation(notification);
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleNavigation = (notification) => {
    const { type, data } = notification;
    
    // Admin navigation
    if (role === 'admin') {
      if (type === 'new_order' || type === 'order_status') {
        navigate('/admin/orders');
      }
    }
    
    // Delivery partner navigation
    else if (role === 'delivery') {
      if (type === 'order_assigned') {
        if (data?.orderId) {
          navigate(`/delivery/orders/${data.orderId}`);
        } else {
          navigate('/delivery/orders');
        }
      } else if (type === 'order_status') {
        if (data?.orderId) {
          navigate(`/delivery/orders/${data.orderId}`);
        } else {
          navigate('/delivery/orders');
        }
      }
    }
    
    // Student navigation
    else if (role === 'student') {
      if (type === 'order_status' && data?.orderId) {
        navigate(`/order-tracking/${data.orderId}`);
      }
    }
  };

  const getNotificationIcon = (notification) => {
    const { type } = notification;
    switch(type) {
      case 'new_order': return '🆕';
      case 'order_assigned': return '🚚';
      case 'order_status': 
        if (notification.data?.status === 'delivered') return '✅';
        if (notification.data?.status === 'out_for_delivery') return '🚚';
        return '📦';
      default: return '🔔';
    }
  };

  const getButtonText = (notification) => {
    const { type } = notification;
    if (role === 'admin' && (type === 'new_order' || type === 'order_status')) {
      return 'View Orders';
    }
    if (role === 'delivery' && type === 'order_assigned') {
      return 'View Order';
    }
    if (role === 'student' && type === 'order_status') {
      return 'Track Order';
    }
    return 'View';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellSolidIcon className="h-6 w-6 text-primary-600" />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[32rem] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-xl">{getNotificationIcon(notification)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1 break-words">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      
                      {/* View Order Button - Shows for all relevant notifications */}
                      {(role === 'admin' && (notification.type === 'new_order' || notification.type === 'order_status')) && (
                        <button
                          onClick={(e) => handleViewOrder(e, notification)}
                          className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                        >
                          View Orders
                        </button>
                      )}
                      
                      {role === 'delivery' && notification.type === 'order_assigned' && (
                        <button
                          onClick={(e) => handleViewOrder(e, notification)}
                          className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                        >
                          View Order
                        </button>
                      )}
                      
                      {role === 'student' && notification.type === 'order_status' && (
                        <button
                          onClick={(e) => handleViewOrder(e, notification)}
                          className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                        >
                          Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t text-center flex-shrink-0">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;