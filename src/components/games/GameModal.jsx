import { useState } from 'react';
import { useRole } from '../../hooks/useRole';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import SpinWheel from './SpinWheel';
import MemoryGame from './MemoryGame';
import { SparklesIcon } from '@heroicons/react/24/outline';

const GameModal = ({ isOpen, onClose }) => {
  const [activeGame, setActiveGame] = useState('spin');
  const { isAdmin } = useRole();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎮 Play & Win Rewards!"
      size="lg"
    >
      <div className="space-y-4">
        {/* Game Tabs */}
        <div className="flex space-x-2 border-b pb-2">
          <button
            onClick={() => setActiveGame('spin')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeGame === 'spin'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎰 Spin Wheel
          </button>
          <button
            onClick={() => setActiveGame('memory')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeGame === 'memory'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🧠 Memory Game
          </button>
        </div>

        {/* Game Container */}
        <div className="min-h-[400px]">
          {activeGame === 'spin' ? <SpinWheel /> : <MemoryGame />}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center text-sm text-gray-500">
            <SparklesIcon className="h-4 w-4 text-yellow-500 mr-1 animate-pulse" />
            <span>Win discounts on your next order!</span>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GameModal;