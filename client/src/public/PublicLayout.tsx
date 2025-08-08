import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import logoPath from '@assets/logo.png';
import { useQuery } from '@tanstack/react-query';
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
  CloudSun,
  Snowflake,
  Volume2,
  VolumeX,
  FileText,
  Calendar,
  Users,
  Building,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchButton from '@/components/search/SearchButton';
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
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuHidden, setIsMenuHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Buscar dados meteorológicos da API
  const { data: weather } = useQuery({
    queryKey: ['/api/weather/current'],
    refetchInterval: 10 * 60 * 1000, // Atualizar a cada 10 minutos
    staleTime: 5 * 60 * 1000, // Considerar stale após 5 minutos
  });

  // Buscar último evento cadastrado em tempo real
  const { data: latestEvent } = useQuery({
    queryKey: ['/api/public/events/latest'],
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
    staleTime: 15 * 1000, // Considerar stale após 15 segundos
  });

  // Mapear ícones do clima para componentes Lucide
  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return Sun;
      case 'cloud':
        return Cloud;
      case 'rain':
        return CloudRain;
      case 'cloud-sun':
        return CloudSun;
      case 'snow':
        return Snowflake;
      default:
        return Cloud;
    }
  };

  // Menu principal com submenus
  const mainMenuLinks = [
    { 
      name: 'Início', 
      href: '/public' 
    },
    { 
      name: 'Institucional', 
      href: '/institucional',
      submenu: [
        { name: 'História', href: '/institucional/historia' },
        { name: 'Estrutura Organizacional', href: '/institucional/estrutura' },
        { name: 'Mesa Diretora', href: '/mesa-diretora' },
        { name: 'Vereadores', href: '/vereadores' },
        { name: 'Comissões Permanentes', href: '/comissoes' },
        { name: 'Legislação Municipal', href: '/legislacao' },
        { name: 'Telefones e Contatos', href: '/contatos' }
      ]
    },
    { 
      name: 'Atividades Legislativas', 
      href: '/atividades-legislativas',
      submenu: [
        { name: 'Projetos de Lei', href: '/atividades-legislativas?tipo=Projeto de Lei' },
        { name: 'Projetos de Resolução', href: '/atividades-legislativas?tipo=Projeto de Resolução' },
        { name: 'Requerimentos', href: '/atividades-legislativas?tipo=Requerimento' },
        { name: 'Moções', href: '/atividades-legislativas?tipo=Moção' },
        { name: 'Indicações', href: '/atividades-legislativas?tipo=Indicação' },
        { name: 'Portarias', href: '/atividades-legislativas?tipo=Portaria' }
      ]
    },
    { 
      name: 'Eventos', 
      href: '/eventos' 
    },
    { 
      name: 'Documentos', 
      href: '/documentos' 
    },
    { 
      name: 'Notícias', 
      href: '/noticias' 
    },
    { 
      name: 'Transparência', 
      href: '/transparencia',
      submenu: [
        { name: 'Portal da Transparência', href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia', external: true },
        { name: 'Portal Nacional', href: 'https://www.portaltransparencia.gov.br', external: true },
        { name: 'Licitações e Contratos', href: '/licitacoes' },
        { name: 'Prestação de Contas', href: '/prestacao-contas' },
        { name: 'Folha de Pagamento', href: '/folha-pagamento' }
      ]
    },
    { 
      name: 'Serviços', 
      href: '/servicos',
      submenu: [
        { name: 'Solicitar Audiência', href: '/solicitar-audiencia' },
        { name: 'Ouvidoria', href: '/ouvidoria' },
        { name: 'Protocolo Online', href: '/protocolo' },
        { name: 'Central de Downloads', href: '/downloads' }
      ]
    }
  ];

  // Serviços de acesso rápido
  const quickServices = [
    { name: 'Protocolo Online', href: '/protocolo', icon: FileText },
    { name: 'Agenda de Eventos', href: '/eventos', icon: Calendar },
    { name: 'Fale Conosco', href: '/contatos', icon: Phone },
    { name: 'Ouvidoria', href: '/ouvidoria', icon: Users },
    { name: 'Mesa Diretora', href: '/mesa-diretora', icon: Building },
    { name: 'Atividades Legislativas', href: '/atividades-legislativas', icon: FileText }
  ];

  // Controle de scroll para mostrar/esconder menu
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Auto-hide menu após 300px de scroll para baixo
      if (currentScrollY > 300 && currentScrollY > lastScrollY) {
        setIsMenuHidden(true);
      } else {
        setIsMenuHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Aplicar modo escuro
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Aplicar alto contraste
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  // Aplicar tamanho da fonte
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleHighContrast = () => setIsHighContrast(!isHighContrast);
  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));
  const resetFontSize = () => setFontSize(16);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''} ${isHighContrast ? 'high-contrast' : ''}`}>
      <Helmet>
        <title>Câmara Municipal de Jaíba - Portal Público</title>
        <meta name="description" content="Portal oficial da Câmara Municipal de Jaíba - Acompanhe as atividades legislativas, eventos, notícias e documentos oficiais." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      {/* Barra de acessibilidade */}
      <div className={`w-full py-2 px-4 text-xs ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleDarkMode} 
              className="flex items-center space-x-1 hover:opacity-80"
              aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button 
              onClick={toggleHighContrast} 
              className="hover:opacity-80"
              aria-label={isHighContrast ? "Desativar alto contraste" : "Ativar alto contraste"}
            >
              {isHighContrast ? 'Contraste Normal' : 'Alto Contraste'}
            </button>
            <div className="flex items-center space-x-1">
              <button 
                onClick={increaseFontSize} 
                className="p-1 rounded-md hover:opacity-80 text-xs" 
                style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
                aria-label="Aumentar fonte"
              >
                Fonte maior
              </button>
              <button 
                onClick={decreaseFontSize} 
                className="p-1 rounded-md hover:opacity-80 text-xs" 
                style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
                aria-label="Diminuir fonte"
              >
                Fonte menor
              </button>
              <button 
                onClick={resetFontSize} 
                className="p-1 rounded-md hover:opacity-80 text-xs" 
                style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
                aria-label="Resetar fonte"
              >
                Fonte normal
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <div className="flex items-center space-x-2">
              {weather && typeof weather === 'object' && 'temperature' in weather ? (
                <>
                  {React.createElement(getWeatherIcon((weather as any).icon || 'cloud'), { size: 16 })}
                  <span>{(weather as any).temperature}°C</span>
                  <span className="hidden sm:inline">{(weather as any).weatherDescription || ''}</span>
                </>
              ) : (
                <>
                  <Cloud size={16} />
                  <span>--°C</span>
                  <span className="hidden sm:inline">Carregando...</span>
                </>
              )}
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
      
      {/* Header principal com vídeo de background */}
      <div className="relative">
        {/* Header/Navbar com efeito glass */}
        <header 
          className={`w-full py-4 px-4 z-30 ${
            isScrolled 
              ? 'fixed top-0 left-0 right-0 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 shadow-lg transition-all duration-300 ease-in-out' 
              : location === '/public' 
                ? 'absolute top-0 left-0 right-0 backdrop-blur-md bg-transparent'
                : `relative ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow'}`
          }`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center">
              
              {/* Logo */}
              <Link href="/">
                <button className="flex items-center space-x-3">
                  <img 
                    src={logoPath} 
                    alt="Câmara Municipal de Jaíba" 
                    className="h-20 w-20 object-contain"
                  />
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold">
                      <span style={{color: '#253529'}}>Câmara Municipal de Jaíba</span>
                    </h1>                    
                    <p className={`text-xs ${
                      location === '/public' && !isScrolled 
                        ? 'text-blue-100' 
                        : 'text-gray-500'
                    }`}>Portal Público</p>
                  </div>
                </button>
              </Link>
              
              {/* Menu de navegação principal no header - desktop */}
              <div className="hidden lg:flex items-center space-x-2">
                {mainMenuLinks.map((link) => (
                  link.submenu ? (
                    <DropdownMenu key={link.name}>
                      <DropdownMenuTrigger asChild>
                        <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer flex items-center ${
                          location === link.href 
                            ? 'bg-green-600 text-white shadow-lg' 
                            : location === '/public' && !isScrolled 
                              ? 'text-white hover:bg-white/20' 
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                        }`}>
                          {link.name}
                          <ChevronDown size={16} className="ml-1" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className={`${isDarkMode ? "bg-slate-800 text-white border-slate-700" : ""}`}>
                        {link.submenu.map((subItem) => (
                          subItem.external ? (
                            <DropdownMenuItem key={subItem.name} asChild>
                              <a 
                                href={subItem.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                              >
                                {subItem.name}
                              </a>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem key={subItem.name} asChild>
                              <Link href={subItem.href}>
                                <span className="cursor-pointer">{subItem.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link key={link.href} href={link.href}>
                      <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                        location === link.href 
                          ? 'bg-green-600 text-white shadow-lg' 
                          : location === '/public' && !isScrolled 
                            ? 'text-white hover:bg-white/20' 
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                      }`}>
                        {link.name}
                      </button>
                    </Link>
                  )
                ))}
              </div>

              {/* Menu hambúrguer para mobile */}
              <div className="lg:hidden flex items-center">
                <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Menu"
                    className={location === '/public' && !isScrolled ? "text-white hover:bg-white/20" : ""}
                  >
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

                    {/* Menu de navegação */}
                    <nav className="flex flex-col space-y-1 py-4">
                      {mainMenuLinks.map((link) => (
                        link.submenu ? (
                          <div key={link.name} className="space-y-1">
                            <Link href={link.href}>
                              <SheetClose asChild>
                                <button className={`px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                                  location === link.href 
                                    ? 'text-white' 
                                    : isDarkMode 
                                      ? 'text-gray-300 hover:bg-slate-700 hover:text-white' 
                                      : 'text-gray-700 hover:bg-gray-100'
                                }`} style={location === link.href ? {backgroundColor: '#48654e'} : {}}>
                                  {link.name}
                                </button>
                              </SheetClose>
                            </Link>
                            <div className="pl-4 space-y-1">
                              {link.submenu.map((subItem) => (
                                subItem.external ? (
                                  <a 
                                    key={subItem.name}
                                    href={subItem.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer ${
                                      isDarkMode 
                                        ? 'text-gray-400 hover:bg-slate-700 hover:text-white' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {subItem.name}
                                  </a>
                                ) : (
                                  <Link key={subItem.name} href={subItem.href}>
                                    <SheetClose asChild>
                                      <button className={`block px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                                        isDarkMode 
                                          ? 'text-gray-400 hover:bg-slate-700 hover:text-white' 
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}>
                                        {subItem.name}
                                      </button>
                                    </SheetClose>
                                  </Link>
                                )
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Link key={link.href} href={link.href}>
                            <SheetClose asChild>
                              <button className={`px-3 py-2 rounded-[10px] text-sm font-medium transition-colors cursor-pointer w-full text-left ${
                                location === link.href 
                                  ? 'text-white' 
                                  : isDarkMode 
                                    ? 'text-gray-300 hover:bg-slate-700 hover:text-white' 
                                    : 'text-gray-700 hover:bg-gray-100'
                              }`} style={location === link.href ? {backgroundColor: '#48654e'} : {}}>
                                {link.name}
                              </button>
                            </SheetClose>
                          </Link>
                        )
                      ))}
                    </nav>
                  </div>
                </SheetContent>
                </Sheet>
              </div>

              {/* Menu hambúrguer secundário para desktop */}
              <div className="hidden lg:flex">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label="Menu Secundário"
                      className={`rounded-full p-2 transition-colors ${
                        location === '/public' && !isScrolled 
                          ? "text-white hover:bg-white/20" 
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Menu size={20} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className={`w-80 ${isDarkMode ? "bg-slate-800 text-white" : "bg-white"}`}>
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center pb-4 border-b">
                        <div className="text-xl font-bold">Menu Rápido</div>
                        <SheetClose asChild>
                          <Button variant="ghost" size="icon">
                            <X />
                          </Button>
                        </SheetClose>
                      </div>

                      {/* Serviços de acesso rápido */}
                      <div className="py-6">
                        <h3 className="font-semibold mb-4 text-lg">Acesso Rápido</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {quickServices.map((service) => (
                            <Link key={service.href} href={service.href}>
                              <SheetClose asChild>
                                <button className={`flex flex-col items-center p-4 rounded-lg border transition-colors w-full ${
                                  isDarkMode 
                                    ? 'border-slate-600 hover:bg-slate-700 text-gray-300' 
                                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}>
                                  <service.icon size={24} className="mb-2" />
                                  <span className="text-sm font-medium text-center">{service.name}</span>
                                </button>
                              </SheetClose>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Links úteis */}
                      <div className="py-4 border-t">
                        <h3 className="font-semibold mb-4 text-lg">Links Úteis</h3>
                        <div className="space-y-2">
                          <a 
                            href="https://cmjaiba.cidadesmg.com.br/portaltransparencia" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`block p-3 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'hover:bg-slate-700 text-gray-300' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            Portal da Transparência
                          </a>
                          <a 
                            href="https://cmjaiba.cidadesmg.com.br/webmail" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`block p-3 rounded-lg transition-colors ${
                              isDarkMode 
                                ? 'hover:bg-slate-700 text-gray-300' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            Webmail
                          </a>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
        
        {/* Barra de busca e último evento - fixos fora do header */}
        <div className={`fixed top-32 left-1/2 transform -translate-x-1/2 z-40 transition-transform duration-300 ease-in-out ${
          isMenuHidden ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'
        }`}>
          <div className="flex items-center space-x-4">
            {/* Componente Último Evento - fixo */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <Calendar size={14} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-green-800 dark:text-green-200">
                    Último Evento
                  </h3>
                  {latestEvent && typeof latestEvent === 'object' && 'title' in latestEvent ? (
                    <Link href="/eventos">
                      <div className="cursor-pointer group">
                        <p className="text-xs text-green-700 dark:text-green-300 group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors truncate max-w-40">
                          {(latestEvent as any).title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Carregando...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botão de busca - fixo */}
            <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50">
              <SearchButton />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full mt-8" style={{backgroundColor: '#1a3e1f'}}>
        {/* Header do Footer com ícone, redes sociais e botões */}
        <div className="w-full py-4 px-6 border-b border-green-700/30">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
            {/* Logo/Ícone da Câmara */}
            <div className="flex items-center space-x-3">              
              <div className="hidden sm:block">
                <h3 className="text-white font-bold text-lg">Poder Legislativo</h3>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="flex items-center space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                 className="text-white hover:text-green-300 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                 className="text-white hover:text-green-300 transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                 className="text-white hover:text-green-300 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Informações de contato */}
        <div className="w-full py-6 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Endereço */}
            <div>
              <h4 className="text-white font-semibold mb-3">Endereço</h4>
              <p className="text-green-100 text-sm">
                Rua Expedito Alves, 126<br />
                Centro - Jaíba/MG<br />
                CEP: 39564-000
              </p>
            </div>

            {/* Contato */}
            <div>
              <h4 className="text-white font-semibold mb-3">Contato</h4>
              <p className="text-green-100 text-sm">
                Telefone: (38) 3625-1244<br />
                WhatsApp: (38) 9 9999-9999<br />
                E-mail: contato@jaiba.mg.leg.br
              </p>
            </div>

            {/* Horário de Funcionamento */}
            <div>
              <h4 className="text-white font-semibold mb-3">Funcionamento</h4>
              <p className="text-green-100 text-sm">
                Segunda a Sexta<br />
                das 07:00 às 17:00<br />
                Exceto feriados
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé Final */}
        <div className="w-full py-4 px-6 border-t border-green-700/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white text-sm">&copy; 2025 - Câmara Municipal de Jaíba - Todos os direitos reservados</p>
              <div className="flex items-center space-x-4 mt-2 md:mt-0">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                   className="text-white hover:text-green-300 transition-colors" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
                   className="text-white hover:text-green-300 transition-colors" aria-label="YouTube">
                  <Youtube size={16} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" 
                   className="text-white hover:text-green-300 transition-colors" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <span className="text-white text-xs">HubPúblico</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}