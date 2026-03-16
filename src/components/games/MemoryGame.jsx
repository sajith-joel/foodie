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
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [wonPrize, setWonPrize] = useState(null);

  const MAX_MOVES = 12;
  const MAX_ATTEMPTS = 3;
  const foodEmojis = ['🍕', '🍔', '🌮', '🍣', '🍜', '🍦', '🍪', '🍩'];
  
  // Check if user has already won and load attempts
  useEffect(() => {
    if (user) {
      const hasUserWon = localStorage.getItem(`memory_won_${user.uid}`);
      if (hasUserWon === 'true') {
        setHasWon(true);
      }
      
      // Load remaining attempts
      const savedAttempts = localStorage.getItem(`memory_attempts_${user.uid}`);
      if (savedAttempts) {
        setAttemptsLeft(parseInt(savedAttempts));
      } else {
        localStorage.setItem(`memory_attempts_${user.uid}`, MAX_ATTEMPTS.toString());
      }
    }
  }, [user]);

  // Save attempts to localStorage
  const updateAttemptsLeft = (newAttempts) => {
    setAttemptsLeft(newAttempts);
    if (user) {
      localStorage.setItem(`memory_attempts_${user.uid}`, newAttempts.toString());
    }
  };

  const initializeGame = () => {
    if (hasWon) {
      toast.error('You have already won the game! You cannot play again.');
      return;
    }

    if (attemptsLeft <= 0) {
      toast.error('No attempts left! You have used all 3 trials.');
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
          setWonPrize(prizeData);
          setGameComplete(true);
          setShowPrizeModal(true);
          
          // Mark user as winner
          localStorage.setItem(`memory_won_${user.uid}`, 'true');
          setHasWon(true);

          // Save discount to user's account
          addDiscount(prizeData).then(discount => {
            if (discount) {
              toast.success(`🎉 You won ${prizeLabel}! Apply it to any item in your cart.`);
              if (onWin) onWin(discount);
            }
          });

          // Reduce attempts
          updateAttemptsLeft(attemptsLeft - 1);
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
        
        // Reduce attempts on game over
        updateAttemptsLeft(attemptsLeft - 1);
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
          <div className="flex items-center space-x-4">
            <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              Trials left: {attemptsLeft}/{MAX_ATTEMPTS}
            </div>
            {gameStarted && (
              <>
                <div className="text-sm">
                  <span className="text-gray-500">Moves: </span>
                  <span className="font-semibold">{moves}/{MAX_MOVES}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Pairs: </span>
                  <span className="font-semibold">{matchedPairs.length / 2}/{cards.length / 2}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {hasWon && !gameStarted ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">You've Already Won!</h3>
            <p className="text-gray-600 mb-4">Check your discounts in cart and apply to any item!</p>
            <Button onClick={() => setShowRules(true)} variant="outline" size="sm">
              View Rules
            </Button>
          </div>
        ) : attemptsLeft <= 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-xl font-bold text-red-600 mb-2">No Trials Left</h3>
            <p className="text-gray-600 mb-4">You have used all {MAX_ATTEMPTS} attempts.</p>
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
              <p className="text-sm text-purple-600 font-semibold mt-2">
                {attemptsLeft} trial{attemptsLeft !== 1 ? 's' : ''} remaining
              </p>
            </div>
            <Button onClick={initializeGame} disabled={hasWon || attemptsLeft <= 0}>
              Start Game ({attemptsLeft} trials left)
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
                  <p className="text-sm text-gray-500 mb-1">Moves used: {moves}/{MAX_MOVES}</p>
                  <p className="text-sm text-purple-600 mb-3">
                    Trials left: {attemptsLeft - 1}
                  </p>
                  <Button onClick={initializeGame} size="sm" variant="outline" disabled={attemptsLeft - 1 <= 0}>
                    Play Again ({attemptsLeft - 1} trials left)
                  </Button>
                </div>
              )}

              {gameOver && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="text-lg font-bold text-red-700 mb-2">😢 Game Over</h3>
                  <p className="text-gray-700 mb-2">You used {moves} moves. Try again!</p>
                  <p className="text-sm text-purple-600 mb-3">
                    Trials left: {attemptsLeft - 1}
                  </p>
                  <Button 
                    onClick={initializeGame} 
                    size="sm" 
                    variant="primary"
                    disabled={attemptsLeft - 1 <= 0}
                  >
                    Try Again ({attemptsLeft - 1} trials left)
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

      {/* Prize Won Modal */}
      <Modal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        title="🎉 Congratulations!"
        size="md"
      >
        <div className="text-center py-4">
          <div className="text-7xl mb-4 animate-bounce">
            {wonPrize?.value === 15 ? '🏆' : wonPrize?.value === 10 ? '🎯' : '🎁'}
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            You Won {wonPrize?.label}!
          </h3>
          <p className="text-gray-600 mb-4">
            Your discount has been added to your account.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-800">
              <strong>How to use:</strong> Add any item to your cart and the discount will be automatically available to apply!
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowPrizeModal(false)} variant="primary">
              Awesome!
            </Button>
          </div>
        </div>
      </Modal>

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
              <li>Each student gets <span className="font-bold">3 trials</span> to win the game</li>
              <li>Win by matching all 8 pairs within <span className="font-bold">12 moves</span></li>
              <li>Game ends when all pairs matched (WIN) or 12 moves used (GAME OVER)</li>
              <li>Each attempt (win or loss) counts as one trial</li>
              <li>After 3 trials, you cannot play anymore</li>
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
            <h3 className="font-semibold text-purple-800 mb-2">🎯 How to Use Your Prize</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Discount applies to <span className="font-bold">one food item</span> only</li>
              <li>When adding items to cart, you can choose to apply your discount</li>
              <li>The reduced price will be shown in your cart</li>
              <li>Original price will be crossed out, discounted price shown in green</li>
              <li>Valid for <span className="font-bold">7 days</span> from winning</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Take your time - no time limit!</li>
              <li>Remember card positions for next attempt</li>
              <li>You have 3 trials total - use them wisely!</li>
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