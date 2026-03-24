import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto flex items-start justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 px-4 py-10">

      <GlassCard className="w-full max-w-md mx-auto p-6 rounded-2xl">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <img src={logo} alt="Campus Food" className="h-12 sm:h-16 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-200 mt-1 sm:mt-2">Sign in to continue to CHILL X PlayZ</p>
          <p style={{ color: '#c00a1f' }} className="text-xs sm:text-sm">By IT Chokanzz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-6">

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={EnvelopeIcon}
            placeholder="Enter your email"
            required
          />

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={LockClosedIcon}
              placeholder="Enter your password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 w-4 h-4"
              />
              <span className="ml-2 text-sm text-white">Remember me</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm text-white underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
            loading={loading}
          >
            Sign In
          </Button>

          {/* Register */}
          <p className="text-center text-sm text-gray-200">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-semibold underline">
              Sign up
            </Link>
          </p>

        </form>
      </GlassCard>
    </div>
  );
};

export default Login;