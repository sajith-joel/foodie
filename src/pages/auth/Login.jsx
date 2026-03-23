import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GlassCard from '../../components/ui/GlassCard';
// import bgImage from '../../assets/bg.jpg';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <GlassCard className="w-full max-w-md p-8 relative z-10" opacity={30} blur="lg">
        <div className="text-center mb-8">
          <img src={logo} alt="Campus Food" className="h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-200 mt-2">Sign in to continue to Chill X Play Zone</p>
          <p>By IT Chokanzz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={EnvelopeIcon}
            placeholder="Enter your email"
            required
            className="bg-white bg-opacity-90"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={LockClosedIcon}
            placeholder="Enter your password"
            required
            className="bg-white bg-opacity-90"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50" />
              <span className="ml-2 text-sm text-gray-200">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-primary-300 hover:text-primary-200">
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-200">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-300 hover:text-primary-200 font-medium">
              Sign up
            </Link>
          </p>
        </form>

        {/* <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-200">Demo Credentials</span>
            </div>
          </div> */}

          {/* <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-gray-200">
            <div className="bg-white bg-opacity-20 p-2 rounded">
              <p className="font-semibold">Student</p>
              <p>student@example.com</p>
              <p>password: student123</p>
            </div>
            <div className="bg-white bg-opacity-20 p-2 rounded">
              <p className="font-semibold">Admin</p>
              <p>admin@example.com</p>
              <p>password: admin123</p>
            </div>
          </div> */}
        {/* </div> */}
      </GlassCard>
    </div>
  );
};

export default Login;