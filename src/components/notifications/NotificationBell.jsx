import { useState, useEffect, useRef } from 'react';
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
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = getUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

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
    await markNotificationAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    const promises = notifications
      .filter(n => !n.read)
      .map(n => markNotificationAsRead(n.id));
    await Promise.all(promises);
  };

  const handleNotificationClick = (notification) => {
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
    setIsOpen(false);
  };

  const handleNavigation = (notification) => {
    const { type, data } = notification;
    
    if (role === 'admin') {
      if (type === 'new_order' || type === 'order_status') {
        navigate('/admin/orders');
      }
    } else if (role === 'delivery') {
      if (type === 'order_assigned') {
        if (data?.orderId) {
          navigate(`/delivery/orders/${data.orderId}`);
        } else {
          navigate('/delivery/orders');
        }
      }
    } else if (role === 'student') {
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

  return (
    <div className="relative notification-container">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        {unreadCount > 0 ? (
          <>
            <BellSolidIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop for mobile - closes when tapped */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Panel */}
          <div 
            ref={dropdownRef}
            className={`
              fixed sm:absolute z-50 
              bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:mt-2
              w-full sm:w-80 md:w-96
              bg-white rounded-t-xl sm:rounded-lg shadow-xl border border-gray-200
              max-h-[80vh] sm:max-h-[32rem] 
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
              {/* Close button for mobile */}
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
                  <p className="text-xs sm:text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors
                      ${!notification.read ? 'bg-blue-50/50' : ''}
                      touch-manipulation
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-lg sm:text-xl">{getNotificationIcon(notification)}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        
                        {/* Action Button */}
                        {(role === 'admin' && (notification.type === 'new_order' || notification.type === 'order_status')) && (
                          <button
                            onClick={(e) => handleViewOrder(e, notification)}
                            className="mt-2 text-xs bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-1 rounded hover:bg-primary-700 touch-manipulation w-full sm:w-auto transition-colors"
                          >
                            View Orders
                          </button>
                        )}
                        
                        {role === 'delivery' && notification.type === 'order_assigned' && (
                          <button
                            onClick={(e) => handleViewOrder(e, notification)}
                            className="mt-2 text-xs bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-1 rounded hover:bg-primary-700 touch-manipulation w-full sm:w-auto transition-colors"
                          >
                            View Order
                          </button>
                        )}
                        
                        {role === 'student' && notification.type === 'order_status' && (
                          <button
                            onClick={(e) => handleViewOrder(e, notification)}
                            className="mt-2 text-xs bg-primary-600 text-white px-2 sm:px-3 py-1.5 sm:py-1 rounded hover:bg-primary-700 touch-manipulation w-full sm:w-auto transition-colors"
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

            {/* Footer for mobile */}
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

export default NotificationBell;