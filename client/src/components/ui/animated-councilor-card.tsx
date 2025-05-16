import React, { useState } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AnimatedCouncilorCardProps {
  id: string;
  name: string;
  party: string;
  role: string;
  imageUrl?: string;
  className?: string;
}

export function AnimatedCouncilorCard({
  id,
  name,
  party,
  role,
  imageUrl,
  className
}: AnimatedCouncilorCardProps) {
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
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden transition-all duration-300",
        isHovered ? "shadow-lg transform -translate-y-2" : "shadow-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/public/vereadores/${id}`}>
        <div className="block">
          <Card className={cn(
            "text-center border-0 h-full transition-colors duration-300",
            isHovered ? "bg-gradient-to-b from-white to-blue-50" : "bg-white"
          )}>
            <div className="flex flex-col items-center pt-6 pb-4">
              {/* Avatar com animação */}
              <div className={cn(
                "mb-4 transition-all duration-300",
                isHovered ? "scale-105" : ""
              )}>
                <Avatar className={cn(
                  "h-24 w-24 transition-all duration-300",
                  isHovered ? "border-4 border-blue-300 shadow-lg" : "border-4 border-blue-100"
                )}>
                  <AvatarImage 
                    src={imageUrl} 
                    className={cn(
                      "transition-transform duration-500",
                      isHovered ? "scale-110" : ""
                    )}
                  />
                  <AvatarFallback 
                    className={cn(
                      "bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg transition-all duration-300",
                      isHovered ? "animate-pulse" : ""
                    )}
                  >
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Nome com animação */}
              <h3 className={cn(
                "font-semibold text-lg transition-colors duration-300",
                isHovered ? "text-blue-600" : "text-gray-800"
              )}>
                {name}
              </h3>
              
              {/* Partido */}
              <p className={cn(
                "text-blue-600 text-sm mb-2 transition-all duration-300",
                isHovered ? "font-medium" : ""
              )}>
                {party}
              </p>
              
              {/* Badge com animação */}
              <Badge 
                variant="outline" 
                className={cn(
                  "transition-all duration-300",
                  isHovered ? "bg-blue-100 border-blue-300" : "bg-blue-50"
                )}
              >
                {role}
              </Badge>
              
              {/* Botão "Ver perfil" que aparece no hover */}
              <div className={cn(
                "mt-3 overflow-hidden transition-all duration-300 flex justify-center",
                isHovered ? "h-8 opacity-100" : "h-0 opacity-0"
              )}>
                <span className="text-sm text-blue-600 hover:underline flex items-center">
                  Ver perfil
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </Card>
        </div>
      </Link>
    </div>
  );
}