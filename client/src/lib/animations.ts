import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useEffect, useState, RefObject } from 'react';

/**
 * Combina classes Tailwind de forma eficiente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Animações para elementos UI
 */
export const animations = {
  // Botões
  buttonTap: "active:scale-95 transition-transform",
  buttonHover: "hover:scale-105 transition-all",
  buttonPulse: "hover:animate-pulse",
  
  // Cards
  cardHover: "hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
  cardTilt: "hover:rotate-1 transition-transform",
  cardPop: "hover:scale-[1.02] transition-all",
  
  // Elementos de página
  fadeIn: "animate-fadeIn",
  slideIn: "animate-slideIn",
  float: "animate-float",
  bounce: "animate-bounce",
  pulse: "animate-pulse",
  
  // Efeitos de texto
  textShimmer: "animate-shimmer bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%]",
  textGlow: "animate-glow",
  
  // Classes de efeitos
  ripple: "ripple",
  glass: "glass",
  hoverLift: "hover-lift",
  hoverExpand: "hover-expand",
};

/**
 * Tempo para aguardar uma animação
 */
export function delayAnimation(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Usar com useRef para identificar se um elemento está visível na tela
 */
export function useIsVisible(ref: RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    });
    
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);
  
  return isIntersecting;
}

/**
 * Cria um efeito de confete para celebrações
 */
export function triggerConfetti() {
  // Se tiver uma biblioteca de confete disponível, pode integrá-la aqui
  console.log('Confetti animation triggered');
}

/**
 * Cria um efeito de brilho para destacar elementos
 */
export function addGlowEffect(element: HTMLElement, color: string = 'rgba(59, 130, 246, 0.5)') {
  const originalBoxShadow = element.style.boxShadow;
  element.style.boxShadow = `0 0 15px ${color}`;
  
  setTimeout(() => {
    element.style.boxShadow = originalBoxShadow;
  }, 1000);
}

/**
 * Hook para adicionar sequência de animações a elementos
 */
export function useSequenceAnimation(refs: RefObject<HTMLElement>[], animationClass: string, delay: number = 100) {
  useEffect(() => {
    refs.forEach((ref, index) => {
      const element = ref.current;
      if (element) {
        setTimeout(() => {
          element.classList.add(animationClass);
        }, index * delay);
      }
    });
    
    return () => {
      refs.forEach(ref => {
        const element = ref.current;
        if (element) {
          element.classList.remove(animationClass);
        }
      });
    };
  }, [refs, animationClass, delay]);
}

/**
 * Cria ripple effect em elementos
 */
export function createRippleEffect(event: React.MouseEvent<HTMLElement>) {
  const button = event.currentTarget;
  
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.getBoundingClientRect().left - diameter / 2}px`;
  circle.style.top = `${event.clientY - button.getBoundingClientRect().top - diameter / 2}px`;
  circle.classList.add("ripple-effect");
  
  const ripple = button.querySelector(".ripple-effect");
  if (ripple) {
    ripple.remove();
  }
  
  button.appendChild(circle);
  
  setTimeout(() => {
    circle.remove();
  }, 600);
}