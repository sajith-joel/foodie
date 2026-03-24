import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      if (error.message.includes('email-already-in-use')) {
        toast.error('Email already registered');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto flex items-start justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 px-4 py-10">

      <GlassCard className="w-full max-w-md mx-auto p-6 rounded-2xl">

        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <img src={logo} alt="Campus Food" className="h-14 md:h-16 mx-auto mb-3 md:mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white">Create Account</h2>
          <p className="text-sm md:text-base text-gray-200 mt-1 md:mt-2">Join CHILL X PlayZ today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-6">

          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            icon={UserIcon}
            placeholder="Enter your full name"
            required
          />

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            icon={EnvelopeIcon}
            placeholder="Enter your email"
            required
          />

          {/* Phone */}
          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            icon={PhoneIcon}
            placeholder="Enter your phone number"
            required
          />

          {/* ✅ DROPDOWN ROLE */}
          <div>
            <label className="block text-sm text-white mb-2">
              I want to join as
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-white bg-opacity-90 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="student">Student</option>
              <option value="delivery">Delivery Partner</option>
            </select>
          </div>

          {/* Conditional Fields */}
          {formData.role === 'student' && (
            <Input
              label="Student ID (Optional)"
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter your student ID"
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
            />
          )}

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              icon={LockClosedIcon}
              placeholder="Create password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={LockClosedIcon}
              placeholder="Confirm password"
              required
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-400"
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            loading={loading}
          >
            Create Account
          </Button>

          {/* Login */}
          <p className="text-center text-sm text-gray-200">
            Already have an account?{' '}
            <Link to="/login" className="text-white font-semibold underline">
              Sign in
            </Link>
          </p>

        </form>
      </GlassCard>
    </div>
  );
};

export default Register;