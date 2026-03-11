import { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getDeliveryPartners, addDeliveryPartner, updateDeliveryPartner, deleteDeliveryPartner } from '../../services/deliveryService';
import toast from 'react-hot-toast';

const ManageDeliveryBoys = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    status: 'active'
  });

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    setLoading(true);
    try {
      const partners = await getDeliveryPartners();
      console.log('Fetched delivery partners:', partners);
      setDeliveryBoys(partners);
      
      if (partners.length === 0) {
        // Use info toast instead of success for empty state
        toast('No delivery partners found. Add one using the "Add New Partner" button.', {
          icon: 'ℹ️',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (boy = null) => {
    if (boy) {
      setEditingBoy(boy);
      setFormData({
        name: boy.name || '',
        email: boy.email || '',
        phone: boy.phone || '',
        vehicleNumber: boy.vehicleNumber || '',
        status: boy.status || 'active'
      });
    } else {
      setEditingBoy(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        vehicleNumber: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingBoy) {
        await updateDeliveryPartner(editingBoy.id, formData);
        toast.success('Delivery partner updated successfully');
      } else {
        await addDeliveryPartner(formData);
        toast.success('Delivery partner added successfully');
      }
      setIsModalOpen(false);
      fetchDeliveryBoys(); // Refresh the list
    } catch (error) {
      console.error('Error saving delivery partner:', error);
      toast.error('Failed to save delivery partner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this delivery partner?')) {
      try {
        await deleteDeliveryPartner(id);
        toast.success('Delivery partner removed successfully');
        fetchDeliveryBoys(); // Refresh the list
      } catch (error) {
        console.error('Error deleting delivery partner:', error);
        toast.error('Failed to remove delivery partner');
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDeliveryPartner(id, { status: newStatus });
      toast.success(`Partner ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchDeliveryBoys(); // Refresh the list
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Delivery Partners</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={fetchDeliveryBoys}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleOpenModal()} variant="primary">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add New Partner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <p className="text-sm text-gray-600">Total Partners</p>
          <p className="text-2xl font-bold">{deliveryBoys.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-600">Active Now</p>
          <p className="text-2xl font-bold text-green-600">
            {deliveryBoys.filter(b => b.status === 'active').length}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-600">Total Deliveries</p>
          <p className="text-2xl font-bold">
            {deliveryBoys.reduce((sum, boy) => sum + (boy.totalDeliveries || 0), 0)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-600">Avg Rating</p>
          <p className="text-2xl font-bold text-yellow-500">
            {deliveryBoys.length > 0 
              ? (deliveryBoys.reduce((sum, boy) => sum + (boy.rating || 0), 0) / deliveryBoys.length).toFixed(1)
              : '0.0'}
          </p>
        </GlassCard>
      </div>

      {/* Delivery Partners List */}
      <GlassCard className="overflow-hidden">
        {deliveryBoys.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Partners</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first delivery partner.</p>
            <Button onClick={() => handleOpenModal()} variant="primary">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add New Partner
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Vehicle</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Deliveries</th>
                  <th className="text-left py-3 px-4">Rating</th>
                  <th className="text-left py-3 px-4">Current Orders</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveryBoys.map((boy) => (
                  <tr key={boy.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{boy.name}</td>
                    <td className="py-3 px-4">
                      <div>{boy.email}</div>
                      <div className="text-sm text-gray-500">{boy.phone}</div>
                    </td>
                    <td className="py-3 px-4">{boy.vehicleNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleStatus(boy.id, boy.status)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                          boy.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {boy.status === 'active' ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <XCircleIcon className="h-4 w-4" />
                        )}
                        <span className="capitalize">{boy.status}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">{boy.totalDeliveries || 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {boy.rating || 0}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {boy.currentOrders || 0} active
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenModal(boy)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(boy.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBoy ? 'Edit Delivery Partner' : 'Add New Delivery Partner'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />

            <Input
              label="Phone Number *"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <Input
            label="Vehicle Number"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            placeholder="e.g., DL-01-AB-1234"
          />

          {editingBoy && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingBoy ? 'Update' : 'Add'} Partner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDeliveryBoys;