import { MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const hasDiscount = item.discountApplied !== null;

  return (
    <div className="flex items-center space-x-4 py-4 border-b last:border-0">
      <img
        src={item.image || 'https://via.placeholder.com/80x80'}
        alt={item.name}
        className="w-20 h-20 object-cover rounded-lg"
      />

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          {hasDiscount && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center">
              <span className="mr-1">🎁</span>
              {item.discountApplied.label}
            </span>
          )}
        </div>
        
        <div className="flex items-center mt-1">
          {hasDiscount ? (
            <>
              <span className="text-sm text-gray-400 line-through mr-2">₹{item.originalPrice}</span>
              <span className="text-sm font-bold text-green-600">₹{item.price}</span>
              <span className="text-xs text-green-600 ml-2">
                (Save ₹{item.originalPrice - item.price})
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-600">₹{item.price} each</span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="font-semibold text-primary-600">
              ₹{item.price * item.quantity}
            </span>
            <button
              onClick={() => onRemove(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {hasDiscount && (
          <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
            ✓ Discount applied: {item.discountApplied.label} - You saved ₹{item.originalPrice - item.price} on this item!
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItem;