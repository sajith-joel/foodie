import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read service account
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const USER_EMAIL = 'admin@example.com'; // Change this

async function setAdminRole() {
  try {
    const user = await admin.auth().getUserByEmail(USER_EMAIL);
    console.log(`✅ Found user: ${user.email}`);

    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    console.log('✅ Admin role set in custom claims');

    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      role: 'admin',
      name: 'Admin User',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ Firestore document updated');
    console.log('\n⚠️  User must log out and log back in');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setAdminRole();