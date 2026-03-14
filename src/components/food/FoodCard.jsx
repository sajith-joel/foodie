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
  const [discountedPrice, setDiscountedPrice] = useState(food.price);

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
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image Section - Mobile Optimized */}
        <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={food.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
            loading="lazy"
          />
          
          {/* Favorite Button - Mobile Optimized */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            )}
          </button>

          {/* Veg/Non-Veg Badge - Mobile Optimized */}
          {food.isVegetarian && (
            <span className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
              Veg
            </span>
          )}

          {/* Discount Available Badge - Mobile Optimized */}
          {activeDiscounts.length > 0 && (
            <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-purple-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse flex items-center">
              <span className="mr-1">🎁</span>
              <span className="hidden xs:inline">Discount</span>
            </span>
          )}
        </div>

        {/* Content Section - Mobile Optimized */}
        <div className="p-3 sm:p-4">
          {/* Title and Price - Mobile Optimized */}
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-1 pr-2">
              {food.name}
            </h3>
            <span className="text-sm sm:text-base md:text-lg font-bold text-primary-600 whitespace-nowrap">
              ₹{food.price}
            </span>
          </div>

          {/* Description - Mobile Optimized */}
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
            {food.description || 'No description available'}
          </p>

          {/* Quantity Controls - Mobile Optimized */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                disabled={food.available === 0}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors text-sm sm:text-base font-medium"
                disabled={quantity >= food.available}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500">
              {food.available > 0 ? (
                <span className="flex items-center">
                  <span className="hidden xs:inline">{food.available} left</span>
                  <span className="xs:hidden">{food.available}</span>
                </span>
              ) : (
                'Out of stock'
              )}
            </span>
          </div>

          {/* Add to Cart Button - Mobile Optimized */}
          <Button
            onClick={handleAddToCart}
            disabled={food.available === 0}
            className="w-full text-xs sm:text-sm py-2 sm:py-2.5"
            size="sm"
          >
            {food.available === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>

      {/* Discount Selection Modal - Mobile Optimized */}
      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Apply Discount"
        size="md"
      >
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm text-gray-600">
            You have {activeDiscounts.length} active discount{activeDiscounts.length > 1 ? 's' : ''}! 
            Would you like to apply one to this item?
          </p>

          {/* Discount List - Mobile Optimized */}
          <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
            {activeDiscounts.map((discount) => (
              <button
                key={discount.id}
                onClick={() => handleApplyDiscount(discount)}
                className="w-full p-2 sm:p-3 border rounded-lg hover:bg-purple-50 transition-colors text-left flex items-center justify-between touch-manipulation"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm sm:text-base font-semibold text-purple-600 block truncate">
                    {discount.label}
                  </span>
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Expires: {new Date(discount.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xl sm:text-2xl ml-2 flex-shrink-0">🎁</span>
              </button>
            ))}
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
            <Button
              variant="secondary"
              onClick={handleAddWithoutDiscount}
              className="w-full sm:w-auto text-sm py-2"
            >
              Add Without Discount
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowDiscountModal(false)}
              className="w-full sm:w-auto text-sm py-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FoodCard;