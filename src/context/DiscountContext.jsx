import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const DiscountContext = createContext();

export const useDiscounts = () => {
  const context = useContext(DiscountContext);
  if (!context) {
    throw new Error('useDiscounts must be used within a DiscountProvider');
  }
  return context;
};

export const DiscountProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's active discounts from Firebase
  useEffect(() => {
    if (user) {
      loadUserDiscounts();
    } else {
      setActiveDiscounts([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserDiscounts = async () => {
    setLoading(true);
    try {
      const discountsRef = collection(db, 'user_discounts');
      const q = query(
        discountsRef, 
        where('userId', '==', user.uid),
        where('used', '==', false),
        where('expiresAt', '>', new Date().toISOString())
      );
      const snapshot = await getDocs(q);
      
      const discounts = [];
      snapshot.forEach((doc) => {
        discounts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setActiveDiscounts(discounts);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new discount for the user
  const addDiscount = async (discountData) => {
    if (!user) {
      toast.error('Please login to claim rewards');
      return null;
    }

    try {
      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const discount = {
        userId: user.uid,
        userEmail: user.email,
        type: discountData.type, // 'percentage' or 'free' or 'bogo'
        value: discountData.value, // 10, 15, 20, etc. or 'free', 'bogo'
        label: discountData.label,
        used: false,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        source: discountData.source // 'spinwheel' or 'memorygame'
      };

      const docRef = await addDoc(collection(db, 'user_discounts'), discount);
      console.log('Discount added:', docRef.id);
      
      // Refresh discounts
      await loadUserDiscounts();
      
      return {
        id: docRef.id,
        ...discount
      };
    } catch (error) {
      console.error('Error adding discount:', error);
      toast.error('Failed to save discount');
      return null;
    }
  };

  // Apply discount to an item
  const applyDiscount = async (discountId, itemId, itemPrice) => {
    try {
      const discount = activeDiscounts.find(d => d.id === discountId);
      if (!discount) {
        toast.error('Discount not found');
        return null;
      }

      if (discount.used) {
        toast.error('This discount has already been used');
        return null;
      }

      let discountedPrice = itemPrice;

      if (discount.type === 'percentage') {
        const percent = discount.value;
        discountedPrice = itemPrice - (itemPrice * percent / 100);
      } else if (discount.type === 'free') {
        discountedPrice = 0;
      } else if (discount.type === 'bogo') {
        // For BOGO, we'll handle it separately in the cart
        discountedPrice = itemPrice; // Will add another item free
      }

      // Mark discount as used
      const discountRef = doc(db, 'user_discounts', discountId);
      await updateDoc(discountRef, {
        used: true,
        usedAt: new Date().toISOString(),
        appliedToItem: itemId
      });

      // Refresh discounts
      await loadUserDiscounts();

      return discountedPrice;
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Failed to apply discount');
      return null;
    }
  };

  const value = {
    activeDiscounts,
    loading,
    addDiscount,
    applyDiscount,
    refreshDiscounts: loadUserDiscounts
  };

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  );
};