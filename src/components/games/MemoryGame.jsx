import { useState, useEffect } from 'react';
import { useDiscounts } from '../../context/DiscountContext';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MemoryGame = ({ onWin }) => {
  const { addDiscount } = useDiscounts();
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [prize, setPrize] = useState(null);

  const foodEmojis = ['🍕', '🍔', '🌮', '🍣', '🍜', '🍦', '🍪', '🍩'];
  
  const initializeGame = () => {
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
    setPrize(null);
  };

  const handleCardClick = (index) => {
    if (!gameStarted || gameComplete) return;
    if (flippedIndices.length === 2) return;
    if (matchedPairs.includes(index)) return;
    if (flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIndex, secondIndex] = newFlipped;
      
      if (cards[firstIndex].emoji === cards[secondIndex].emoji) {
        setMatchedPairs([...matchedPairs, firstIndex, secondIndex]);
        setFlippedIndices([]);
        
        if (matchedPairs.length + 2 === cards.length) {
          // Game complete - calculate prize
          let prizeValue, prizeLabel, prizeType;
          
          if (moves <= 10) {
            prizeValue = 25;
            prizeLabel = '25% OFF';
            prizeType = 'percentage';
          } else if (moves <= 15) {
            prizeValue = 15;
            prizeLabel = '15% OFF';
            prizeType = 'percentage';
          } else if (moves <= 20) {
            prizeValue = 10;
            prizeLabel = '10% OFF';
            prizeType = 'percentage';
          } else {
            prizeValue = 5;
            prizeLabel = '5% OFF';
            prizeType = 'percentage';
          }

          const prizeData = {
            type: prizeType,
            value: prizeValue,
            label: prizeLabel,
            source: 'memorygame'
          };

          setPrize(prizeData);
          setGameComplete(true);

          // Save discount to user's account
          addDiscount(prizeData).then(discount => {
            if (discount) {
              toast.success(`🎉 You won ${prizeLabel}! Check your discounts in cart.`);
              if (onWin) onWin(discount);
            }
          });
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
          Memory Match
        </h2>
        {gameStarted && (
          <div className="text-sm text-gray-600">
            Moves: {moves}
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Match the food pairs to win discounts on ANY item!</p>
          <div className="grid grid-cols-4 gap-1 max-w-xs mx-auto mb-4">
            {['🍕', '🍔', '🍕', '🍔', '🌮', '🍣', '🌮', '🍣'].map((emoji, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded flex items-center justify-center text-xl">
                {emoji}
              </div>
            ))}
          </div>
          <Button onClick={initializeGame}>Start Game</Button>
        </div>
      ) : (
        <>
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
                disabled={matchedPairs.includes(index)}
              >
                {(flippedIndices.includes(index) || matchedPairs.includes(index))
                  ? card.emoji
                  : '❓'}
              </button>
            ))}
          </div>

          {gameComplete && prize && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-bold text-green-700 mb-2">Game Complete!</h3>
              <p className="text-gray-700 mb-2">
                You won: <span className="font-bold text-primary-600 text-xl">{prize.label}</span>
              </p>
              <p className="text-sm text-gray-500 mb-3">Moves: {moves}</p>
              <p className="text-xs text-gray-500 mb-3">
                Apply this discount to ANY item in your cart!
              </p>
              <Button onClick={initializeGame} size="sm">Play Again</Button>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
};

export default MemoryGame;