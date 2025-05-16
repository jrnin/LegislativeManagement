import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface LiftCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
  hoverShadow?: string;
  duration?: number;
  onClick?: () => void;
}

export const LiftCard = ({
  children,
  className,
  hoverScale = 1.03,
  hoverShadow = 'lg',
  duration = 300,
  onClick
}: LiftCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Classes de sombra baseadas na prop hoverShadow
  const shadowClasses = {
    'sm': 'shadow-sm hover:shadow-md',
    'md': 'shadow-md hover:shadow-lg',
    'lg': 'shadow-md hover:shadow-xl',
    'xl': 'shadow-lg hover:shadow-2xl'
  };
  
  const shadowClass = shadowClasses[hoverShadow as keyof typeof shadowClasses] || 
                      'shadow-md hover:shadow-lg';
  
  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden bg-white transition-all',
        shadowClass,
        `duration-${duration}`,
        className
      )}
      style={{
        transform: isHovered ? `scale(${hoverScale})` : 'scale(1)',
        transition: `transform ${duration}ms ease, box-shadow ${duration}ms ease`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};