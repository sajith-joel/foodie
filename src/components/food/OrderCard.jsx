import { Link } from 'react-router-dom';
import { MapPinIcon, ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';

const statusConfig = {
  pending: { color: 'yellow', icon: ClockIcon, text: 'Pending' },
  confirmed: { color: 'blue', icon: CheckCircleIcon, text: 'Confirmed' },
  preparing: { color: 'purple', icon: ClockIcon, text: 'Preparing' },
  out_for_delivery: { color: 'indigo', icon: TruckIcon, text: 'Out for Delivery' },
  delivered: { color: 'green', icon: CheckCircleIcon, text: 'Delivered' },
  cancelled: { color: 'red', icon: XCircleIcon, text: 'Cancelled' },
};

const OrderCard = ({ order, role = 'student' }) => {
  const StatusIcon = statusConfig[order.status]?.icon || ClockIcon;
  const statusColor = statusConfig[order.status]?.color || 'gray';
  const statusText = statusConfig[order.status]?.text || order.status;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.id?.slice(-6) || 'N/A'}</h3>
          <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-800 flex items-center space-x-1`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{statusText}</span>
        </div>
      </div>

      {/* Delivery Location (if available) */}
      {order.deliveryLocation && (
        <div className="flex items-start space-x-2 text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
          <MapPinIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-600" />
          <span>{order.deliveryLocation.address || order.deliveryLocation.name}</span>
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium text-gray-700">Items:</p>
        {order.items && order.items.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{item.quantity}x {item.name}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-xl font-bold text-primary-600">₹{order.total}</span>
        </div>

        {/* Delivery Partner Info (for assigned orders) */}
        {order.deliveryBoy && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <TruckIcon className="h-4 w-4" />
            <span>Delivery by: {order.deliveryBoy.name}</span>
          </div>
        )}

        {/* Payment Method */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>Payment:</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            order.paymentMethod === 'Online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {order.paymentMethod || 'Cash'}
          </span>
        </div>

        {/* Action Button */}
        <Link
          to={`/order-tracking/${order.id}`}
          className="block text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Track Order
        </Link>
      </div>
    </div>
  );
};

export default OrderCard;