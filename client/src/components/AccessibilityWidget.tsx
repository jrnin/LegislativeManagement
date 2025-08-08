import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accessibility, 
  Eye, 
  EyeOff, 
  Minus, 
  Plus, 
  Type, 
  Contrast,
  Volume2,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface AccessibilityState {
  highContrast: boolean;
  darkMode: boolean;
  fontSize: number;
  textSpacing: boolean;
  readingMode: boolean;
  soundEnabled: boolean;
}

export function AccessibilityWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [accessibility, setAccessibility] = useState<AccessibilityState>({
    highContrast: false,
    darkMode: false,
    fontSize: 16,
    textSpacing: false,
    readingMode: false,
    soundEnabled: true,
  });

  // Load accessibility preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      const parsedState = JSON.parse(saved);
      setAccessibility(parsedState);
      applyAccessibilitySettings(parsedState);
    }
  }, []);

  // Save accessibility preferences to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-preferences', JSON.stringify(accessibility));
    applyAccessibilitySettings(accessibility);
  }, [accessibility]);

  const applyAccessibilitySettings = (settings: AccessibilityState) => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font size
    root.style.fontSize = `${settings.fontSize}px`;

    // Text spacing
    if (settings.textSpacing) {
      root.classList.add('accessibility-text-spacing');
    } else {
      root.classList.remove('accessibility-text-spacing');
    }

    // Reading mode
    if (settings.readingMode) {
      root.classList.add('accessibility-reading-mode');
    } else {
      root.classList.remove('accessibility-reading-mode');
    }
  };

  const toggleSetting = (setting: keyof AccessibilityState) => {
    if (setting === 'fontSize') return; // Font size handled separately
    
    setAccessibility(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const adjustFontSize = (increment: boolean) => {
    setAccessibility(prev => ({
      ...prev,
      fontSize: increment 
        ? Math.min(prev.fontSize + 2, 24) 
        : Math.max(prev.fontSize - 2, 12)
    }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilityState = {
      highContrast: false,
      darkMode: false,
      fontSize: 16,
      textSpacing: false,
      readingMode: false,
      soundEnabled: true,
    };
    setAccessibility(defaultSettings);
  };

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      {/* Main accessibility button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-12 h-12 rounded-full bg-green-800 hover:bg-green-700 text-white shadow-lg transition-all duration-300 mb-2"
        aria-label="Opções de Acessibilidade"
      >
        <Accessibility size={20} />
      </Button>

      {/* Expanded widget */}
      {isExpanded && (
        <Card className="w-72 shadow-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Accessibility size={18} />
                Acessibilidade
              </h3>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-3">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contrast size={16} />
                  <span className="text-sm">Alto Contraste</span>
                </div>
                <Button
                  onClick={() => toggleSetting('highContrast')}
                  variant={accessibility.highContrast ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {accessibility.highContrast ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {accessibility.darkMode ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="text-sm">Modo Escuro</span>
                </div>
                <Button
                  onClick={() => toggleSetting('darkMode')}
                  variant={accessibility.darkMode ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {accessibility.darkMode ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  <span className="text-sm">Tamanho da Fonte</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => adjustFontSize(false)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={accessibility.fontSize <= 12}
                  >
                    <Minus size={12} />
                  </Button>
                  <span className="text-sm w-8 text-center">{accessibility.fontSize}</span>
                  <Button
                    onClick={() => adjustFontSize(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={accessibility.fontSize >= 24}
                  >
                    <Plus size={12} />
                  </Button>
                </div>
              </div>

              {/* Text Spacing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  <span className="text-sm">Espaçamento do Texto</span>
                </div>
                <Button
                  onClick={() => toggleSetting('textSpacing')}
                  variant={accessibility.textSpacing ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {accessibility.textSpacing ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {/* Reading Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span className="text-sm">Modo Leitura</span>
                </div>
                <Button
                  onClick={() => toggleSetting('readingMode')}
                  variant={accessibility.readingMode ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {accessibility.readingMode ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} />
                  <span className="text-sm">Sons</span>
                </div>
                <Button
                  onClick={() => toggleSetting('soundEnabled')}
                  variant={accessibility.soundEnabled ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                >
                  {accessibility.soundEnabled ? 'Ativado' : 'Desativado'}
                </Button>
              </div>

              {/* Reset Button */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button
                  onClick={resetSettings}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Redefinir Configurações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}