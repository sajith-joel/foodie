import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDiscounts } from '../../context/DiscountContext';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MemoryGame = ({ onWin }) => {
  const { user } = useAuth();
  const { addDiscount } = useDiscounts();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [prize, setPrize] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const MAX_MOVES = 12;
  const foodEmojis = ['🍕', '🍔', '🌮', '🍣', '🍜', '🍦', '🍪', '🍩'];
  
  // Check if user has already won
  useEffect(() => {
    if (user) {
      const hasUserWon = localStorage.getItem(`memory_won_${user.uid}`);
      if (hasUserWon === 'true') {
        setHasWon(true);
      }
    }
  }, [user]);

  const initializeGame = () => {
    if (hasWon) {
      toast.error('You have already won the game! You cannot play again.');
      return;
    }

    const duplicatedEmojis = [...foodEmojis, ...foodEmojis];
    const shuffled = duplicatedEmojis.sort(() => Math.random() - 0.5);
    const newCards = shuffled.map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false
    }));
    setCards(newCards);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameStarted(true);
    setGameComplete(false);
    setGameOver(false);
    setPrize(null);
    setAttempts(prev => prev + 1);
  };

  const handleCardClick = (index) => {
    if (!gameStarted || gameComplete || gameOver || hasWon) return;
    if (flippedIndices.length === 2) return;
    if (matchedPairs.includes(index)) return;
    if (flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const newMoveCount = moves + 1;
      setMoves(newMoveCount);
      
      const [firstIndex, secondIndex] = newFlipped;
      
      if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
        // Match found
        const newMatchedPairs = [...matchedPairs, firstIndex, secondIndex];
        setMatchedPairs(newMatchedPairs);
        setFlippedIndices([]);
        
        // Check if game is complete (all pairs matched)
        if (newMatchedPairs.length === cards.length) {
          // Calculate prize based on moves
          let prizeValue, prizeLabel;
          
          if (newMoveCount <= 8) {
            prizeValue = 15;
            prizeLabel = '15% OFF';
          } else if (newMoveCount <= 10) {
            prizeValue = 10;
            prizeLabel = '10% OFF';
          } else {
            prizeValue = 5;
            prizeLabel = '5% OFF';
          }

          const prizeData = {
            type: 'percentage',
            value: prizeValue,
            label: prizeLabel,
            source: 'memorygame'
          };

          setPrize(prizeData);
          setGameComplete(true);
          
          // Mark user as winner
          localStorage.setItem(`memory_won_${user.uid}`, 'true');
          setHasWon(true);

          // Save discount to user's account
          addDiscount(prizeData).then(discount => {
            if (discount) {
              toast.success(`🎉 You won ${prizeLabel}! Check your discounts in cart.`);
              if (onWin) onWin(discount);
            }
          });
        }
      } else {
        // No match, flip back after delay
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }

      // Check if game over (max moves reached and not complete)
      if (newMoveCount >= MAX_MOVES && matchedPairs.length + 2 < cards.length) {
        setGameOver(true);
        toast.error('Game Over! Maximum moves reached.');
      }
    }
  };

  const getPrizeMessage = () => {
    if (!prize) return '';
    if (prize.value === 15) return 'Excellent! 15% OFF on any item!';
    if (prize.value === 10) return 'Good job! 10% OFF on any item!';
    return 'Nice! 5% OFF on any item!';
  };

  const movesLeft = MAX_MOVES - moves;

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
              Memory Match
            </h2>
            <button
              onClick={() => setShowRules(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Game Rules"
            >
              <InformationCircleIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          {gameStarted && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Moves: </span>
                <span className="font-semibold">{moves}/{MAX_MOVES}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Pairs: </span>
                <span className="font-semibold">{matchedPairs.length / 2}/{cards.length / 2}</span>
              </div>
            </div>
          )}
        </div>

        {hasWon && !gameStarted ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">You've Already Won!</h3>
            <p className="text-gray-600 mb-4">You can only win once. Check your discounts in cart!</p>
            <Button onClick={() => setShowRules(true)} variant="outline" size="sm">
              View Rules
            </Button>
          </div>
        ) : !gameStarted ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Match the food pairs within {MAX_MOVES} moves to win!</p>
            <div className="grid grid-cols-4 gap-1 max-w-xs mx-auto mb-4">
              {['🍕', '🍔', '🍕', '🍔', '🌮', '🍣', '🌮', '🍣'].map((emoji, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center text-xl">
                  {emoji}
                </div>
              ))}
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-500">🎯 Complete in 8 moves → 15% OFF</p>
              <p className="text-sm text-gray-500">🎯 Complete in 10 moves → 10% OFF</p>
              <p className="text-sm text-gray-500">🎯 Complete in 12 moves → 5% OFF</p>
            </div>
            <Button onClick={initializeGame} disabled={hasWon}>
              {hasWon ? 'Already Won' : 'Start Game'}
            </Button>
          </div>
        ) : (
          <>
            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {cards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(index)}
                  className={`aspect-square text-2xl rounded-lg transition-all duration-300 ${
                    matchedPairs.includes(index)
                      ? 'bg-green-100 cursor-default'
                      : flippedIndices.includes(index)
                      ? 'bg-primary-100'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  disabled={matchedPairs.includes(index) || gameOver || gameComplete}
                >
                  {(flippedIndices.includes(index) || matchedPairs.includes(index))
                    ? card.emoji
                    : '❓'}
                </button>
              ))}
            </div>

            {/* Game Status */}
            <div className="text-center">
              {gameComplete && prize && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-bold text-green-700 mb-2">🎉 You Win!</h3>
                  <p className="text-gray-700 mb-2">{getPrizeMessage()}</p>
                  <p className="text-sm text-gray-500 mb-3">Moves used: {moves}/{MAX_MOVES}</p>
                  <Button onClick={initializeGame} size="sm" variant="outline">
                    Play Again
                  </Button>
                </div>
              )}

              {gameOver && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="text-lg font-bold text-red-700 mb-2">😢 Game Over</h3>
                  <p className="text-gray-700 mb-2">You used {moves} moves. Try again!</p>
                  <p className="text-sm text-gray-500 mb-3">Keep trying until you win!</p>
                  <Button onClick={initializeGame} size="sm" variant="primary">
                    Try Again
                  </Button>
                </div>
              )}

              {gameStarted && !gameComplete && !gameOver && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Moves left: {movesLeft}</span>
                  <span>Pairs left: {(cards.length - matchedPairs.length) / 2}</span>
                </div>
              )}
            </div>
          </>
        )}
      </GlassCard>

      {/* Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="Memory Game Rules"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Game Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Each student account can win <span className="font-bold">only once</span></li>
              <li>You can play multiple attempts until you win</li>
              <li>Win by matching all 8 pairs within <span className="font-bold">12 moves</span></li>
              <li>Game ends when all pairs matched (WIN) or 12 moves used (GAME OVER)</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🏆 Reward Structure</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Complete in 1-8 moves</span>
                <span className="font-bold text-green-600">15% OFF</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Complete in 9-10 moves</span>
                <span className="font-bold text-green-600">10% OFF</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Complete in 11-12 moves</span>
                <span className="font-bold text-green-600">5% OFF</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🎯 Prize Rules</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Discount applies to <span className="font-bold">one food item</span> only</li>
              <li>Prize automatically added to your account upon winning</li>
              <li>Valid for <span className="font-bold">7 days</span> from winning</li>
              <li>Cannot be combined with other offers</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Take your time - no time limit!</li>
              <li>Remember card positions for next attempt</li>
              <li>Keep trying until you win</li>
              <li>Once you win, you cannot play again</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowRules(false)} variant="primary">
              Got It!
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MemoryGame;