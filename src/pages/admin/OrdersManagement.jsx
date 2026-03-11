import { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { generateBill } from '../../utils/generateBill';
import { assignOrderToPartner, getDeliveryPartners } from '../../services/deliveryService';
import { getAllOrders, updateOrderStatus } from '../../services/orderService';
import { useNotifications } from '../../hooks/useNotifications';
import {
  EyeIcon,
  TruckIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [bill, setBill] = useState(null);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('');
  const { notifyDeliveryAssigned } = useNotifications();

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  // Fetch orders and delivery partners on component mount
  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, []);

  // Fetch all orders from Firestore
  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log('Fetching all orders...');
      const fetchedOrders = await getAllOrders();
      console.log('Orders fetched:', fetchedOrders);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch delivery partners for assignment
  const fetchDeliveryBoys = async () => {
    try {
      console.log('Fetching delivery partners...');
      const partners = await getDeliveryPartners();
      console.log('Delivery partners:', partners);

      // Filter only active partners
      const activePartners = partners.filter(partner =>
        partner.status === 'active' && partner.isActive !== false
      );

      setDeliveryBoys(activePartners);
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      toast.error('Failed to load delivery partners');
    }
  };

  // Handle order status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log(`Updating order ${orderId} status to ${newStatus}`);

      // Update in Firestore
      await updateOrderStatus(orderId, newStatus);

      // Update local state
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  // Open assign delivery modal
  const handleOpenAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryBoy('');
    setShowAssignModal(true);
  };

  const handleAssignDelivery = async () => {
    if (!selectedDeliveryBoy) {
      toast.error('Please select a delivery partner');
      return;
    }

    try {
      // Find selected delivery boy details
      const deliveryBoy = deliveryBoys.find(boy => boy.id === selectedDeliveryBoy);

      if (!deliveryBoy) {
        toast.error('Selected delivery partner not found');
        return;
      }

      console.log(`Assigning order ${selectedOrder.id} to ${deliveryBoy.name}`);
      console.log('Order details:', selectedOrder);

      // Prepare order details with fallback values for undefined fields
      const orderDetails = {
        customerName: selectedOrder.customerName || selectedOrder.customer?.name || 'Customer',
        customerPhone: selectedOrder.customerPhone || selectedOrder.customer?.phone || '',
        customerAddress: selectedOrder.deliveryLocation?.address || selectedOrder.customerAddress || selectedOrder.customer?.address || 'Address not provided',
        total: selectedOrder.total || 0,
        items: selectedOrder.items || [],
        deliveryBoyName: deliveryBoy.name,
        deliveryLocation: selectedOrder.deliveryLocation || null
      };

      console.log('Order details for assignment:', orderDetails);

      // Update order in Firestore with delivery assignment
      await assignOrderToPartner(selectedOrder.id, selectedDeliveryBoy, orderDetails);

      // Update local state
      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? {
            ...order,
            deliveryBoy: {
              id: deliveryBoy.id,
              name: deliveryBoy.name
            },
            status: 'out_for_delivery'
          }
          : order
      ));

      // Send notification to delivery person
      try {
        await notifyDeliveryAssigned(selectedDeliveryBoy, {
          id: selectedOrder.id,
          customerName: orderDetails.customerName,
          customerPhone: orderDetails.customerPhone,
          address: orderDetails.customerAddress,
          total: orderDetails.total,
          deliveryLocation: orderDetails.deliveryLocation
        });
        console.log('✅ Notification sent to delivery partner');
      } catch (notifyError) {
        console.error('❌ Notification error:', notifyError);
      }

      toast.success(`Order assigned to ${deliveryBoy.name} successfully`);
      setShowAssignModal(false);

    } catch (error) {
      console.error('❌ Assignment error:', error);
      toast.error('Failed to assign delivery partner: ' + (error.message || 'Unknown error'));
    }
  };

  // Generate bill for order
  const handleGenerateBill = (order) => {
    const generatedBill = generateBill(order);
    setBill(generatedBill);
    setShowBillModal(true);
  };

  // Download bill as JSON
  const handleDownloadBill = () => {
    const billText = JSON.stringify(bill, null, 2);
    const blob = new Blob([billText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${bill.orderId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bill downloaded');
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order =>
    filter === 'all' ? true : order.status === filter
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
          >
            Refresh
          </Button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Location</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Payment</th>
                <th className="text-left py-3 px-4">Delivery Partner</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">#{order.id?.slice(-6)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span>{order.customerName || order.customer?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {order.customerPhone || order.customer?.phone ? (
                        <a
                          href={`tel:${order.customerPhone || order.customer?.phone}`}
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {order.customerPhone || order.customer?.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.deliveryLocation ? (
                        <div className="flex items-start" title={order.deliveryLocation.address}>
                          <MapPinIcon className="h-4 w-4 text-primary-500 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{order.deliveryLocation.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not specified</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        {order.items && order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-sm">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <div className="text-xs text-gray-500 mt-1">
                            +{order.items.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">₹{order.total}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 ${getStatusColor(order.status)}`}
                      >
                        {statuses.slice(1).map(status => (
                          <option key={status} value={status}>
                            {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${order.paymentMethod === 'Online' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {order.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.deliveryBoy ? (
                        <span className="text-sm font-medium text-primary-600">
                          {order.deliveryBoy.name}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignModal(order)}
                        >
                          <TruckIcon className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleGenerateBill(order)}
                          className="text-green-600 hover:text-green-800"
                          title="Generate Bill"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Assign Delivery Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Delivery Partner - Order ${selectedOrder?.id}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Delivery Partner
            </label>
            <select
              value={selectedDeliveryBoy}
              onChange={(e) => setSelectedDeliveryBoy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Choose a delivery partner</option>
              {deliveryBoys.map(boy => (
                <option key={boy.id} value={boy.id}>
                  {boy.name} ({boy.currentOrders || 0} active orders) - {boy.phone}
                </option>
              ))}
            </select>
            {deliveryBoys.length === 0 && (
              <p className="text-sm text-red-500 mt-2">
                No active delivery partners available. Please add partners in Manage Delivery Partners.
              </p>
            )}
          </div>

          {selectedOrder && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Order Summary</h3>
              <p className="text-sm"><strong>Customer:</strong> {selectedOrder.customerName || selectedOrder.customer?.name}</p>
              <p className="text-sm"><strong>Phone:</strong>
                <a href={`tel:${selectedOrder.customerPhone || selectedOrder.customer?.phone}`} className="text-primary-600 ml-1">
                  {selectedOrder.customerPhone || selectedOrder.customer?.phone || 'N/A'}
                </a>
              </p>
              <p className="text-sm"><strong>Delivery Location:</strong></p>
              {selectedOrder.deliveryLocation ? (
                <div className="ml-2 mt-1 p-2 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-800">{selectedOrder.deliveryLocation.name}</p>
                  <p className="text-xs text-blue-600 flex items-start mt-1">
                    <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0 mt-0.5" />
                    {selectedOrder.deliveryLocation.address}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 ml-2">{selectedOrder.customerAddress || selectedOrder.customer?.address || 'Not provided'}</p>
              )}
              <p className="text-sm mt-2"><strong>Total:</strong> ₹{selectedOrder.total}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignDelivery}
              disabled={!selectedDeliveryBoy || deliveryBoys.length === 0}
            >
              Assign Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Details Modal */}
      {selectedOrder && !showAssignModal && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - #${selectedOrder.id?.slice(-6)}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Customer Information
                </h3>
                <p className="text-sm"><strong>Name:</strong> {selectedOrder.customerName || selectedOrder.customer?.name}</p>
                <p className="text-sm"><strong>Phone:</strong>
                  {selectedOrder.customerPhone || selectedOrder.customer?.phone ? (
                    <a href={`tel:${selectedOrder.customerPhone || selectedOrder.customer?.phone}`} className="text-primary-600 ml-1">
                      {selectedOrder.customerPhone || selectedOrder.customer?.phone}
                    </a>
                  ) : ' N/A'}
                </p>
                <p className="text-sm"><strong>Email:</strong> {selectedOrder.userEmail || selectedOrder.customer?.email || 'N/A'}</p>

                {/* Delivery Location */}
                {selectedOrder.deliveryLocation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Delivery Location
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>{selectedOrder.deliveryLocation.name}:</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedOrder.deliveryLocation.address}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <p className="text-sm"><strong>Order Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p className="text-sm"><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'Cash'}</p>
                <p className="text-sm"><strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </p>
                {selectedOrder.deliveryBoy && (
                  <p className="text-sm mt-2"><strong>Delivery Partner:</strong> {selectedOrder.deliveryBoy.name}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">₹{item.price}</td>
                      <td className="py-2">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan="3" className="text-right py-2">Total:</td>
                    <td className="py-2 text-primary-600">₹{selectedOrder.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bill Modal */}
      {showBillModal && bill && (
        <Modal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          title={`Bill - ${bill.orderId}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold">Campus Food</h2>
              <p className="text-sm text-gray-600">Tax Invoice/Bill of Supply</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-semibold">Bill No:</span> {bill.billNumber}</p>
                <p><span className="font-semibold">Date:</span> {bill.date}</p>
                <p><span className="font-semibold">Order ID:</span> {bill.orderId}</p>
              </div>
              <div>
                <p><span className="font-semibold">Customer:</span> {bill.customerName}</p>
                <p><span className="font-semibold">Payment Method:</span> {bill.paymentMethod}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-2">Item</th>
                  <th className="text-right py-2 px-2">Qty</th>
                  <th className="text-right py-2 px-2">Price</th>
                  <th className="text-right py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2">{item.name}</td>
                    <td className="text-right py-2 px-2">{item.quantity}</td>
                    <td className="text-right py-2 px-2">₹{item.price}</td>
                    <td className="text-right py-2 px-2">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>₹{bill.total}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowBillModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleDownloadBill}
              >
                Download Bill
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OrdersManagement;