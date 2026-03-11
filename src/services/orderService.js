import { db } from './firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';

const ordersCollection = collection(db, 'orders');

// ✅ Create new order
export const createOrder = async (orderData) => {
  try {
    console.log('🔵 Creating order:', orderData);
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Order created with ID:', docRef.id);
    return { id: docRef.id, ...orderData, success: true };
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw new Error('Error creating order: ' + error.message);
  }
};

// ✅ Get user orders
export const fetchUserOrders = async (userId) => {
  console.log('🔵 fetchUserOrders called with userId:', userId);

  try {
    if (!userId) {
      console.error('❌ No userId provided');
      return [];
    }

    const q = query(
      ordersCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Fetched ${orders.length} orders for user ${userId}`);
    return orders;
  } catch (error) {
    console.error('❌ Error in fetchUserOrders:', error);
    throw new Error('Error fetching orders: ' + error.message);
  }
};

// ✅ Get order by ID - THIS IS THE MISSING EXPORT
export const getOrderById = async (orderId) => {
  console.log('🔵 getOrderById called with orderId:', orderId);

  try {
    if (!orderId) {
      console.error('❌ No orderId provided');
      return null;
    }

    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('✅ Order found:', docSnap.id);
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log('❌ No order found with ID:', orderId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error in getOrderById:', error);
    throw new Error('Error fetching order: ' + error.message);
  }
};

// ✅ Update order status
export const updateOrderStatus = async (orderId, status) => {
  console.log('🔵 updateOrderStatus called:', orderId, status);

  try {
    if (!orderId) {
      throw new Error('No orderId provided');
    }

    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Order status updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error in updateOrderStatus:', error);
    throw new Error('Error updating order: ' + error.message);
  }
};

// ✅ Get all orders (for admin)
export const getAllOrders = async () => {
  console.log('🔵 getAllOrders called');

  try {
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✅ Fetched ${orders.length} total orders`);
    return orders;
  } catch (error) {
    console.error('❌ Error in getAllOrders:', error);
    return [];
  }
};

// ✅ Get orders by date range
export const fetchOrdersByDateRange = async (startDate, endDate) => {
  console.log('🔵 fetchOrdersByDateRange called:', startDate, endDate);

  try {
    const q = query(
      ordersCollection,
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Error in fetchOrdersByDateRange:', error);
    throw new Error('Error fetching orders: ' + error.message);
  }
};

// ✅ Delete order (admin only)
export const deleteOrder = async (orderId) => {
  console.log('🔵 deleteOrder called:', orderId);

  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
    console.log('✅ Order deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error in deleteOrder:', error);
    throw new Error('Error deleting order: ' + error.message);
  }
};