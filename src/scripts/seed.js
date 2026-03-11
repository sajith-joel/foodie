import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Admin SDK
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Configuration
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

const DELIVERY_BOYS = [
  {
    email: 'rahul@example.com',
    password: 'delivery123',
    name: 'Rahul Kumar',
    phone: '+91 98765 43210',
    vehicleNumber: 'DL-01-AB-1234',
  },
  {
    email: 'amit@example.com',
    password: 'delivery123',
    name: 'Amit Singh',
    phone: '+91 98765 43211',
    vehicleNumber: 'DL-02-CD-5678',
  },
  {
    email: 'priya@example.com',
    password: 'delivery123',
    name: 'Priya Sharma',
    phone: '+91 98765 43212',
    vehicleNumber: 'DL-03-EF-9012',
  },
];

const SAMPLE_MENU_ITEMS = [
  {
    name: 'Masala Dosa',
    description: 'Crispy dosa filled with spiced potato filling, served with sambar and chutney',
    price: 80,
    category: 'breakfast',
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921',
    isVegetarian: true,
    available: 15,
    preparationTime: 15,
    rating: 4.5,
  },
  {
    name: 'Chicken Biryani',
    description: 'Hyderabadi dum biryani with tender chicken, aromatic rice and spices',
    price: 180,
    category: 'lunch',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0',
    isVegetarian: false,
    available: 10,
    preparationTime: 25,
    rating: 4.8,
  },
  {
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy paneer curry with butter and cream',
    price: 150,
    category: 'dinner',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7',
    isVegetarian: true,
    available: 12,
    preparationTime: 20,
    rating: 4.6,
  },
  {
    name: 'Samosa',
    description: 'Crispy pastry filled with spiced potatoes and peas',
    price: 20,
    category: 'snacks',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
    isVegetarian: true,
    available: 30,
    preparationTime: 10,
    rating: 4.3,
  },
  {
    name: 'Cold Coffee',
    description: 'Refreshing chilled coffee with vanilla ice cream',
    price: 60,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c',
    isVegetarian: true,
    available: 25,
    preparationTime: 5,
    rating: 4.4,
  },
  {
    name: 'Veg Thali',
    description: 'Complete meal with rice, roti, dal, sabzi, raita, and dessert',
    price: 120,
    category: 'lunch',
    image: 'https://images.unsplash.com/photo-1626778876654-3a32d7d7f3c9',
    isVegetarian: true,
    available: 8,
    preparationTime: 20,
    rating: 4.7,
  },
  {
    name: 'Chocolate Brownie',
    description: 'Warm chocolate brownie with vanilla ice cream',
    price: 80,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e',
    isVegetarian: true,
    available: 20,
    preparationTime: 10,
    rating: 4.9,
  },
  {
    name: 'Veg Burger',
    description: 'Grilled veg patty with lettuce, tomato, and cheese',
    price: 70,
    category: 'snacks',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add',
    isVegetarian: true,
    available: 15,
    preparationTime: 12,
    rating: 4.2,
  },
];

async function createUser(email, password, userData) {
  try {
    // Check if user already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`⚠️ User ${email} already exists, updating...`);
      
      // Update existing user
      await auth.updateUser(existingUser.uid, {
        password: password,
        displayName: userData.name,
      });
      
      // Update Firestore document (use regular date object, not serverTimestamp)
      await db.collection('users').doc(existingUser.uid).set({
        ...userData,
        uid: existingUser.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      // Set custom claims
      await auth.setCustomUserClaims(existingUser.uid, { role: userData.role });
      
      console.log(`✅ Updated user: ${email}`);
      return existingUser.uid;
    } catch (error) {
      // User doesn't exist, create new
      if (error.code === 'auth/user-not-found') {
        const user = await auth.createUser({
          email,
          password,
          displayName: userData.name,
        });
        
        // Save to Firestore with ISO string date (not serverTimestamp)
        await db.collection('users').doc(user.uid).set({
          ...userData,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        // Set custom claims
        await auth.setCustomUserClaims(user.uid, { role: userData.role });
        
        console.log(`✅ Created user: ${email}`);
        return user.uid;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error creating user ${email}:`, error.message);
    return null;
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const adminId = await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: 'admin',
      phone: '+91 98765 43209',
    });

    if (adminId) {
      console.log('✅ Admin user created with custom claims\n');
    }

    // 2. Create Delivery Boys
    console.log('👥 Creating delivery partners...');
    for (const boy of DELIVERY_BOYS) {
      await createUser(boy.email, boy.password, {
        ...boy,
        role: 'delivery',
        status: 'active',
        totalDeliveries: 0,
        rating: 5.0,
        currentOrders: 0,
      });
    }
    console.log('');

    // 3. Create Menu Items
    console.log('🍽️ Creating menu items...');
    const menuCollection = db.collection('menu');
    
    // Clear existing menu items
    const existingMenu = await menuCollection.get();
    const batch = db.batch();
    existingMenu.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('Cleared existing menu items');

    // Add new menu items
    for (const item of SAMPLE_MENU_ITEMS) {
      await menuCollection.add({
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Added ${SAMPLE_MENU_ITEMS.length} menu items\n`);

    // 4. Create Sample Orders
    console.log('📦 Creating sample orders...');
    const ordersCollection = db.collection('orders');
    
    // Clear existing orders
    const existingOrders = await ordersCollection.get();
    const orderBatch = db.batch();
    existingOrders.docs.forEach(doc => {
      orderBatch.delete(doc.ref);
    });
    await orderBatch.commit();
    
    const sampleOrders = [
      {
        userId: adminId || 'admin-placeholder',
        items: [
          { name: 'Masala Dosa', quantity: 2, price: 80 },
          { name: 'Samosa', quantity: 3, price: 20 }
        ],
        total: 220,
        status: 'delivered',
        paymentMethod: 'Online',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: adminId || 'admin-placeholder',
        items: [
          { name: 'Chicken Biryani', quantity: 1, price: 180 },
          { name: 'Cold Coffee', quantity: 1, price: 60 }
        ],
        total: 240,
        status: 'delivered',
        paymentMethod: 'Cash',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        userId: adminId || 'admin-placeholder',
        items: [
          { name: 'Paneer Butter Masala', quantity: 1, price: 150 },
          { name: 'Veg Thali', quantity: 1, price: 120 }
        ],
        total: 270,
        status: 'pending',
        paymentMethod: 'Online',
        createdAt: new Date().toISOString(),
      },
    ];

    for (const order of sampleOrders) {
      await ordersCollection.add(order);
    }
    console.log(`✅ Added ${sampleOrders.length} sample orders\n`);

    // 5. Summary
    console.log('📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Admin User: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
    console.log(`✅ Delivery Partners: ${DELIVERY_BOYS.length} created`);
    console.log(`✅ Menu Items: ${SAMPLE_MENU_ITEMS.length} created`);
    console.log(`✅ Sample Orders: ${sampleOrders.length} created`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Database seeding completed successfully!\n');

    console.log('🔑 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log('\nDelivery Partners:');
    DELIVERY_BOYS.forEach(boy => {
      console.log(`  ${boy.name}: ${boy.email} / ${boy.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedDatabase();