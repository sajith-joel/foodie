import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student',
    studentId: '',
    vehicleNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'student' && { studentId: formData.studentId }),
        ...(formData.role === 'delivery' && { vehicleNumber: formData.vehicleNumber })
      };
      
      const result = await register(formData.email, formData.password, userData);
      
      if (result.success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('email-already-in-use') || error.message.includes('already registered')) {
        toast.error('This email is already registered. Please use a different email or login instead.');
      } else if (error.message.includes('weak-password')) {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (error.message.includes('invalid-email')) {
        toast.error('Please enter a valid email address.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-600 py-8 sm:py-12 md:py-16 px-4">
      <GlassCard className="w-full max-w-2xl mx-auto p-6 md:p-8" opacity={30} blur="lg">
        <div className="text-center mb-6 md:mb-8">
          <img src={logo} alt="Campus Food" className="h-14 md:h-16 mx-auto mb-3 md:mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">Create Account</h2>
          <p className="text-sm md:text-base text-gray-200 mt-1 md:mt-2">Join CHILL X PlayZ today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {/* Form Fields - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={UserIcon}
              placeholder="Enter your full name"
              required
              className="bg-white bg-opacity-90"
              labelClassName="text-gray-200 text-sm"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              icon={EnvelopeIcon}
              placeholder="Enter your email"
              required
              className="bg-white bg-opacity-90"
              labelClassName="text-gray-200 text-sm"
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={PhoneIcon}
              placeholder="Enter your phone number"
              required
              className="bg-white bg-opacity-90"
              labelClassName="text-gray-200 text-sm"
            />

            {formData.role === 'student' && (
              <Input
                label="Student ID"
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter your student ID"
                className="bg-white bg-opacity-90"
                labelClassName="text-gray-200 text-sm"
              />
            )}

            {formData.role === 'delivery' && (
              <Input
                label="Vehicle Number"
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="e.g., DL-01-AB-1234"
                required
                className="bg-white bg-opacity-90"
                labelClassName="text-gray-200 text-sm"
              />
            )}

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              icon={LockClosedIcon}
              placeholder="Create password (min. 6 characters)"
              required
              className="bg-white bg-opacity-90"
              labelClassName="text-gray-200 text-sm"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={LockClosedIcon}
              placeholder="Confirm password"
              required
              className="bg-white bg-opacity-90"
              labelClassName="text-gray-200 text-sm"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Register as
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 bg-white bg-opacity-90"
            >
              <option value="student">Student</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>

          {/* Note Box */}
          <div className="bg-blue-900 bg-opacity-30 p-3 rounded-lg">
            <p className="text-sm text-blue-200">
              <strong>Note:</strong> If you're registering as a delivery partner, your account will need to be activated by an admin before you can start receiving deliveries.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3"
            loading={loading}
          >
            Sign Up
          </Button>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-200">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3139d2' }} className="font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default Register;