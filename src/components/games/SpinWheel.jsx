import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDiscounts } from '../../context/DiscountContext';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SpinWheel = ({ onWin }) => {
  const { user } = useAuth();
  const { addDiscount } = useDiscounts();
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Default prizes
  const defaultSegments = [
    { label: '15% OFF', value: 15, color: '#FF6B6B', icon: '🏆', probability: 20 },
    { label: '10% OFF', value: 10, color: '#4ECDC4', icon: '🎯', probability: 30 },
    { label: '5% OFF', value: 5, color: '#45B7D1', icon: '🎁', probability: 50 },
  ];

  // Check if user has already spun
  useEffect(() => {
    const checkUserSpin = async () => {
      if (!user) return;
      
      try {
        const spinRef = doc(db, 'wheel_spins', user.uid);
        const spinDoc = await getDoc(spinRef);
        
        if (spinDoc.exists()) {
          setHasSpun(true);
          if (spinDoc.data().prize) {
            setResult(spinDoc.data().prize);
          }
        }
      } catch (error) {
        console.error('Error checking spin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSpin();
  }, [user]);

  // Load prizes from Firebase or use defaults
  useEffect(() => {
    loadPrizes();
  }, []);

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

  const spin = async () => {
    if (!user) {
      toast.error('Please login to spin');
      return;
    }

    if (hasSpun) {
      toast.error('You have already used your one spin!');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    
    // Generate random final rotation
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
        // Spin complete - use an async function inside
        (async () => {
          try {
            // Get the prize
            const segmentIndex = getSegmentFromRotation(targetRotation);
            const prize = segments[segmentIndex];
            
            setResult(prize);
            setShowResult(true);
            setHasSpun(true);
            
            // Save spin record
            try {
              await setDoc(doc(db, 'wheel_spins', user.uid), {
                userId: user.uid,
                spunAt: new Date().toISOString(),
                prize: prize
              });
            } catch (error) {
              console.error('Error saving spin record:', error);
            }
            
            // Save discount to user's account
            const prizeData = {
              type: 'percentage',
              value: prize.value,
              label: prize.label,
              source: 'spinwheel'
            };

            const discount = await addDiscount(prizeData);
            if (discount) {
              toast.success(`🎉 You won ${prize.label}! Check your coupons in cart.`);
              if (onWin) onWin(discount);
            }
            
            setIsSpinning(false);
          } catch (error) {
            console.error('Error in spin completion:', error);
            setIsSpinning(false);
          }
        })();
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <SparklesIcon className="h-6 w-6 text-yellow-500 mr-2" />
              Spin & Win
            </h2>
            <button
              onClick={() => setShowRules(true)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Game Rules"
            >
              <InformationCircleIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            {hasSpun ? 'Already Spun' : '1 Spin Available'}
          </div>
        </div>

        {hasSpun && result ? (
          <div className="text-center py-8">
            <div className="text-7xl mb-4 animate-bounce">
              {result.icon || '🎁'}
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              You Won {result.label}!
            </h3>
            <p className="text-gray-600 mb-4">
              Your discount coupon has been added to your account.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>How to use:</strong> Add any item to your cart and apply your coupon when prompted!
              </p>
            </div>
          </div>
        ) : hasSpun ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">You've Already Spun!</h3>
            <p className="text-gray-500">One spin per account. Check your coupons in cart.</p>
          </div>
        ) : (
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
              <h3 className="text-lg font-semibold mb-2">Win Amazing Discounts!</h3>
              <p className="text-gray-600 mb-4">
                One spin per account. Win coupons you can use on any item!
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {segments.map((segment, idx) => (
                  <div key={idx} className="text-center p-2 rounded-lg" style={{ backgroundColor: segment.color + '20' }}>
                    <div className="text-2xl mb-1">{segment.icon}</div>
                    <div className="text-sm font-semibold">{segment.label}</div>
                  </div>
                ))}
              </div>

              <Button
                onClick={spin}
                disabled={isSpinning || hasSpun}
                className={`w-full md:w-auto ${isSpinning ? 'animate-pulse' : ''}`}
                size="lg"
              >
                {isSpinning ? 'Spinning...' : hasSpun ? 'Already Spun' : 'SPIN NOW!'}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Rules Modal */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="Spin Wheel Rules"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Game Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Each student gets <span className="font-bold">only ONE spin</span> per account</li>
              <li>Spin the wheel to win a discount coupon</li>
              <li>Prizes are automatically added to your account</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🏆 Prizes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>🏆 15% OFF</span>
                <span className="font-bold text-green-600">20% chance</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🎯 10% OFF</span>
                <span className="font-bold text-green-600">30% chance</span>
              </div>
              <div className="flex justify-between items-center">
                <span>🎁 5% OFF</span>
                <span className="font-bold text-green-600">50% chance</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🎯 How to Use Your Prize</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Coupon is automatically added to your account</li>
              <li>When adding items to cart, you can apply your coupon</li>
              <li>Discount applies to <span className="font-bold">one food item</span> only</li>
              <li>The reduced price will be shown in your cart</li>
              <li>Valid for <span className="font-bold">7 days</span> from winning</li>
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

export default SpinWheel;