import { Link } from 'react-router-dom';
import { MapPinIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon, text: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-700', icon: ClockIcon, text: 'Confirmed' },
  preparing: { color: 'bg-purple-100 text-purple-700', icon: ClockIcon, text: 'Preparing' },
  out_for_delivery: { color: 'bg-indigo-100 text-indigo-700', icon: TruckIcon, text: 'Out for Delivery' },
  delivered: { color: 'bg-green-100 text-green-700', icon: ClockIcon, text: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-700', icon: ClockIcon, text: 'Cancelled' },
};

const OrderCard = ({ order, role = 'student' }) => {
  const StatusIcon = statusConfig[order.status]?.icon || ClockIcon;
  const statusClass = statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700';
  const statusText = statusConfig[order.status]?.text || order.status;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 active:bg-gray-50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Order #{order.id?.slice(-6)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-full ${statusClass} flex items-center space-x-1`}>
          <StatusIcon className="h-3 w-3" />
          <span className="text-[10px] font-medium">{statusText}</span>
        </div>
      </div>

      {/* Delivery Location */}
      {order.deliveryLocation && (
        <div className="flex items-start space-x-1.5 mb-3">
          <MapPinIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-600 line-clamp-1">
            {order.deliveryLocation.name}
          </p>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
        <div className="space-y-1.5">
          {order.items?.slice(0, 2).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-[11px] text-gray-700">
                <span className="font-medium">{item.quantity}x</span> {item.name}
              </span>
              <span className="text-[11px] font-medium text-gray-900">
                ₹{item.price * item.quantity}
              </span>
            </div>
          ))}
          {order.items?.length > 2 && (
            <p className="text-[10px] text-gray-500 text-center pt-1">
              +{order.items.length - 2} more items
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500">Total Amount</p>
          <p className="text-base font-bold text-primary-600">₹{order.total}</p>
        </div>
        <Link
          to={`/order-tracking/${order.id}`}
          className="px-4 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg active:bg-primary-700 transition-colors"
        >
          Track Order
        </Link>
      </div>

      {/* Delivery Partner Info (if assigned) */}
      {order.deliveryBoy && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1.5">
            <TruckIcon className="h-3.5 w-3.5 text-gray-400" />
            <p className="text-[10px] text-gray-600">
              Delivery by: {order.deliveryBoy.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;