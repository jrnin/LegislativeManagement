import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]); // Re-run effect if breakpoint changes

  return isMobile;
}

export function useIsTablet(minBreakpoint: number = 768, maxBreakpoint: number = 1024): boolean {
  const [isTablet, setIsTablet] = useState<boolean>(
    window.innerWidth >= minBreakpoint && window.innerWidth < maxBreakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= minBreakpoint && window.innerWidth < maxBreakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [minBreakpoint, maxBreakpoint]); // Re-run effect if breakpoints change

  return isTablet;
}

export function useDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const isMobile = useIsMobile(768);
  const isTablet = useIsTablet(768, 1024);
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}