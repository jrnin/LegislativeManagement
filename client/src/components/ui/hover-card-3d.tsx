import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HoverCard3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  border?: boolean;
}

export function HoverCard3D({
  children,
  className,
  intensity = 15,
  glowColor = 'rgba(103, 232, 249, 0.3)',
  border = true
}: HoverCard3DProps) {
  const [transform, setTransform] = useState('');
  const [boxShadow, setBoxShadow] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate the mouse position relative to the center of the card
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Calculate rotation based on mouse position
    const rotateX = (-y / rect.height * intensity).toFixed(2);
    const rotateY = (x / rect.width * intensity).toFixed(2);
    
    // Apply the transformation
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    
    // Calculate glow strength
    const distance = Math.sqrt(x*x + y*y);
    const maxDistance = Math.sqrt(Math.pow(rect.width/2, 2) + Math.pow(rect.height/2, 2));
    const glowStrength = 1 - distance / maxDistance;
    
    // Apply glow effect
    setBoxShadow(`0 10px 30px -10px ${glowColor}`);
  };
  
  const handleMouseLeave = () => {
    // Reset the card when mouse leaves
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
    setBoxShadow('none');
  };
  
  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-white rounded-lg overflow-hidden transition-all duration-200 ease-out',
        border && 'border border-blue-100',
        className
      )}
      style={{
        transform,
        boxShadow,
        transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}