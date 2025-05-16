import React, { useState, useRef } from 'react';
import { animations } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  tiltEffect?: boolean;
  hoverLift?: boolean;
  popEffect?: boolean;
  glowEffect?: boolean;
  glowColor?: string;
}

const AnimatedCard = ({
  children,
  className,
  tiltEffect = false,
  hoverLift = true,
  popEffect = false,
  glowEffect = false,
  glowColor = 'rgba(59, 130, 246, 0.5)'
}: AnimatedCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Calcular a transformação para o efeito tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEffect || !cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    
    if (glowEffect && cardRef.current) {
      cardRef.current.style.boxShadow = `0 0 20px ${glowColor}`;
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    if (tiltEffect && cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    }
    
    if (glowEffect && cardRef.current) {
      cardRef.current.style.boxShadow = '';
    }
  };
  
  // Montar classes CSS baseadas nas props
  const cardClasses = cn(
    'transition-all duration-300',
    hoverLift && animations.hoverLift,
    popEffect && animations.cardPop,
    className
  );
  
  return (
    <div
      ref={cardRef}
      className={cardClasses}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

// Submódulo para separar o conteúdo do card da animação
AnimatedCard.Content = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return (
    <div 
      className={cn("w-full h-full", className)}
      style={{ transform: 'translateZ(20px)' }}
    >
      {children}
    </div>
  );
};

export { AnimatedCard };