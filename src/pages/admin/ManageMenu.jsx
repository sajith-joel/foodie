import { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getAllMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../../services/menuService';
import toast from 'react-hot-toast';

const ManageMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    isVegetarian: false,
    available: '',
    status: 'available' // available, coming_soon, sold_out
  });

  const categories = ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages', 'desserts'];
  const statusOptions = [
    { value: 'available', label: 'Available', color: 'green', description: 'Item is in stock and can be ordered' },
    { value: 'coming_soon', label: 'Coming Soon', color: 'yellow', description: 'Item will be available later (e.g., 10 AM)' },
    { value: 'sold_out', label: 'Sold Out', color: 'red', description: 'Item is out of stock' }
  ];

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const items = await getAllMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category: item.category || '',
        image: item.image || '',
        isVegetarian: item.isVegetarian || false,
        available: item.available || '',
        status: item.status || 'available'
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        isVegetarian: false,
        available: '',
        status: 'available'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isNaN(formData.price) || Number(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const itemData = {
        ...formData,
        price: Number(formData.price),
        available: formData.available ? Number(formData.available) : 0,
        isVegetarian: formData.isVegetarian,
        status: formData.status // Make sure status is included
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
        toast.success('Menu item updated successfully');
      } else {
        await addMenuItem(itemData);
        toast.success('Menu item added successfully');
      }
      
      setIsModalOpen(false);
      fetchMenuItems();
      
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuItem(id);
        toast.success('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        toast.error('Failed to delete menu item');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'coming_soon':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">⏰ Coming Soon</span>;
      case 'sold_out':
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">❌ Sold Out</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅ Available</span>;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'coming_soon': return 'border-yellow-400 bg-yellow-50';
      case 'sold_out': return 'border-red-400 bg-red-50';
      default: return 'border-green-400 bg-green-50';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      breakfast: 'bg-yellow-100 text-yellow-800',
      lunch: 'bg-green-100 text-green-800',
      dinner: 'bg-purple-100 text-purple-800',
      snacks: 'bg-orange-100 text-orange-800',
      beverages: 'bg-blue-100 text-blue-800',
      desserts: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Menu</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={fetchMenuItems}
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleOpenModal()} variant="primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Item
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No menu items found. Click "Add New Item" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Image</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Available</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Actions</th>
                 </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/48';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                          No img
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">₹{item.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available > 0 ? `${item.available} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.isVegetarian ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Item Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Masala Dosa"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Describe the item..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹) *"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., 80"
              min="0"
              step="0.01"
              required
            />

            <Input
              label="Available Quantity"
              type="number"
              value={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.value })}
              placeholder="e.g., 10"
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Image URL"
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Item Status Selection - New Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Item Status *
            </label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.status === option.value
                      ? `${getStatusColor(option.value)} border-2`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={formData.status === option.value}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`font-semibold ${
                        option.value === 'coming_soon' ? 'text-yellow-600' :
                        option.value === 'sold_out' ? 'text-red-600' :
                        'text-green-600'
                      }`}>
                        {option.label}
                      </span>
                      {formData.status === option.value && (
                        <span className="ml-2 text-xs text-green-600">✓ Selected</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Veg/Non-Veg Selection */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Food Type *
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="foodType"
                  checked={formData.isVegetarian === true}
                  onChange={() => setFormData({ ...formData, isVegetarian: true })}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="flex items-center">
                  <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Vegetarian</span>
                </span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="foodType"
                  checked={formData.isVegetarian === false}
                  onChange={() => setFormData({ ...formData, isVegetarian: false })}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-sm font-medium text-gray-700">Non-Vegetarian</span>
                </span>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>📋 Status Guide:</strong><br/>
              • <strong>Available</strong> - Item is ready to order<br/>
              • <strong>Coming Soon</strong> - Show "Coming Soon" badge (for items arriving later)<br/>
              • <strong>Sold Out</strong> - Show "Sold Out" badge (for items out of stock)
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageMenu;