import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'border' | 'none';
  clickEffect?: 'press' | 'pulse' | 'none';
}

export function AnimatedCard({
  children,
  className,
  hoverEffect = 'lift',
  clickEffect = 'press'
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Define hover effects styles
  const hoverStyles = {
    lift: 'hover:shadow-lg hover:-translate-y-1',
    glow: 'hover:shadow-lg hover:shadow-blue-100',
    scale: 'hover:scale-[1.02]',
    border: 'hover:border-blue-400',
    none: ''
  };
  
  // Define click effects styles
  const clickStyles = {
    press: 'active:scale-[0.98]',
    pulse: 'active:animate-pulse',
    none: ''
  };
  
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 transition-all duration-300 ease-out',
        hoverStyles[hoverEffect],
        clickStyles[clickEffect],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </div>
  );
}