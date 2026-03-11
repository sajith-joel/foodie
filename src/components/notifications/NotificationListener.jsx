import { useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import toast from 'react-hot-toast';

const NotificationListener = () => {
  const { notifications, unreadCount } = useNotifications();

  useEffect(() => {
    // Show toast for new notifications
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Only show toast for unread notifications
      if (!latestNotification.read) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-lg">🔔</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {latestNotification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {latestNotification.body}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
        });
      }
    }
  }, [notifications]);

  return null; // This component doesn't render anything
};

export default NotificationListener;