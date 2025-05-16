import React, { useState } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { HoverCard3D } from '@/components/ui/hover-card-3d';
import { animations } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedCouncilorCardProps {
  id: string;
  name: string;
  party: string;
  role: string;
  imageUrl?: string;
  className?: string;
}

const AnimatedCouncilorCard = ({
  id,
  name,
  party,
  role,
  imageUrl,
  className
}: AnimatedCouncilorCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Função para obter iniciais a partir do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  return (
    <HoverCard3D 
      className={cn(
        "bg-white rounded-xl shadow-md overflow-hidden border border-transparent",
        isHovered && "border-blue-200",
        className
      )}
      intensity={5}
      glowColor="rgba(59, 130, 246, 0.2)"
    >
      <Link href={`/public/vereadores/${id}`}>
        <a className="block">
          <div 
            className="flex flex-col items-center pt-6 pb-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Imagem ou iniciais com efeito de animação no hover */}
            <div className={cn(
              "w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-blue-100",
              "transition-all duration-500",
              isHovered && "border-blue-300 scale-105"
            )}>
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={name} 
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-500",
                    isHovered && "scale-110"
                  )}
                />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold",
                  isHovered && animations.pulse
                )}>
                  {getInitials(name)}
                </div>
              )}
            </div>
            
            {/* Nome com efeito de destaque no hover */}
            <h3 className={cn(
              "font-semibold text-lg text-gray-800 transition-colors duration-300",
              isHovered && "text-blue-600"
            )}>
              {name}
            </h3>
            
            {/* Partido com efeito de animação no hover */}
            <p className={cn(
              "text-blue-600 text-sm mb-1 transition-all duration-300",
              isHovered && "font-medium"
            )}>
              {party}
            </p>
            
            {/* Badge com animação */}
            <Badge 
              variant="outline" 
              className={cn(
                "bg-blue-50 transition-all duration-300",
                isHovered && "bg-blue-100 translate-y-1"
              )}
            >
              {role}
            </Badge>
            
            {/* Botão "Ver perfil" que aparece no hover */}
            <div className={cn(
              "mt-3 h-0 overflow-hidden opacity-0 transition-all duration-300",
              isHovered && "h-8 opacity-100"
            )}>
              <span className="text-sm text-blue-600 hover:underline flex items-center">
                Ver perfil completo
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </a>
      </Link>
    </HoverCard3D>
  );
};

export { AnimatedCouncilorCard };