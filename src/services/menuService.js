import { db } from './firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const menuCollection = collection(db, 'menu');

// Get all menu items
export const getAllMenuItems = async () => {
  try {
    console.log('🔵 Fetching all menu items...');
    const q = query(menuCollection, orderBy('category'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Fetched ${items.length} menu items`);
    return items;
  } catch (error) {
    console.error('❌ Error fetching menu items:', error);
    throw new Error('Error fetching menu items: ' + error.message);
  }
};

// Add new menu item
export const addMenuItem = async (itemData) => {
  try {
    console.log('🔵 Adding menu item:', itemData);
    
    const newItem = {
      ...itemData,
      price: Number(itemData.price),
      available: Number(itemData.available) || 0,
      isVegetarian: itemData.isVegetarian || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(menuCollection, newItem);
    console.log('✅ Menu item added with ID:', docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      ...newItem
    };
  } catch (error) {
    console.error('❌ Error adding menu item:', error);
    throw new Error('Error adding menu item: ' + error.message);
  }
};

// Update menu item
export const updateMenuItem = async (itemId, itemData) => {
  try {
    console.log('🔵 Updating menu item:', itemId, itemData);
    
    const itemRef = doc(db, 'menu', itemId);
    const updateData = {
      ...itemData,
      price: Number(itemData.price),
      available: Number(itemData.available) || 0,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(itemRef, updateData);
    console.log('✅ Menu item updated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating menu item:', error);
    throw new Error('Error updating menu item: ' + error.message);
  }
};

// Delete menu item
export const deleteMenuItem = async (itemId) => {
  try {
    console.log('🔵 Deleting menu item:', itemId);
    
    const itemRef = doc(db, 'menu', itemId);
    await deleteDoc(itemRef);
    console.log('✅ Menu item deleted successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    throw new Error('Error deleting menu item: ' + error.message);
  }
};

// Get menu item by ID
export const getMenuItemById = async (itemId) => {
  try {
    const itemRef = doc(db, 'menu', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (itemSnap.exists()) {
      return {
        id: itemSnap.id,
        ...itemSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching menu item:', error);
    throw new Error('Error fetching menu item: ' + error.message);
  }
};