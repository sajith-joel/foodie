import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDiscounts } from '../../context/DiscountContext';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SpinWheel = ({ onWin }) => {
  const { user } = useAuth();
  const { addDiscount } = useDiscounts();
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [segments, setSegments] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Default prizes if none in database
  const defaultSegments = [
    { label: '10% OFF', value: 10, color: '#FF6B6B', icon: '🎁', probability: 15, type: 'percentage' },
    { label: '15% OFF', value: 15, color: '#4ECDC4', icon: '🎉', probability: 12, type: 'percentage' },
    { label: '20% OFF', value: 20, color: '#45B7D1', icon: '⭐', probability: 10, type: 'percentage' },
    { label: 'FREE DELIVERY', value: 'free', color: '#96CEB4', icon: '🚚', probability: 10, type: 'free' },
    { label: '5% OFF', value: 5, color: '#FFE194', icon: '🎯', probability: 20, type: 'percentage' },
    { label: '25% OFF', value: 25, color: '#D4A5A5', icon: '🏆', probability: 8, type: 'percentage' },
    { label: 'BUY 1 GET 1', value: 'bogo', color: '#9B59B6', icon: '🎪', probability: 5, type: 'bogo' },
    { label: 'TRY AGAIN', value: 0, color: '#95A5A6', icon: '🔄', probability: 20, type: 'tryagain' },
  ];

  // Load prizes from Firebase
  useEffect(() => {
    loadPrizes();
    
    // Load spins left from localStorage
    const savedSpins = localStorage.getItem(`spinWheel_${user?.uid}`);
    if (savedSpins) {
      setSpinsLeft(parseInt(savedSpins));
    }
  }, [user]);

  // Save spins left to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`spinWheel_${user?.uid}`, spinsLeft.toString());
    }
  }, [spinsLeft, user]);

  const loadPrizes = async () => {
    try {
      const prizesRef = collection(db, 'wheel_prizes');
      const snapshot = await getDocs(prizesRef);
      
      if (snapshot.empty) {
        setSegments(defaultSegments);
      } else {
        const loadedPrizes = [];
        snapshot.forEach((doc) => {
          loadedPrizes.push(doc.data());
        });
        loadedPrizes.sort((a, b) => (a.order || 0) - (b.order || 0));
        setSegments(loadedPrizes);
      }
    } catch (error) {
      console.error('Error loading prizes:', error);
      setSegments(defaultSegments);
    }
  };

  const segmentAngle = 360 / segments.length;

  useEffect(() => {
    if (segments.length > 0) {
      drawWheel();
    }
  }, [segments, rotation]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.4;

    ctx.clearRect(0, 0, width, height);

    // Draw segments
    segments.forEach((segment, index) => {
      const startAngle = (index * segmentAngle + rotation) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle + rotation) * (Math.PI / 180);

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + (segmentAngle / 2) * (Math.PI / 180));
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(segment.icon, radius * 0.65, 0);
      ctx.font = 'bold 12px Arial';
      ctx.fillText(segment.label.split(' ')[0], radius * 0.65, 25);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(width - 30, centerY - 15);
    ctx.lineTo(width - 10, centerY);
    ctx.lineTo(width - 30, centerY + 15);
    ctx.closePath();
    ctx.fillStyle = '#FF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const getSegmentFromRotation = (currentRotation) => {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const arrowPosition = 0;
    const segmentPosition = (arrowPosition - normalizedRotation + 360) % 360;
    
    for (let i = 0; i < segments.length; i++) {
      const segmentStart = i * segmentAngle;
      const segmentEnd = (i + 1) * segmentAngle;
      
      if (segmentPosition >= segmentStart && segmentPosition < segmentEnd) {
        return i;
      }
    }
    
    return 0;
  };

  const spin = () => {
    if (spinsLeft <= 0) {
      toast.error('No spins left for today! Come back tomorrow.');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    
    const spins = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.random() * 360;
    const targetRotation = rotation + (spins * 360) + randomOffset;

    const startRotation = rotation;
    const startTime = performance.now();
    const duration = 3000;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut(progress);
      
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        
        const segmentIndex = getSegmentFromRotation(targetRotation);
        const prize = segments[segmentIndex];
        
        setResult(prize);
        setShowResult(true);
        setSpinsLeft(prev => prev - 1);
        
        // Save discount to user's account
        if (prize.type !== 'tryagain') {
          addDiscount({
            type: prize.type,
            value: prize.value,
            label: prize.label,
            source: 'spinwheel'
          }).then(discount => {
            if (discount) {
              toast.success(`🎉 You won ${prize.label}! Check your discounts in cart.`);
              if (onWin) onWin(discount);
            }
          });
        } else {
          toast('Better luck next time!', { icon: '🎯' });
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <GlassCard className="p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2 animate-spin-slow" />
          Lucky Spin Wheel
        </h2>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          {spinsLeft} spin{spinsLeft !== 1 ? 's' : ''} left
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Wheel */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-[250px] h-[250px] md:w-[300px] md:h-[300px] drop-shadow-2xl"
          />
          
          {/* Arrow */}
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-r-[30px] border-r-red-500 filter drop-shadow-lg"></div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-semibold mb-2">Win Amazing Prizes!</h3>
          <p className="text-gray-600 mb-4">
            Spin the wheel and win discounts on ANY item!
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {segments.slice(0, 4).map((segment, idx) => (
              <div key={idx} className="flex items-center space-x-1 text-sm">
                <span>{segment.icon}</span>
                <span>{segment.label}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={spin}
            disabled={isSpinning || spinsLeft === 0}
            className={`w-full md:w-auto ${isSpinning ? 'animate-pulse' : ''}`}
            size="lg"
          >
            {isSpinning ? 'Spinning...' : spinsLeft === 0 ? 'No Spins Left' : 'Spin Now!'}
          </Button>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && result && result.type !== 'tryagain' && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <GlassCard className="p-8 max-w-md text-center">
            <div className="text-7xl mb-4 animate-bounce">
              {result.icon}
            </div>
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Congratulations!
            </h3>
            <p className="text-xl mb-4">
              You won: <span className="font-bold text-primary-600">{result.label}</span>
            </p>
            <p className="text-gray-600 mb-4">
              This discount can be applied to ANY item in your cart!
            </p>
            <Button onClick={() => setShowResult(false)} size="lg">
              Awesome!
            </Button>
          </GlassCard>
        </div>
      )}
    </GlassCard>
  );
};

export default SpinWheel;