import { useEffect, useState } from 'react';

// Declaração de tipos para o VLibras
declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string, options?: any) => any;
    };
  }
}

export function VLibras() {
  const [isVLibrasLoaded, setIsVLibrasLoaded] = useState(false);

  useEffect(() => {
    // Aguarda o carregamento do VLibras
    const checkVLibras = setInterval(() => {
      if (window.VLibras) {
        setIsVLibrasLoaded(true);
        clearInterval(checkVLibras);
      }
    }, 500);

    // Cleanup
    return () => clearInterval(checkVLibras);
  }, []);

  // Retorna null - o VLibras é gerenciado pelo HTML
  return null;
}

export default VLibras;