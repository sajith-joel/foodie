import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { 
  SparklesIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  CogIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ManageSpinWheel = () => {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    color: '#FF6B6B',
    icon: '🎁',
    probability: 10,
    type: 'discount'
  });

  const prizeTypes = [
    { id: 'discount', value: 'discount', label: 'Discount %' },
    { id: 'free', value: 'free', label: 'Free Delivery' },
    { id: 'bogo', value: 'bogo', label: 'Buy One Get One' },
    { id: 'tryagain', value: 'tryagain', label: 'Try Again' },
    { id: 'custom', value: 'custom', label: 'Custom' }
  ];

  // Load prizes from Firebase
  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    setLoading(true);
    try {
      const prizesRef = collection(db, 'wheel_prizes');
      const snapshot = await getDocs(prizesRef);
      
      const loadedPrizes = [];
      snapshot.forEach((doc) => {
        if (doc.id) {
          loadedPrizes.push({ 
            id: doc.id,
            ...doc.data() 
          });
        }
      });
      
      // Sort by order if exists
      loadedPrizes.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPrizes(loadedPrizes);
      
    } catch (error) {
      console.error('Error loading prizes:', error);
      toast.error('Failed to load prizes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prize = null) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        label: prize.label || '',
        value: prize.value?.toString() || '',
        color: prize.color || '#FF6B6B',
        icon: prize.icon || '🎁',
        probability: prize.probability || 10,
        type: prize.type || 'discount'
      });
    } else {
      setEditingPrize(null);
      setFormData({
        label: '',
        value: '',
        color: '#FF6B6B',
        icon: '🎁',
        probability: 10,
        type: 'discount'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.label.trim()) {
      toast.error('Please enter a prize label');
      return;
    }

    const loadingToast = toast.loading('Saving prize...');

    try {
      const prizesRef = collection(db, 'wheel_prizes');
      
      // Prepare prize data
      const prizeData = {
        label: formData.label.trim(),
        color: formData.color,
        icon: formData.icon || '🎁',
        probability: Number(formData.probability) || 10,
        type: formData.type,
        updatedAt: new Date().toISOString()
      };

      // Handle value based on type
      if (formData.type === 'discount') {
        prizeData.value = Number(formData.value) || 0;
      } else {
        prizeData.value = formData.value || formData.type;
      }

      if (editingPrize && editingPrize.id) {
        // Update existing prize
        const prizeRef = doc(db, 'wheel_prizes', editingPrize.id);
        await updateDoc(prizeRef, prizeData);
        toast.dismiss(loadingToast);
        toast.success('Prize updated successfully');
      } else {
        // Add new prize
        prizeData.order = prizes.length;
        prizeData.createdAt = new Date().toISOString();
        await addDoc(prizesRef, prizeData);
        toast.dismiss(loadingToast);
        toast.success('Prize added successfully');
      }
      
      setIsModalOpen(false);
      loadPrizes(); // Refresh the list
      
    } catch (error) {
      console.error('Error saving prize:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to save prize: ' + error.message);
    }
  };

  const handleDelete = async (prizeId) => {
    if (!prizeId) {
      toast.error('Invalid prize ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this prize?')) return;
    
    const loadingToast = toast.loading('Deleting prize...');
    
    try {
      const prizeRef = doc(db, 'wheel_prizes', prizeId);
      await deleteDoc(prizeRef);
      toast.dismiss(loadingToast);
      toast.success('Prize deleted successfully');
      loadPrizes(); // Refresh the list
    } catch (error) {
      console.error('Error deleting prize:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to delete prize: ' + error.message);
    }
  };

  const movePrize = async (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === prizes.length - 1)) {
      return;
    }

    const loadingToast = toast.loading('Reordering prizes...');
    
    try {
      const newPrizes = [...prizes];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap orders
      const tempOrder = newPrizes[index].order;
      newPrizes[index].order = newPrizes[swapIndex].order;
      newPrizes[swapIndex].order = tempOrder;
      
      // Update in Firebase
      await Promise.all([
        updateDoc(doc(db, 'wheel_prizes', newPrizes[index].id), { order: newPrizes[index].order }),
        updateDoc(doc(db, 'wheel_prizes', newPrizes[swapIndex].id), { order: newPrizes[swapIndex].order })
      ]);
      
      // Swap positions in local state
      [newPrizes[index], newPrizes[swapIndex]] = [newPrizes[swapIndex], newPrizes[index]];
      setPrizes(newPrizes);
      
      toast.dismiss(loadingToast);
      toast.success('Prize order updated');
    } catch (error) {
      console.error('Error reordering prizes:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to reorder prizes');
    }
  };

  const getValueDisplay = (prize) => {
    if (!prize) return 'N/A';
    
    switch(prize.type) {
      case 'discount':
        return prize.value ? `${prize.value}% OFF` : '0% OFF';
      case 'free':
        return 'FREE DELIVERY';
      case 'bogo':
        return 'BUY 1 GET 1';
      case 'tryagain':
        return 'TRY AGAIN';
      default:
        return prize.label || 'Custom Prize';
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
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <CogIcon className="h-8 w-8 mr-2 text-purple-600" />
          Manage Spin Wheel
        </h1>
        <Button onClick={() => handleOpenModal()} variant="primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Prize
        </Button>
      </div>

      {/* Prizes List */}
      <GlassCard className="overflow-hidden">
        {prizes.length === 0 ? (
          <div className="text-center py-12">
            <SparklesIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Prizes Yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first prize to the wheel.</p>
            <Button onClick={() => handleOpenModal()} variant="primary">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add First Prize
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4">Order</th>
                  <th className="text-left py-3 px-4">Icon</th>
                  <th className="text-left py-3 px-4">Label</th>
                  <th className="text-left py-3 px-4">Value</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Color</th>
                  <th className="text-left py-3 px-4">Probability</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((prize, index) => (
                  <tr key={prize.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="w-6 text-center">{index + 1}</span>
                        <button
                          onClick={() => movePrize(index, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded hover:bg-gray-200 ${
                            index === 0 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Move up"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => movePrize(index, 'down')}
                          disabled={index === prizes.length - 1}
                          className={`p-1 rounded hover:bg-gray-200 ${
                            index === prizes.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Move down"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-2xl">{prize.icon || '🎁'}</td>
                    <td className="py-3 px-4 font-medium">{prize.label || 'Unnamed'}</td>
                    <td className="py-3 px-4">{getValueDisplay(prize)}</td>
                    <td className="py-3 px-4 capitalize">{prize.type || 'discount'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full border" 
                          style={{ backgroundColor: prize.color || '#FF6B6B' }}
                        />
                        <span className="text-sm">{prize.color || '#FF6B6B'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{prize.probability || 10}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${prize.probability || 10}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenModal(prize)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(prize.id)}
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
        title={editingPrize ? 'Edit Prize' : 'Add New Prize'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prize Label *"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., 10% OFF"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prize Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                required
              >
                {prizeTypes.map((type) => (
                  <option key={type.id} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {formData.type === 'discount' ? (
              <Input
                label="Discount Value (%) *"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                min="0"
                max="100"
                required
              />
            ) : (
              <Input
                label="Value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., free, bogo"
                disabled={formData.type === 'free' || formData.type === 'bogo' || formData.type === 'tryagain'}
              />
            )}

            <Input
              label="Probability (%) *"
              type="number"
              value={formData.probability?.toString() || '10'}
              onChange={(e) => {
                const value = e.target.value === '' ? 10 : parseInt(e.target.value) || 10;
                setFormData({ ...formData, probability: value });
              }}
              min="0"
              max="100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded border"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="#FF6B6B"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            <Input
              label="Icon (Emoji) *"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🎁"
              maxLength="2"
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Make sure total probability across all prizes equals 100% for fair distribution.
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
            <Button type="submit" variant="primary">
              {editingPrize ? 'Update' : 'Add'} Prize
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageSpinWheel;