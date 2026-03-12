import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlassCard from '../../components/ui/GlassCard';
import SpinWheel from '../../components/games/SpinWheel';
import MemoryGame from '../../components/games/MemoryGame';
import {
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  GiftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState(null);

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.name || user?.email?.split('@')[0]}!
      </h1>
      <p className="text-gray-600 mb-8">What would you like to do today?</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/menu"
          className="block p-6 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <ShoppingBagIcon className="h-8 w-8 text-primary-600 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Browse Menu</h3>
          <p className="text-sm text-gray-600">Order your favorite food</p>
        </Link>

        <Link
          to="/my-orders"
          className="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold mb-1">My Orders</h3>
          <p className="text-sm text-gray-600">Track your orders</p>
        </Link>

        <button
          onClick={() => setActiveGame('spin')}
          className="block p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left w-full"
        >
          <GiftIcon className="h-8 w-8 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Play & Win</h3>
          <p className="text-sm text-gray-600">Spin wheel & memory game</p>
        </button>
      </div>

      {/* Games Section */}
      {activeGame ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeGame === 'spin' ? '🎰 Spin & Win' : '🎮 Memory Game'}
            </h2>
            <div className="space-x-3">
              <button
                onClick={() => setActiveGame(activeGame === 'spin' ? 'memory' : 'spin')}
                className="text-primary-600 hover:text-primary-700"
              >
                Switch Game
              </button>
              <button
                onClick={() => setActiveGame(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>

          {activeGame === 'spin' ? <SpinWheel /> : <MemoryGame />}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Spin Wheel Preview */}
          <GlassCard className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveGame('spin')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🎰 Lucky Spin Wheel</h3>
              <SparklesIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-gray-600 mb-3">
              Spin and win amazing discounts on your orders!
            </p>
            <div className="flex space-x-1 text-2xl justify-center">
              <span className="animate-spin-slow">🎡</span>
              <span>10% OFF</span>
              <span>🎁</span>
              <span>FREE DELIVERY</span>
            </div>
          </GlassCard>

          {/* Memory Game Preview */}
          <GlassCard className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setActiveGame('memory')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🧠 Memory Match</h3>
              <SparklesIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-gray-600 mb-3">
              Match the food pairs and win discounts based on your moves!
            </p>
            <div className="grid grid-cols-4 gap-1">
              {['🍕', '🍔', '❓', '❓', '❓', '🍕', '🍔', '❓'].map((emoji, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center text-xl">
                  {emoji}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;