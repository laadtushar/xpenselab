'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessCheckmarkProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onAnimationComplete?: () => void;
}

export function SuccessCheckmark({
  show,
  size = 'md',
  className,
  onAnimationComplete,
}: SuccessCheckmarkProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Trigger animation after a brief delay
      setTimeout(() => setIsAnimating(true), 10);
      
      // Call completion callback after animation
      if (onAnimationComplete) {
        setTimeout(() => {
          onAnimationComplete();
        }, 600);
      }
    } else {
      setIsVisible(false);
      setIsAnimating(false);
    }
  }, [show, onAnimationComplete]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-green-500 text-white',
        sizeClasses[size],
        isAnimating && 'animate-in zoom-in-50 duration-300',
        className
      )}
    >
      <Check
        className={cn(
          sizeClasses[size],
          isAnimating && 'animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-150'
        )}
        strokeWidth={3}
      />
    </div>
  );
}
