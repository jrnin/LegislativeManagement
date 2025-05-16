import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface HoverCard3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  border?: boolean;
}

const HoverCard3D = ({
  children,
  className,
  intensity = 10,
  glowColor = 'rgba(59, 130, 246, 0.5)', 
  border = false,
}: HoverCard3DProps) => {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Posição relativa do mouse dentro do elemento
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calcular rotação baseada na posição do mouse
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * intensity;
    const rotateX = ((centerY - y) / centerY) * intensity;
    
    // Aplicar transformação
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: 'transform 0.1s ease',
      boxShadow: `0 10px 30px -10px ${glowColor}`,
      border: border ? `1px solid ${glowColor}` : 'none'
    });
  };
  
  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 0.5s ease, box-shadow 0.5s ease',
      boxShadow: 'none',
      border: 'none'
    });
  };
  
  return (
    <div 
      ref={cardRef}
      className={cn('transition-all duration-300', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
    >
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </div>
  );
};

export { HoverCard3D };