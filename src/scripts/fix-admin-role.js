import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function fixAdminRole() {
  try {
    const adminEmail = 'admin@example.com';
    
    // Get user by email
    const user = await auth.getUserByEmail(adminEmail);
    console.log(`Found user: ${user.email} (${user.uid})`);
    
    // Set custom claims
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log('✅ Custom claims set: { role: "admin" }');
    
    // Update Firestore
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      role: 'admin',
      name: 'Admin User',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log('✅ Firestore document updated');
    
    // Verify
    const updatedUser = await auth.getUser(user.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
    console.log('\n⚠️  User must log out and log back in for changes to take effect!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixAdminRole();