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

// Collections to clear (add or remove as needed)
const COLLECTIONS_TO_CLEAR = [
  'orders',
  'notifications',
  'user_discounts',
  'deliveries',
  'wheel_spins',
  'delivery_partners' // Clear test delivery partners
];

// Collections to KEEP but clean
const COLLECTIONS_TO_KEEP = [
  'users',      // Keep user accounts
  'menu',       // Keep menu items (you can decide)
  'wheel_prizes' // Keep prize settings if customized
];

async function clearCollection(collectionName) {
  console.log(`🧹 Clearing collection: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  
  let count = 0;
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Cleared ${count} documents from ${collectionName}`);
  } else {
    console.log(`ℹ️ No documents found in ${collectionName}`);
  }
  
  return count;
}

async function clearDemoData() {
  console.log('🚀 Starting data cleanup...\n');
  
  let totalCleared = 0;
  
  // Clear specified collections
  for (const collection of COLLECTIONS_TO_CLEAR) {
    try {
      const count = await clearCollection(collection);
      totalCleared += count;
    } catch (error) {
      console.error(`❌ Error clearing ${collection}:`, error.message);
    }
  }
  
  // Optional: Clear only non-admin users from users collection
  console.log('\n👥 Checking users collection...');
  try {
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    let removedUsers = 0;
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      // Remove test/demo users (not admin)
      if (userData.role !== 'admin' && 
          (userData.email?.includes('test') || 
           userData.email?.includes('demo') ||
           userData.email === 'student@example.com' ||
           userData.email === 'delivery@example.com')) {
        batch.delete(doc.ref);
        removedUsers++;
        console.log(`  Removing test user: ${userData.email}`);
      }
    });
    
    if (removedUsers > 0) {
      await batch.commit();
      console.log(`✅ Removed ${removedUsers} test users`);
    } else {
      console.log('ℹ️ No test users found to remove');
    }
  } catch (error) {
    console.error('❌ Error cleaning users:', error.message);
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Total documents cleared: ${totalCleared}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n✨ Data cleanup completed!');
  console.log('\n📝 Collections kept:');
  COLLECTIONS_TO_KEEP.forEach(col => console.log(`  - ${col}`));
  
  process.exit(0);
}

// Run the cleanup
clearDemoData().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});