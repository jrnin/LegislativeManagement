import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronDown, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Zap,
  Cloud,
  CloudRain,
  CloudSun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [weather] = useState({
    temp: 27,
    condition: 'Parcialmente nublado',
    icon: CloudSun
  });

  // Opções para configurações de acessibilidade
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const increaseFontSize = () => {
    if (fontSize < 24) {
      setFontSize(fontSize + 2);
      document.documentElement.style.fontSize = `${fontSize + 2}px`;
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize(fontSize - 2);
      document.documentElement.style.fontSize = `${fontSize - 2}px`;
    }
  };

  const resetFontSize = () => {
    setFontSize(16);
    document.documentElement.style.fontSize = '16px';
  };

  // Links do menu principal
  const mainMenuLinks = [
    { name: 'Home', href: '/public' },
    { name: 'Vereadores', href: '/public/vereadores' },
    { name: 'Documentos', href: '/public/documentos' },
    { name: 'Atividades Legislativas', href: '/public/atividades' },
    { name: 'Transparência', href: '/public/transparencia' },
    { name: 'Notícias', href: '/public/noticias' },
    { name: 'Contato', href: '/public/contato' },
  ];

  // Serviços de acesso rápido
  const quickServices = [
    { name: 'Sessões', href: '/public/sessoes', icon: Zap },
    { name: 'Atas', href: '/public/atas', icon: Zap },
    { name: 'Transparência', href: '/public/transparencia', icon: Zap },
    { name: 'Licitações', href: '/public/licitacoes', icon: Zap },
    { name: 'Contratos', href: '/public/contratos', icon: Zap },
    { name: 'Documentos', href: '/public/documentos', icon: Zap },
    { name: 'Relatórios', href: '/public/relatorios', icon: Zap },
    { name: 'Audiências', href: '/public/audiencias', icon: Zap },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-white'}`}>
      <Helmet>
        <title>Sistema Legislativo - Portal Público</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Top bar com opções de acessibilidade e redes sociais */}
      <div className="w-full py-2 px-4 bg-blue-800 text-white text-sm">
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-2 font-medium">Acessibilidade:</span>
              <button 
                onClick={toggleDarkMode} 
                className="p-1 rounded-md hover:bg-blue-700" 
                aria-label={isDarkMode ? "Modo claro" : "Modo escuro"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={increaseFontSize} 
                className="p-1 rounded-md hover:bg-blue-700 text-xs" 
                aria-label="Aumentar fonte"
              >
                A+
              </button>
              <button 
                onClick={decreaseFontSize} 
                className="p-1 rounded-md hover:bg-blue-700 text-xs" 
                aria-label="Diminuir fonte"
              >
                A-
              </button>
              <button 
                onClick={resetFontSize} 
                className="p-1 rounded-md hover:bg-blue-700 text-xs" 
                aria-label="Resetar fonte"
              >
                A
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <div className="flex items-center space-x-2">
              <weather.icon size={16} />
              <span>{weather.temp}°C</span>
              <span className="hidden sm:inline">{weather.condition}</span>
            </div>
            <div className="flex items-center space-x-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Youtube">
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <header className={`w-full py-4 px-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow'}`}>
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/public">
              <a className="flex items-center space-x-2">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xl">
                  SL
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold">
                    <span className="text-blue-600">Sistema</span>
                    <span className={isDarkMode ? "text-gray-300" : "text-slate-700"}>Legislativo</span>
                  </h1>
                  <p className="text-xs text-gray-500">Portal Público</p>
                </div>
              </a>
            </Link>

            {/* Barra de pesquisa - visível apenas em telas médias ou maiores */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Pesquisar no site..."
                  className="pl-9 pr-4 rounded-full border-gray-300"
                />
              </div>
            </div>

            {/* Menu para desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {mainMenuLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === link.href 
                      ? 'bg-blue-600 text-white' 
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-slate-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                    {link.name}
                  </a>
                </Link>
              ))}
              
              <Link href="/login">
                <a className="ml-2">
                  <Button variant="outline" size="sm">Área Restrita</Button>
                </a>
              </Link>
            </nav>

            {/* Menu para dispositivos móveis */}
            <div className="lg:hidden flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Menu">
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={isDarkMode ? "bg-slate-800 text-white" : ""}>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center pb-4 border-b">
                      <div className="text-xl font-bold">Menu</div>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                          <X />
                        </Button>
                      </SheetClose>
                    </div>
                    
                    {/* Barra de pesquisa para mobile */}
                    <div className="py-4">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Pesquisar no site..."
                          className="pl-9 pr-4 rounded-full border-gray-300"
                        />
                      </div>
                    </div>
                    
                    <nav className="flex flex-col space-y-1 py-4">
                      {mainMenuLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <SheetClose asChild>
                            <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              location === link.href 
                                ? 'bg-blue-600 text-white' 
                                : isDarkMode 
                                  ? 'text-gray-300 hover:bg-slate-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}>
                              {link.name}
                            </a>
                          </SheetClose>
                        </Link>
                      ))}
                    </nav>
                    
                    <div className="mt-auto pt-4 border-t">
                      <Link href="/login">
                        <SheetClose asChild>
                          <a className="block">
                            <Button variant="default" size="sm" className="w-full">
                              Área Restrita
                            </Button>
                          </a>
                        </SheetClose>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className={`w-full py-8 px-4 mt-8 ${isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Sobre o Portal</h3>
              <p className="text-sm">
                O Portal Público do Sistema Legislativo é um canal de comunicação entre a Câmara Municipal e os cidadãos, oferecendo acesso a informações sobre as atividades legislativas, documentos oficiais e serviços.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
              <ul className="space-y-2 text-sm">
                {mainMenuLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <a className="hover:underline">{link.name}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <address className="not-italic text-sm">
                <p>Rua da Câmara, 123 - Centro</p>
                <p>CEP: 12345-678</p>
                <p>Telefone: (11) 2222-3333</p>
                <p>Email: contato@sistemalegislativo.gov.br</p>
              </address>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Sistema Legislativo. Todos os direitos reservados.</p>
            <p className="mt-2">
              <Link href="/public/privacidade">
                <a className="hover:underline">Política de Privacidade</a>
              </Link>
              {" | "}
              <Link href="/public/acessibilidade">
                <a className="hover:underline">Acessibilidade</a>
              </Link>
              {" | "}
              <Link href="/public/mapa-do-site">
                <a className="hover:underline">Mapa do Site</a>
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}