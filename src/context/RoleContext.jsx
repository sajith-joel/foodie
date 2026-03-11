import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';

export const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      
      if (!user) {
        console.log('No user, setting role to student');
        setRole('student');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.email);
        
        // METHOD 1: Check user object from AuthContext
        if (user.role) {
          console.log('✅ Role found in user object:', user.role);
          setRole(user.role);
          setLoading(false);
          return;
        }
        
        // METHOD 2: Check custom claims from Firebase token
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const idTokenResult = await currentUser.getIdTokenResult(true);
            console.log('Custom claims:', idTokenResult.claims);
            
            const claimsRole = idTokenResult.claims.role;
            if (claimsRole) {
              console.log('✅ Role found in custom claims:', claimsRole);
              setRole(claimsRole);
              setLoading(false);
              return;
            }
          }
        } catch (tokenError) {
          console.log('Could not get token claims:', tokenError);
        }
        
        // METHOD 3: Check by email patterns
        if (user.email === 'admin@example.com') {
          console.log('✅ Admin detected by email');
          setRole('admin');
          setLoading(false);
          return;
        }
        
        // Check for delivery email patterns
        const deliveryEmails = ['rahul@example.com', 'amit@example.com', 'priya@example.com'];
        if (deliveryEmails.includes(user.email)) {
          console.log('✅ Delivery detected by email');
          setRole('delivery');
          setLoading(false);
          return;
        }
        
        if (user.email && user.email.includes('delivery')) {
          console.log('✅ Delivery detected by email pattern');
          setRole('delivery');
          setLoading(false);
          return;
        }
        
        // METHOD 4: Check Firestore for role (if none of the above work)
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role) {
              console.log('✅ Role found in Firestore:', userData.role);
              setRole(userData.role);
              setLoading(false);
              return;
            }
          }
        } catch (firestoreError) {
          console.log('Could not fetch from Firestore:', firestoreError);
        }
        
        // Default to student
        console.log('⚠️ No role found, defaulting to student');
        setRole('student');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('student');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    console.log('🔄 Role updated to:', role);
  }, [role]);

  const value = {
    role,
    loading,
    isAdmin: role === 'admin',
    isDelivery: role === 'delivery',
    isStudent: role === 'student',
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};