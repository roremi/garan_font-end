'use client';
import './SpinReward.css';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface SpinItem {
  label: string;
  value: number;
  probability: number;
  rotations?: number;
}

interface SpinWheelProps {
  onComplete?: (result: SpinItem) => void;
}

export default function SpinWheel({ onComplete }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinItem | null>(null);
  const [rotation, setRotation] = useState(0);
  const [items, setItems] = useState<SpinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  useEffect(() => {
    audioRef.current = new Audio('/5ae9s.mp3');
    audioRef.current.loop = false;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const generateRotations = (value: number) => {
    const minVal = 10, maxVal = 200, minR = 5, maxR = 15;
    const normalized = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));
    return Math.round(minR + (maxR - minR) * normalized);
  };

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const data = await api.getSpinRewards();
        const mappedItems = data.map((item: any) => ({
          label: item.name,
          value: item.value,
          probability: item.probability,
          rotations: generateRotations(item.value),
        }));
        setItems(mappedItems);
      } catch (error) {
        console.error('Error fetching spin rewards:', error);
        setItems([
          { label: '50 GP', value: 50, probability: 20, rotations: 7 },
          { label: '100 GP', value: 100, probability: 15, rotations: 10 },
          { label: '10 GP', value: 10, probability: 30, rotations: 5 },
          { label: '150 GP', value: 150, probability: 10, rotations: 12 },
          { label: '200 GP', value: 200, probability: 5, rotations: 15 },
          { label: 'Try Again', value: 0, probability: 20, rotations: 6 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRewards();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const anglePerItem = (2 * Math.PI) / items.length;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    items.forEach((item, index) => {
      const startAngle = index * anglePerItem;
      const endAngle = (index + 1) * anglePerItem;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = ['#FF4500', '#FFD700', '#FF4500', '#FFD700', '#FF4500', '#FFD700'][index % 6];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + anglePerItem / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(item.label, radius / 2, 5);
      ctx.restore();
    });

    ctx.restore();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0000FF';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 30);
    ctx.lineTo(centerX - 15, centerY - radius - 10);
    ctx.lineTo(centerX + 15, centerY - radius - 10);
    ctx.closePath();
    ctx.fillStyle = '#0000FF';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QUAY', centerX, centerY);
  }, [items, rotation]);

  const spinWheel = async () => {
    if (spinning || items.length === 0 || !userId) return;

    try {
      setSpinning(true);
      setResult(null);

      const updated = await api.useSpin(userId);
      audioRef.current?.play().catch(console.error);

      const totalProbability = items.reduce((sum, item) => sum + item.probability, 0);
      let random = Math.random() * totalProbability;
      let selectedIndex = 0;
      for (let i = 0; i < items.length; i++) {
        random -= items[i].probability;
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      const selectedItem = items[selectedIndex];
      const anglePerItem = (2 * Math.PI) / items.length;
      const targetAngle = -((selectedIndex + 0.5) * anglePerItem + Math.PI / 2);
      const rotations = selectedItem.rotations ?? 10;
      const finalRotation = rotations * 2 * Math.PI + targetAngle;

      const startTime = performance.now();
      const duration = 10000;
      const initialRotation = rotation;

      const animate = async (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = initialRotation + (finalRotation - initialRotation) * eased;
        setRotation(current % (2 * Math.PI));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setResult(selectedItem);

          if (selectedItem.value > 0) {
            try {
              await api.addPoints(userId, selectedItem.value);
            } catch (err) {
              console.error('Lỗi cộng điểm sau quay:', err);
            }
          }

          onComplete?.(selectedItem);
        }
      };

      requestAnimationFrame(animate);
    } catch (err) {
      console.error('Lỗi khi sử dụng lượt quay:', err);
      alert('Không thể quay! Có thể bạn đã hết lượt quay.');
      setSpinning(false);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (spinning || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const buttonRadius = 50;
    const distance = Math.sqrt((clickX - centerX) ** 2 + (clickY - centerY) ** 2);
    if (distance <= buttonRadius) {
      spinWheel();
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header /> {/* ✅ Thêm Header */}

      <main className="flex-grow flex flex-col items-center justify-center py-12">
        <h1 className="spin-wheel-heading">
          Quay là trúng – Đặt gà hôm nay, rinh GiftPoint liền tay!
        </h1>
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onClick={handleCanvasClick}
          className={`spin-wheel-canvas ${spinning ? 'spinning' : ''}`}
        />
        {result && (
          <div className="spin-wheel-result">
            🎉 Chúc Mừng Bạn Đã Nhận: <strong>{result.label}</strong>
          </div>
        )}
      </main>

      <Footer /> {/* ✅ Thêm Footer */}
    </div>
  );
}
