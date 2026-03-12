import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { SparklesIcon, CogIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AnimatedSpinWheel = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [segments, setSegments] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSegments, setEditingSegments] = useState([]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const velocityRef = useRef(0);
  const frictionRef = useRef(0.98);

  // Load prizes from Firebase
  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const prizesRef = collection(db, 'wheel_prizes');
      const snapshot = await getDocs(prizesRef);
      
      if (snapshot.empty) {
        // Default prizes if none exist
        const defaultPrizes = [
          { label: '10% OFF', value: 10, color: '#FF6B6B', icon: '🎁', probability: 15 },
          { label: '15% OFF', value: 15, color: '#4ECDC4', icon: '🎉', probability: 12 },
          { label: '20% OFF', value: 20, color: '#45B7D1', icon: '⭐', probability: 10 },
          { label: 'FREE DELIVERY', value: 'free', color: '#96CEB4', icon: '🚚', probability: 10 },
          { label: '5% OFF', value: 5, color: '#FFE194', icon: '🎯', probability: 20 },
          { label: '25% OFF', value: 25, color: '#D4A5A5', icon: '🏆', probability: 8 },
          { label: 'BUY 1 GET 1', value: 'bogo', color: '#9B59B6', icon: '🎪', probability: 5 },
          { label: 'TRY AGAIN', value: 0, color: '#95A5A6', icon: '🔄', probability: 20 },
        ];
        setSegments(defaultPrizes);
        setEditingSegments(defaultPrizes);
      } else {
        const prizes = [];
        snapshot.forEach(doc => {
          prizes.push({ id: doc.id, ...doc.data() });
        });
        // Sort by order
        prizes.sort((a, b) => a.order - b.order);
        setSegments(prizes);
        setEditingSegments(prizes);
      }
    } catch (error) {
      console.error('Error loading prizes:', error);
      toast.error('Failed to load wheel prizes');
    }
  };

  const savePrizes = async () => {
    try {
      const prizesRef = collection(db, 'wheel_prizes');
      
      // Delete existing
      const snapshot = await getDocs(prizesRef);
      const deletePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { active: false })
      );
      await Promise.all(deletePromises);

      // Save new
      const savePromises = editingSegments.map((prize, index) => {
        const prizeData = {
          ...prize,
          order: index,
          active: true,
          updatedAt: new Date().toISOString()
        };
        return addDoc(prizesRef, prizeData);
      });
      
      await Promise.all(savePromises);
      setSegments(editingSegments);
      setShowEditModal(false);
      toast.success('Prizes updated successfully!');
      drawWheel();
    } catch (error) {
      console.error('Error saving prizes:', error);
      toast.error('Failed to save prizes');
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

    // Draw segments with gradient for 3D effect
    segments.forEach((segment, index) => {
      const startAngle = (index * segmentAngle + rotation) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle + rotation) * (Math.PI / 180);

      // Create gradient for 3D effect
      const gradient = ctx.createRadialGradient(
        centerX - 10, centerY - 10, radius * 0.3,
        centerX, centerY, radius
      );
      gradient.addColorStop(0, segment.color);
      gradient.addColorStop(0.7, shadeColor(segment.color, -30));
      gradient.addColorStop(1, shadeColor(segment.color, -50));

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add metallic border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add inner border
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Add text with glow effect
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + (segmentAngle / 2) * (Math.PI / 180));
      ctx.textAlign = 'center';
      
      // Text shadow for 3D effect
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(segment.icon, radius * 0.65, 0);
      
      // Reset shadow for smaller text
      ctx.shadowBlur = 3;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(segment.label.split(' ')[0], radius * 0.65, 25);
      
      ctx.restore();
    });

    // Draw center with 3D effect
    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    const centerGradient = ctx.createRadialGradient(
      centerX - 5, centerY - 5, 5,
      centerX, centerY, 30
    );
    centerGradient.addColorStop(0, '#FFD700');
    centerGradient.addColorStop(0.5, '#FFA500');
    centerGradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = centerGradient;
    ctx.fill();
    
    // Inner border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw center bolt
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF4500';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pointer with animation
    ctx.beginPath();
    ctx.moveTo(width - 30, centerY - 20);
    ctx.lineTo(width - 10, centerY);
    ctx.lineTo(width - 30, centerY + 20);
    ctx.closePath();
    
    // Metallic pointer
    const pointerGradient = ctx.createLinearGradient(
      width - 40, centerY - 20,
      width - 10, centerY + 20
    );
    pointerGradient.addColorStop(0, '#C0C0C0');
    pointerGradient.addColorStop(0.5, '#FFFFFF');
    pointerGradient.addColorStop(1, '#C0C0C0');
    ctx.fillStyle = pointerGradient;
    ctx.fill();
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Helper function to shade colors
  const shadeColor = (color, percent) => {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
  };

  const spin = () => {
    if (spinsLeft <= 0) {
      toast.error('No spins left for today! Come back tomorrow.');
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    
    // Calculate target segment based on probabilities
    const totalProbability = segments.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalProbability;
    let selectedIndex = 0;
    let cumulative = 0;
    
    for (let i = 0; i < segments.length; i++) {
      cumulative += segments[i].probability;
      if (random <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    // Calculate target rotation to land on selected segment
    const targetSegmentAngle = (selectedIndex * segmentAngle) + (segmentAngle / 2);
    const currentRotation = rotation % 360;
    const spins = 10 + Math.floor(Math.random() * 10); // 10-20 full rotations
    
    // Calculate needed rotation
    let targetRotation = rotation + (spins * 360) + 
      ((targetSegmentAngle - currentRotation + 360) % 360);

    // Animate with physics
    const startRotation = rotation;
    const startTime = performance.now();
    const duration = 3000; // 3 seconds

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for realistic deceleration
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut(progress);
      
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete
        setIsSpinning(false);
        const prize = segments[selectedIndex];
        setResult(prize);
        setShowResult(true);
        setSpinsLeft(prev => prev - 1);
        
        // Show prize message
        if (prize.value === 0) {
          toast('Better luck next time!', { icon: '🎯' });
        } else if (prize.value === 'free') {
          toast.success('🎉 You won FREE DELIVERY!');
        } else if (prize.value === 'bogo') {
          toast.success('🎪 You won BUY 1 GET 1 FREE!');
        } else {
          toast.success(`🎉 You won ${prize.value}% OFF!`);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <>
      <GlassCard className="p-6 relative overflow-hidden">
        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={() => setShowEditModal(true)}
            className="absolute top-4 right-4 p-2 bg-purple-100 rounded-full hover:bg-purple-200 transition-colors z-10"
            title="Edit Wheel Prizes"
          >
            <CogIcon className="h-5 w-5 text-purple-600" />
          </button>
        )}

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
          {/* Wheel Container */}
          <div className="relative">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-[300px] h-[300px] md:w-[350px] md:h-[350px] drop-shadow-2xl"
              />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 opacity-30 blur-xl -z-10"></div>
            </div>
            
            {/* Pointer with animation */}
            <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">
              <div className="relative">
                <div className="w-0 h-0 border-t-[20px] border-t-transparent border-b-[20px] border-b-transparent border-r-[30px] border-r-red-500 filter drop-shadow-lg"></div>
                <div className="absolute -top-2 -left-3 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold mb-2">Win Amazing Prizes!</h3>
            <p className="text-gray-600 mb-4">
              Spin the wheel and win discounts, free delivery, and more!
            </p>

            {/* Prize Grid */}
            <div className="grid grid-cols-2 gap-2 mb-6 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {segments.map((segment, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center space-x-2 p-2 rounded-lg"
                  style={{ backgroundColor: segment.color + '20' }}
                >
                  <span className="text-xl">{segment.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{segment.label}</span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full" 
                        style={{ width: `${segment.probability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={spin}
              disabled={isSpinning || spinsLeft === 0}
              className={`w-full md:w-auto relative overflow-hidden ${
                isSpinning ? 'animate-pulse' : ''
              }`}
              size="lg"
            >
              {isSpinning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Spinning...
                </span>
              ) : spinsLeft === 0 ? (
                'No Spins Left'
              ) : (
                'Spin Now!'
              )}
            </Button>
          </div>
        </div>

        {/* Result Modal */}
        {showResult && result && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
            <GlassCard className="p-8 max-w-md text-center transform animate-bounce-in">
              <div className="text-7xl mb-4 animate-spin-slow">
                {result.icon}
              </div>
              <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Congratulations!
              </h3>
              <p className="text-xl mb-4">
                You won: <span className="font-bold text-primary-600">{result.label}</span>
              </p>
              {result.value === 'free' && (
                <p className="text-gray-600 mb-4">Free delivery on your next order!</p>
              )}
              {result.value === 'bogo' && (
                <p className="text-gray-600 mb-4">Buy one get one free on any item!</p>
              )}
              {typeof result.value === 'number' && result.value > 0 && (
                <p className="text-gray-600 mb-4">{result.value}% off on your next order!</p>
              )}
              {result.value === 0 && (
                <p className="text-gray-600 mb-4">Try again next time!</p>
              )}
              <Button onClick={() => setShowResult(false)} size="lg">
                Awesome!
              </Button>
            </GlassCard>
          </div>
        )}
      </GlassCard>

      {/* Admin Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Wheel Prizes</h2>
            
            <div className="space-y-4">
              {editingSegments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    value={segment.label}
                    onChange={(e) => {
                      const newSegments = [...editingSegments];
                      newSegments[index].label = e.target.value;
                      setEditingSegments(newSegments);
                    }}
                    className="flex-1 px-2 py-1 border rounded"
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    value={segment.value}
                    onChange={(e) => {
                      const newSegments = [...editingSegments];
                      newSegments[index].value = e.target.value;
                      setEditingSegments(newSegments);
                    }}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="Value"
                  />
                  <input
                    type="color"
                    value={segment.color}
                    onChange={(e) => {
                      const newSegments = [...editingSegments];
                      newSegments[index].color = e.target.value;
                      setEditingSegments(newSegments);
                    }}
                    className="w-10 h-10 rounded"
                  />
                  <input
                    type="text"
                    value={segment.icon}
                    onChange={(e) => {
                      const newSegments = [...editingSegments];
                      newSegments[index].icon = e.target.value;
                      setEditingSegments(newSegments);
                    }}
                    className="w-12 px-2 py-1 border rounded"
                    placeholder="Icon"
                  />
                  <input
                    type="number"
                    value={segment.probability}
                    onChange={(e) => {
                      const newSegments = [...editingSegments];
                      newSegments[index].probability = parseInt(e.target.value);
                      setEditingSegments(newSegments);
                    }}
                    className="w-16 px-2 py-1 border rounded"
                    placeholder="Prob %"
                    min="0"
                    max="100"
                  />
                  <button
                    onClick={() => {
                      const newSegments = editingSegments.filter((_, i) => i !== index);
                      setEditingSegments(newSegments);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => {
                  setEditingSegments([
                    ...editingSegments,
                    { label: 'NEW PRIZE', value: 10, color: '#FF6B6B', icon: '🎁', probability: 10 }
                  ]);
                }}
                className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400"
              >
                + Add Prize
              </button>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={savePrizes}>
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};

export default AnimatedSpinWheel;