import { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ 
              ...firebaseUser, 
              ...userDoc.data(),
              role: userDoc.data().role || 'student'
            });
          } else {
            // If no user document exists, create one with basic info
            const basicUserData = {
              email: firebaseUser.email,
              name: firebaseUser.email?.split('@')[0] || 'User',
              role: 'student',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData);
            setUser({ ...firebaseUser, ...basicUserData });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser({ 
            ...firebaseUser, 
            role: 'student',
            name: firebaseUser.email?.split('@')[0] || 'User'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      let userData = {};
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // Create user document if it doesn't exist
        userData = {
          email: result.user.email,
          name: result.user.email?.split('@')[0] || 'User',
          role: 'student',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', result.user.uid), userData);
      }
      
      const userWithRole = { 
        ...result.user, 
        ...userData
      };
      
      setUser(userWithRole);
      return userWithRole;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      // Check if user already exists in Firebase Auth
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user data to Firestore
        const userDocData = {
          uid: result.user.uid,
          email,
          name: userData.name || email.split('@')[0],
          phone: userData.phone || '',
          role: userData.role || 'student',
          status: 'active',
          isActive: true,
          ...(userData.role === 'delivery' && {
            vehicleNumber: userData.vehicleNumber || '',
            currentOrders: 0,
            totalDeliveries: 0,
            rating: 5.0
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', result.user.uid), userDocData);
        
        console.log('User registered successfully:', result.user.uid);
        
        return { 
          success: true, 
          user: result.user,
          data: userDocData
        };
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('Email already exists, attempting to add role to existing user...');
          
          // Try to find the user by email
          // Note: This requires Firebase Admin SDK or a cloud function
          // For now, return a user-friendly error
          throw new Error('This email is already registered. Please use a different email or login instead.');
        }
        throw authError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};