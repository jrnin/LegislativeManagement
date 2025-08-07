import { useEffect } from 'react';

// Declaração de tipos para o VLibras
declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string, options?: any) => any;
    };
  }
}

export function VLibras() {
  useEffect(() => {
    // Função para inicializar o VLibras
    const initializeVLibras = () => {
      try {
        if (window.VLibras) {
          // Se já existe, não precisa recriar
          return;
        }

        // Carregar script do VLibras se não estiver presente
        const existingScript = document.querySelector('script[src*="vlibras-plugin.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
          script.onload = () => {
            if (window.VLibras) {
              new window.VLibras.Widget('https://vlibras.gov.br/app');
            }
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.warn('Erro ao inicializar VLibras:', error);
      }
    };

    // Tentar inicializar imediatamente
    initializeVLibras();

    // Se não funcionou, tentar novamente após um delay
    const timeout = setTimeout(() => {
      if (window.VLibras) {
        try {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        } catch (error) {
          console.warn('Erro ao reinicializar VLibras:', error);
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Retorna null - o VLibras é gerenciado pelo HTML
  return null;
}

export default VLibras;