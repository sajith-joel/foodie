import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  deleteDoc
} from 'firebase/firestore';

// ✅ Get all delivery partners (both active and inactive)
export const getDeliveryPartners = async (showAll = true) => {
  try {
    console.log('🔵 Fetching delivery partners...');
    const partners = [];
    
    // Method 1: Check delivery_partners collection
    try {
      const partnersRef = collection(db, 'delivery_partners');
      const partnersSnapshot = await getDocs(partnersRef);
      
      partnersSnapshot.forEach((doc) => {
        const data = doc.data();
        partners.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          vehicleNumber: data.vehicleNumber || '',
          status: data.status || 'active',
          currentOrders: data.currentOrders || 0,
          totalDeliveries: data.totalDeliveries || 0,
          rating: data.rating || 5.0,
          isActive: data.isActive !== false,
          source: 'delivery_partners'
        });
      });
      
      console.log(`✅ Found ${partnersSnapshot.size} partners in delivery_partners`);
    } catch (e) {
      console.log('Error fetching from delivery_partners:', e);
    }
    
    // Method 2: Check users collection for delivery role
    try {
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('role', '==', 'delivery'));
      const usersSnapshot = await getDocs(usersQuery);
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if not already added (by email)
        const existing = partners.find(p => p.email === data.email);
        if (!existing) {
          partners.push({
            id: doc.id,
            name: data.name || data.displayName || '',
            email: data.email || '',
            phone: data.phone || '',
            vehicleNumber: data.vehicleNumber || '',
            status: data.status || 'active',
            currentOrders: data.currentOrders || 0,
            totalDeliveries: data.totalDeliveries || 0,
            rating: data.rating || 5.0,
            isActive: data.isActive !== false,
            source: 'users'
          });
        }
      });
      
      console.log(`✅ Found ${usersSnapshot.size} delivery partners in users`);
    } catch (e) {
      console.log('Error fetching from users:', e);
    }
    
    // Only filter if showAll is false
    if (!showAll) {
      const activePartners = partners.filter(p => p.status === 'active' && p.isActive !== false);
      console.log(`✅ Filtered to ${activePartners.length} active partners`);
      return activePartners;
    }
    
    console.log(`✅ Total partners (including inactive): ${partners.length}`);
    return partners;
    
  } catch (error) {
    console.error('❌ Error in getDeliveryPartners:', error);
    return [];
  }
};

// ✅ Add new delivery partner
export const addDeliveryPartner = async (partnerData) => {
  try {
    console.log('🔵 Adding delivery partner:', partnerData);

    const newPartner = {
      ...partnerData,
      currentOrders: 0,
      totalDeliveries: 0,
      rating: 5.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'delivery_partners'), newPartner);
    console.log('✅ Partner added with ID:', docRef.id);

    return {
      success: true,
      id: docRef.id,
      ...newPartner
    };
  } catch (error) {
    console.error('❌ Error adding delivery partner:', error);
    throw new Error('Error adding delivery partner: ' + error.message);
  }
};

// ✅ Update delivery partner
export const updateDeliveryPartner = async (partnerId, updates) => {
  try {
    console.log('🔵 Updating partner:', partnerId, updates);

    const partnerRef = doc(db, 'delivery_partners', partnerId);
    await updateDoc(partnerRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Partner updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating delivery partner:', error);
    throw new Error('Error updating delivery partner: ' + error.message);
  }
};

// ✅ Delete/deactivate delivery partner
export const deleteDeliveryPartner = async (partnerId) => {
  console.log('🔵 Attempting to delete/deactivate partner:', partnerId);

  try {
    if (!partnerId) {
      throw new Error('Partner ID is required');
    }

    // Check if it's a mock ID (for development)
    if (partnerId.startsWith('mock')) {
      console.log('✅ Mock partner deleted (simulated)');
      return { success: true, message: 'Mock partner deleted' };
    }

    let deleted = false;
    let errorMessages = [];

    // Method 1: Try to update in delivery_partners collection
    try {
      const partnerRef = doc(db, 'delivery_partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);

      if (partnerDoc.exists()) {
        await updateDoc(partnerRef, {
          isActive: false,
          status: 'inactive',
          deletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Partner deactivated in delivery_partners');
        deleted = true;
        return { success: true, message: 'Partner deactivated successfully' };
      }
    } catch (e) {
      console.log('Error with delivery_partners collection:', e.message);
      errorMessages.push(`delivery_partners: ${e.message}`);
    }

    // Method 2: If not found in delivery_partners, try users collection
    if (!deleted) {
      try {
        const userRef = doc(db, 'users', partnerId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Check if this user has delivery role
          const userData = userDoc.data();
          if (userData.role === 'delivery') {
            await updateDoc(userRef, {
              isActive: false,
              status: 'inactive',
              deletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Partner deactivated in users collection');
            return { success: true, message: 'Partner deactivated successfully' };
          } else {
            errorMessages.push('User exists but is not a delivery partner');
          }
        }
      } catch (e) {
        console.log('Error with users collection:', e.message);
        errorMessages.push(`users: ${e.message}`);
      }
    }

    // If we get here, partner wasn't found in either collection
    throw new Error(`Delivery partner not found in any collection. Errors: ${errorMessages.join(', ')}`);

  } catch (error) {
    console.error('❌ Error in deleteDeliveryPartner:', error);
    throw new Error(`Failed to delete delivery partner: ${error.message}`);
  }
};

// ✅ Assign order to delivery partner
export const assignOrderToPartner = async (orderId, partnerId, orderDetails) => {
  try {
    console.log('🔵 Assigning order:', orderId, 'to partner:', partnerId);
    console.log('Order details:', orderDetails);

    // Validate required fields
    if (!orderId || !partnerId) {
      throw new Error('Missing orderId or partnerId');
    }

    // Ensure all fields have values (prevent undefined)
    const safeOrderDetails = {
      customerName: orderDetails.customerName || 'Customer',
      customerPhone: orderDetails.customerPhone || '',
      customerAddress: orderDetails.customerAddress || 'Address not provided',
      total: orderDetails.total || 0,
      items: Array.isArray(orderDetails.items) ? orderDetails.items : [],
      deliveryBoyName: orderDetails.deliveryBoyName || 'Delivery Partner'
    };

    // Update order with delivery partner
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      deliveryPartnerId: partnerId,
      deliveryBoy: {
        id: partnerId,
        name: safeOrderDetails.deliveryBoyName
      },
      status: 'assigned', // Make sure status is set to 'assigned'
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✅ Order updated with delivery partner');

    // Update partner's current orders count
    try {
      const partnerRef = doc(db, 'delivery_partners', partnerId);
      const partnerDoc = await getDoc(partnerRef);
      if (partnerDoc.exists()) {
        const currentOrders = partnerDoc.data().currentOrders || 0;
        await updateDoc(partnerRef, {
          currentOrders: currentOrders + 1,
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Partner orders count updated');
      }
    } catch (partnerError) {
      console.error('Error updating partner orders count:', partnerError);
    }

    // Create delivery record
    try {
      await addDoc(collection(db, 'deliveries'), {
        orderId,
        partnerId,
        partnerName: safeOrderDetails.deliveryBoyName,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
        orderDetails: safeOrderDetails
      });
      console.log('✅ Delivery record created');
    } catch (deliveryError) {
      console.error('Error creating delivery record:', deliveryError);
    }

    console.log('✅ Order assigned successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Error assigning order:', error);
    throw error;
  }
};

// ✅ Get assigned orders for a delivery partner - EXCLUDE DELIVERED
export const getPartnerAssignedOrders = async (partnerId) => {
  try {
    console.log('🔵 Fetching assigned orders for partner:', partnerId);

    // Get all orders for this partner
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('deliveryPartnerId', '==', partnerId)
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include orders that are NOT delivered
      // This ensures delivered orders are filtered out
      orders.push({
        id: doc.id,
        ...data
      });
    });

    // Sort by assignedAt (newest first)
    orders.sort((a, b) => {
      const dateA = a.assignedAt ? new Date(a.assignedAt) : new Date(0);
      const dateB = b.assignedAt ? new Date(b.assignedAt) : new Date(0);
      return dateB - dateA;
    });

    console.log(`✅ Found ${orders.length} total orders for partner`);
    return orders;

  } catch (error) {
    console.error('❌ Error fetching assigned orders:', error);
    return [];
  }
};

// Update delivery status
export const updateDeliveryStatus = async (orderId, status) => {
  try {
    console.log('🔵 Updating delivery status:', orderId, status);

    const orderRef = doc(db, 'orders', orderId);
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'delivered') {
      updates.deliveredAt = new Date().toISOString(); // Set delivered timestamp

      // Get order to update partner's current orders
      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const partnerId = orderDoc.data().deliveryPartnerId;
        if (partnerId) {
          const partnerRef = doc(db, 'delivery_partners', partnerId);
          const partnerDoc = await getDoc(partnerRef);
          if (partnerDoc.exists()) {
            const currentOrders = partnerDoc.data().currentOrders || 0;
            const totalDeliveries = partnerDoc.data().totalDeliveries || 0;
            await updateDoc(partnerRef, {
              currentOrders: Math.max(0, currentOrders - 1),
              totalDeliveries: totalDeliveries + 1,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    await updateDoc(orderRef, updates);

    // Update delivery record
    const deliveriesQuery = query(
      collection(db, 'deliveries'),
      where('orderId', '==', orderId)
    );
    const deliveriesSnapshot = await getDocs(deliveriesQuery);
    deliveriesSnapshot.forEach(async (deliveryDoc) => {
      await updateDoc(deliveryDoc.ref, {
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'delivered' && { deliveredAt: new Date().toISOString() })
      });
    });

    console.log('✅ Delivery status updated');
    return { success: true };

  } catch (error) {
    console.error('❌ Error updating delivery status:', error);
    throw error;
  }
};

// ✅ Get delivery information for an order
export const getOrderDelivery = async (orderId) => {
  try {
    console.log('🔵 Fetching delivery info for order:', orderId);

    const q = query(
      collection(db, 'deliveries'),
      where('orderId', '==', orderId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;

  } catch (error) {
    console.error('❌ Error fetching delivery:', error);
    return null;
  }
};