// Mock data for testing
const mockUsers = [
  {
    uid: 'student1',
    email: 'student@example.com',
    name: 'Test Student',
    role: 'student',
    studentId: 'STU001',
    phone: '+91 98765 43210'
  },
  {
    uid: 'admin1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    phone: '+91 98765 43211'
  },
  {
    uid: 'delivery1',
    email: 'delivery@example.com',
    name: 'Delivery Partner',
    role: 'delivery',
    phone: '+91 98765 43212',
    vehicleNumber: 'DL-01-AB-1234'
  }
];

export const createUserProfile = async (userId, userData) => {
  console.log('Mock: Creating user profile', userId, userData);
  return { success: true, userId };
};

export const getUserProfile = async (userId) => {
  console.log('Mock: Getting user profile', userId);
  const mockUser = mockUsers.find(u => u.uid === userId);
  return mockUser || {
    uid: userId,
    role: 'student',
    name: 'New User',
    email: 'user@example.com'
  };
};

export const updateUserProfile = async (userId, updates) => {
  console.log('Mock: Updating user profile', userId, updates);
  return { success: true };
};