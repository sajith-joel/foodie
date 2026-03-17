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
            type: discount.type,
            value: discount.value
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
        <div className="relative h-36 sm:h-48 overflow-hidden">
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

          {/* Food Type Tag - Shows both Veg and Non-Veg */}
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2">
            {food.isVegetarian ? (
              <span className="bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1"></span>
                Veg
              </span>
            ) : (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1"></span>
                Non-Veg
              </span>
            )}
          </div>

          {/* Discount Available Badge */}
          {activeDiscounts.length > 0 && (
            <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-purple-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse flex items-center">
              <span className="mr-1">🎁</span>
              <span className="hidden xs:inline">Discount</span>
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-1 pr-2">
              {food.name}
            </h3>
            <span className="text-sm sm:text-base md:text-lg font-bold text-primary-600 whitespace-nowrap">
              ₹{food.price}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
            {food.description || 'No description available'}
          </p>

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

      {/* Discount Selection Modal */}
      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="🎫 Apply Your Coupon"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You have {activeDiscounts.length} active coupon{activeDiscounts.length > 1 ? 's' : ''}! 
            Apply one to this item to get a discount.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activeDiscounts.map((discount) => {
              const discountedPrice = discount.type === 'percentage' 
                ? food.price - (food.price * discount.value / 100)
                : discount.value === 'free' ? 0 : food.price;

              return (
                <button
                  key={discount.id}
                  onClick={() => handleApplyDiscount(discount)}
                  className="w-full p-4 border-2 rounded-lg hover:border-purple-500 transition-colors text-left flex items-center justify-between bg-white hover:bg-purple-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">🎫</span>
                      <div>
                        <span className="font-bold text-purple-600 text-lg">{discount.label}</span>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-sm text-gray-500 line-through">₹{food.price}</span>
                          <span className="text-sm font-bold text-green-600">→ ₹{discountedPrice}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Expires: {new Date(discount.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>💡 Tip:</strong> The discount will be applied to this item only. 
              You can see the reduced price in your cart.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleAddWithoutDiscount}
              className="w-full sm:w-auto"
            >
              Add Without Discount
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowDiscountModal(false)}
              className="w-full sm:w-auto"
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