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
  const { activeDiscounts, applyDiscount, refreshDiscounts } = useDiscounts();
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [applying, setApplying] = useState(false);

  const handleAddToCartClick = () => {
    if (activeDiscounts.length > 0) {
      setShowDiscountModal(true);
    } else {
      // No discounts, add normally
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
    setApplying(true);
    setSelectedDiscount(discount);
    
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
        await refreshDiscounts(); // Refresh to remove used discount
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
    } finally {
      setApplying(false);
      setSelectedDiscount(null);
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
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            )}
          </button>

          {food.isVegetarian && (
            <span className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-green-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              Veg
            </span>
          )}

          {/* Discount Available Badge */}
          {activeDiscounts.length > 0 && (
            <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full animate-pulse flex items-center">
              <span className="mr-1">🎁</span>
              <span>{activeDiscounts.length} coupon{activeDiscounts.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 line-clamp-1">
              {food.name}
            </h3>
            <span className="text-sm sm:text-base md:text-lg font-bold text-primary-600">
              ₹{food.price}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
            {food.description || 'No description'}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                disabled={food.available === 0}
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                disabled={quantity >= food.available}
              >
                +
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {food.available > 0 ? `${food.available} left` : 'Out of stock'}
            </span>
          </div>

          <Button
            onClick={handleAddToCartClick}
            disabled={food.available === 0}
            className="w-full"
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
          <p className="text-gray-600">
            You have <span className="font-bold text-purple-600">{activeDiscounts.length}</span> active coupon
            {activeDiscounts.length > 1 ? 's' : ''}! Apply one to this item:
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeDiscounts.map((discount) => {
              const discountedPrice = discount.type === 'percentage' 
                ? food.price - (food.price * discount.value / 100)
                : discount.value === 'free' ? 0 : food.price;

              const savings = food.price - discountedPrice;

              return (
                <div
                  key={discount.id}
                  className="border-2 rounded-lg p-4 hover:border-purple-500 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">🎫</span>
                        <div>
                          <h3 className="font-bold text-lg text-purple-600">{discount.label}</h3>
                          <p className="text-sm text-gray-500">
                            Won on: {new Date(discount.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Original price:</span>
                          <span className="font-semibold">₹{food.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-600">
                          <span>Discounted price:</span>
                          <span className="font-bold text-lg">₹{discountedPrice}</span>
                        </div>
                        <div className="flex justify-between items-center text-purple-600 border-t pt-2 mt-2">
                          <span>You save:</span>
                          <span className="font-bold">₹{savings}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Expires: {new Date(discount.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleApplyDiscount(discount)}
                    disabled={applying && selectedDiscount?.id === discount.id}
                    className="w-full mt-3"
                    size="sm"
                  >
                    {applying && selectedDiscount?.id === discount.id ? 'Applying...' : 'Use This Coupon'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="secondary"
              onClick={handleAddWithoutDiscount}
            >
              Add Without Coupon
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowDiscountModal(false)}
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