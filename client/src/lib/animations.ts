import { useRef, useState, useEffect } from 'react';

/**
 * Hook para detectar quando um elemento está visível na viewport
 */
export function useIsVisible(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
      return () => observer.unobserve(currentRef);
    }
    
    return undefined;
  }, [options]);

  return { ref, isVisible };
}

/**
 * Definições de animações para componentes
 */
export const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  },
  scale: {
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95, transition: { duration: 0.3 } }
  },
  pulse: {
    animate: { 
      scale: [1, 1.05, 1],
      transition: { duration: 1.5, repeat: Infinity }
    }
  },
  slideInBottom: {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  },
  popIn: {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    }
  },
  staggerChildren: {
    visible: { 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }
};