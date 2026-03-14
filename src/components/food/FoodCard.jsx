import { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useDiscounts } from '../../context/DiscountContext';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import toast from 'react-hot-toast';

const FoodCard = ({ food }) => {
  const { addToCart } = useCart();
  const { activeDiscounts, applyDiscount } = useDiscounts();
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const handleAddToCart = () => {
    if (activeDiscounts.length > 0) {
      setShowDiscountModal(true);
    } else {
      addToCart({ 
        ...food, 
        quantity,
        price: food.price,
        originalPrice: food.price,
        discountApplied: null
      });
      toast.success(`${food.name} added to cart`);
    }
  };

  const handleApplyDiscount = async (discount) => {
    try {
      const newPrice = await applyDiscount(discount.id, food.id, food.price);
      
      if (newPrice !== null) {
        addToCart({ 
          ...food, 
          quantity,
          price: newPrice,
          originalPrice: food.price,
          discountApplied: {
            id: discount.id,
            label: discount.label,
            type: discount.type
          }
        });
        
        toast.success(`Applied ${discount.label} to ${food.name}!`);
        setShowDiscountModal(false);
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    }
  };

  const handleAddWithoutDiscount = () => {
    addToCart({ 
      ...food, 
      quantity,
      price: food.price,
      originalPrice: food.price,
      discountApplied: null
    });
    toast.success(`${food.name} added to cart`);
    setShowDiscountModal(false);
  };

  const imageUrl = food.image || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors">
        {/* Image Section - iPhone Optimized */}
        <div className="relative h-32 xs:h-36 overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={food.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
            loading="lazy"
          />
          
          {/* Favorite Button - iPhone Optimized */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center active:bg-gray-100 transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-4 w-4 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {/* Veg/Non-Veg Badge */}
          {food.isVegetarian && (
            <span className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full font-medium">
              Veg
            </span>
          )}

          {/* Discount Badge */}
          {activeDiscounts.length > 0 && (
            <span className="absolute bottom-2 right-2 bg-purple-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center">
              <span className="mr-1">🎁</span>
              <span className="hidden xs:inline">Discount</span>
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Title and Price */}
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-[13px] font-medium text-gray-900 line-clamp-1 flex-1 pr-2">
              {food.name}
            </h3>
            <span className="text-[13px] font-semibold text-primary-600 whitespace-nowrap">
              ₹{food.price}
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">
            {food.description || 'No description available'}
          </p>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors text-base font-medium"
                disabled={food.available === 0}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 text-center text-[13px] font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors text-base font-medium"
                disabled={quantity >= food.available}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="text-[10px] text-gray-400">
              {food.available > 0 ? (
                <span>{food.available} left</span>
              ) : (
                'Out of stock'
              )}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={food.available === 0}
            className={`mt-3 w-full py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
              food.available === 0
                ? 'bg-gray-100 text-gray-400'
                : 'bg-primary-600 text-white active:bg-primary-700'
            }`}
          >
            {food.available === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Discount Modal */}
      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Apply Discount"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-[13px] text-gray-600">
            You have {activeDiscounts.length} active discount{activeDiscounts.length > 1 ? 's' : ''}! 
            Apply to this item?
          </p>

          {/* Discount List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeDiscounts.map((discount) => (
              <button
                key={discount.id}
                onClick={() => handleApplyDiscount(discount)}
                className="w-full p-2 border rounded-lg active:bg-purple-50 transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <span className="text-[13px] font-semibold text-purple-600">
                    {discount.label}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Expires: {new Date(discount.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-lg">🎁</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleAddWithoutDiscount}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium active:bg-gray-50 transition-colors"
            >
              Add Without
            </button>
            <button
              onClick={() => setShowDiscountModal(false)}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-[13px] font-medium active:bg-primary-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FoodCard;