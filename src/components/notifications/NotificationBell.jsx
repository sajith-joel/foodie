import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-4 border-b flex justify-between items-center">
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

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            {notification.title?.includes('🚚') ? (
                                                <span className="text-xl">🚚</span>
                                            ) : notification.title?.includes('✅') ? (
                                                <span className="text-xl">✅</span>
                                            ) : notification.title?.includes('🆕') ? (
                                                <span className="text-xl">🆕</span>
                                            ) : (
                                                <span className="text-xl">🔔</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.body}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>

                                            {/* Show action buttons for specific notification types */}
                                            {notification.data?.type === 'order_assigned' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `/delivery/orders/${notification.data.orderId}`;
                                                    }}
                                                    className="mt-2 text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                                                >
                                                    View Order
                                                </button>
                                            )}

                                            {notification.data?.type === 'order_status' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `/order-tracking/${notification.data.orderId}`;
                                                    }}
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

                    <div className="p-3 border-t text-center">
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