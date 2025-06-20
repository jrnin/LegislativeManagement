import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Accessibility, Volume2, VolumeX } from 'lucide-react';

// Declaração de tipos para o VLibras
declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string, options?: any) => any;
    };
  }
}

interface VLibrasProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showControls?: boolean;
}

export function VLibras({ position = 'bottom-right', showControls = true }: VLibrasProps) {
  const [isVLibrasLoaded, setIsVLibrasLoaded] = useState(false);
  const [isVLibrasVisible, setIsVLibrasVisible] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    // Verifica se o VLibras já está carregado
    if (window.VLibras) {
      setIsVLibrasLoaded(true);
      return;
    }

    // Aguarda o carregamento do VLibras
    const checkVLibras = setInterval(() => {
      if (window.VLibras) {
        setIsVLibrasLoaded(true);
        clearInterval(checkVLibras);
      }
    }, 100);

    return () => clearInterval(checkVLibras);
  }, []);

  const toggleVLibrasVisibility = () => {
    const vLibrasElement = document.querySelector('[vw-plugin]') as HTMLElement;
    if (vLibrasElement) {
      if (isVLibrasVisible) {
        vLibrasElement.style.display = 'none';
      } else {
        vLibrasElement.style.display = 'block';
      }
      setIsVLibrasVisible(!isVLibrasVisible);
    }
  };

  const toggleAudio = () => {
    // Tenta controlar o áudio do VLibras se possível
    const vLibrasIframe = document.querySelector('[vw-plugin] iframe') as HTMLIFrameElement;
    if (vLibrasIframe && vLibrasIframe.contentWindow) {
      try {
        // Envia mensagem para o iframe do VLibras para controlar áudio
        vLibrasIframe.contentWindow.postMessage({
          action: isAudioEnabled ? 'mute' : 'unmute'
        }, '*');
      } catch (error) {
        console.log('Controle de áudio não disponível');
      }
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2`}>
      {/* Controles de Acessibilidade */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVLibrasVisibility}
            className="flex items-center gap-2 text-sm"
            title={isVLibrasVisible ? 'Ocultar VLibras' : 'Mostrar VLibras'}
          >
            <Accessibility className="h-4 w-4" />
            <span className="text-xs">
              {isVLibrasVisible ? 'Ocultar' : 'Mostrar'} Libras
            </span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className="flex items-center gap-2 text-sm"
            title={isAudioEnabled ? 'Desativar áudio' : 'Ativar áudio'}
          >
            {isAudioEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            <span className="text-xs">
              {isAudioEnabled ? 'Sem áudio' : 'Com áudio'}
            </span>
          </Button>
        </div>
      </div>
      
      {/* Indicador de status */}
      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded text-center">
        {isVLibrasLoaded ? 'VLibras Ativo' : 'Carregando...'}
      </div>
    </div>
  );
}

export default VLibras;