import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { UserIcon, PhoneIcon, EnvelopeIcon, IdentificationIcon, TruckIcon } from '@heroicons/react/24/outline';
import { updateUserProfile } from '../../services/authService';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const { role } = useRole();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    vehicleNumber: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.displayName || '',
        email: user.email || '',
        phone: user.phone || user.phoneNumber || '',
        studentId: user.studentId || '',
        vehicleNumber: user.vehicleNumber || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile(user.uid, {
        name: formData.name,
        phone: formData.phone,
        studentId: formData.studentId,
        vehicleNumber: formData.vehicleNumber
      });
      
      // Update local user state
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        studentId: formData.studentId,
        vehicleNumber: formData.vehicleNumber
      });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4 pb-4 border-b">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{formData.name || 'User'}</h2>
              <p className="text-sm text-gray-500 capitalize">{role}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Personal Information</h3>
            
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={UserIcon}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              icon={EnvelopeIcon}
              disabled
              className="bg-gray-50"
            />

            <Input
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={PhoneIcon}
              placeholder="Enter your phone number"
              required
            />
          </div>

          {/* Role-specific fields */}
          {role === 'student' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Student Information</h3>
              <Input
                label="Student ID"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                icon={IdentificationIcon}
                placeholder="Enter your student ID"
              />
            </div>
          )}

          {role === 'delivery' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Delivery Partner Information</h3>
              <Input
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                icon={TruckIcon}
                placeholder="Enter your vehicle number"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default UserProfile;