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
import { AccessibilityWidget } from '@/components/AccessibilityWidget';
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


  // Mapear ícones do clima para componentes Lucide
  const getWeatherIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'sun': Sun,
      'cloud-sun': CloudSun,
      'cloud': Cloud,
      'cloud-drizzle': CloudRain,
      'cloud-rain': CloudRain,
      'snowflake': Snowflake,
      'zap': Zap
    };
    return iconMap[iconName] || Cloud;
  };
  
  // Detectar quando o usuário rola a página para aplicar o efeito do menu fixo e auto-hide
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determinar se rolou para baixo (>100px) para aplicar efeito glass
      if (currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      // Auto-hide do menu flutuante baseado na direção do scroll
      if (currentScrollY > 200) { // Só começar a esconder após 200px
        if (currentScrollY > lastScrollY && currentScrollY > 300) {
          // Rolando para baixo - esconder menu
          setIsMenuHidden(true);
        } else if (currentScrollY < lastScrollY) {
          // Rolando para cima - mostrar menu
          setIsMenuHidden(false);
        }
      } else {
        // No topo da página - sempre mostrar menu
        setIsMenuHidden(false);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Limpar o event listener quando o componente for desmontado
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Opções para configurações de acessibilidade
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleHighContrast = () => {
    const newHighContrast = !isHighContrast;
    setIsHighContrast(newHighContrast);
    if (newHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
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

  // Serviços de acesso rápido para o menu hambúrguer
  const quickServices = [
    { name: 'Documentos', href: '/documentos', icon: FileText },
    { name: 'Eventos', href: '/eventos', icon: Calendar },
    { name: 'Vereadores', href: '/vereadores', icon: Users },
    { name: 'Mesa Diretora', href: '/mesa-diretora', icon: Building },
    { name: 'Contato', href: '/contato', icon: Phone },
  ];

  // Links do menu principal
  const mainMenuLinks = [
    { name: 'Início', href: '/' },
    { name: 'Vereadores',
     href: '/vereadores',
    submenu: [
      { name: 'Mesa Diretora', href: '/mesa-diretora', external: false },
      { name: 'Comissões', href: '/comissoes', external: false },
      { name: 'Vereadores', href: '/vereadores?tipo=Vereador', external: false }
    ]},    
    { name: 
      'Atividades Legislativas',
      href: '/atividades',
    submenu: [
      {
        name: 'Indicações', 
        href: '/atividades?tipo=Indicação',
        external: false
      },
      {
        name: 'Requerimentos', 
        href: '/atividades?tipo=Requerimento',
        external: false
      },
      {
        name: 'Moção', 
        href: '/atividades?tipo=Moção',
        external: false
      },
      {
        name: 'Projeto de Lei', 
        href: '/atividades?tipo=Projeto%20de%20Lei',
        external: false
      },
      {
        name: 'Projeto de Resolução', 
        href: '/atividades?tipo=Projeto%20de%20Resolução',
        external: false
      },
      {
        name: 'Projeto de Emenda', 
        href: '/atividades?tipo=Projeto%20de%20Emenda',
        external: false
      },
      {
        name: 'Projeto de Decreto Legislativo', 
        href: '/atividades?tipo=Projeto%20de%20Decreto%20Legislativo',
        external: false
      },
      {
        name: 'Sessões Legislativas', 
        href: '/sessoes',
        external: false
      },
      {
        name: 'Documentos', 
        href: '/documentos',
        external: false
      },
      {
        name: 'Comissões', 
        href: '/comissoes',
        external: false
      }
    ]
    },
    { 
      name: 'Transparência', 
      href: '/transparencia',
      submenu: [
        { 
          name: 'Licitações', 
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/index.xhtml?pagina=Licita%C3%A7%C3%B5es,%20Contrata%C3%A7%C3%B5es%20e%20Compras',
          external: true
        },
        { 
          name: 'Diárias', 
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/execucaoOrcamentaria/diarias/diarias.xhtml',
          external: true
        },
        {
          name: 'Execução Orçamentária', 
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/index.xhtml?pagina=Execu%C3%A7%C3%A3o%20Or%C3%A7ament%C3%A1ria',
          external: true
        },
        { 
          name: 'Radar da Transparência', 
          href: 'https://radardatransparencia.atricon.org.br/',
          external: true
        },
        {
          name: 'Estrutura Organizacional',
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/estruturaOrganizacional/estruturaOrganizacional.xhtml',
          external: true
        },
        {
          name: 'Prestação de Contas',
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/prestacaoDeContas/prestacaoDeContas.xhtml',
          external: true
        },
        { 
          name: 'Recursos Humanos', 
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/recursosHumanos/recursosHumanos.xhtml',
          external: true
        },
        {
          name: 'Perguntas e Respostas',
          href: 'https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/perguntasERespostas/perguntasERespostas.xhtml',
          external: true
        }
      ]
    },
    { name: 'Notícias', href: '/noticias' },
    { name: 'Contato', href: '/contato'
    
    },
  ];



  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-white'} ${isHighContrast ? 'high-contrast' : ''}`}>
      <Helmet>
        <title>Sistema Legislativo - Portal Público</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Top bar com opções de acessibilidade e redes sociais */}
      <div className="w-full py-3 px-4 text-white text-sm" style={{backgroundColor: '#253529'}}>
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">         
                    
              
            </div>
            <button 
              onClick={resetFontSize} 
              className="p-1 rounded-md hover:opacity-80 text-xs" 
              style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
              aria-label="Resetar fonte"
            >Webmail            </button>
            <div className="flex-shrink-0">
              <SearchButton />
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
              
              {/* Lado direito: menu flutuante e hambúrguer */}
              <div className="flex items-center space-x-4">
                {/* Menu flutuante - visível em desktop */}
                <div className={`hidden lg:flex transition-transform duration-300 ease-in-out ${
                  isMenuHidden ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
                }`}>
                  <nav className="flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-lg rounded-full px-4 py-2 shadow-lg border border-gray-200/30 dark:bg-slate-800/95 dark:border-slate-700/30">
                      <div className="flex items-center space-x-1">
                        {mainMenuLinks.map((link) => (
                          link.submenu ? (
                            <DropdownMenu key={link.name}>
                              <DropdownMenuTrigger asChild>
                                <button className={`px-3 py-1.5 rounded-full text-xm font-medium transition-all duration-300 cursor-pointer flex items-center ${
                                  location === link.href 
                                    ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600 dark:text-gray-300 dark:hover:bg-slate-700'
                                }`}>
                                  {link.name}
                                  <ChevronDown size={12} className="ml-1" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className={`${isDarkMode ? "bg-slate-800 text-white border-slate-700" : "bg-white"} shadow-2xl border-0 rounded-xl p-2`}>
                                {link.submenu?.map((subItem) => (
                                  subItem.external ? (
                                    <DropdownMenuItem key={subItem.name} asChild>
                                      <a 
                                        href={subItem.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                          isDarkMode 
                                            ? 'hover:bg-slate-700 text-gray-300' 
                                            : 'hover:bg-green-50 text-gray-700'
                                        }`}
                                      >
                                        {subItem.name}
                                      </a>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem key={subItem.name} asChild>
                                      <Link href={subItem.href}>
                                        <button className={`block px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer w-full text-left ${
                                          isDarkMode 
                                            ? 'hover:bg-slate-700 text-gray-300' 
                                            : 'hover:bg-green-50 text-gray-700'
                                        }`}>
                                          {subItem.name}
                                        </button>
                                      </Link>
                                    </DropdownMenuItem>
                                  )
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Link key={link.href} href={link.href}>
                              <button className={`px-3 py-1.5 rounded-full text-xm font-medium transition-all duration-300 cursor-pointer ${
                                location === link.href 
                                  ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                                  : 'text-gray-700 hover:bg-green-50 hover:text-green-600 dark:text-gray-300 dark:hover:bg-slate-700'
                              }`}>
                                {link.name}
                              </button>
                            </Link>
                          )
                        ))}
                      </div>
                    </div>
                  </nav>
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
                              href="https://mail.hostinger.com" 
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
                            <Link href="/contato">
                              <SheetClose asChild>
                                <button className={`block p-3 rounded-lg transition-colors w-full text-left ${
                                  isDarkMode 
                                    ? 'hover:bg-slate-700 text-gray-300' 
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}>
                                  Ouvidoria/Contato
                                </button>
                              </SheetClose>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Menu para dispositivos móveis */}
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

                  
                      
                      {/* Barra de pesquisa para mobile */}
                      <div className="py-4">
                        <SearchButton />
                      </div>
                      
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
              </div>
            </div>
          </div>
        </header>
      

      </div>

      {/* Componentes fixos responsivos - apenas botão de busca */}
      {/* Desktop e Tablet (md+) */}
      <div className="hidden md:block fixed top-40 right-4 z-40">
        <div className={`transition-all duration-300 ease-in-out ${
          isMenuHidden ? 'translate-x-5 opacity-0' : 'translate-x-0 opacity-100'
        }`}>
          <SearchButton />
        </div>
      </div>

      {/* Mobile (sm) */}
      <div className="md:hidden fixed top-24 right-2 z-40">
        <div className={`transition-all duration-300 ease-in-out ${
          isMenuHidden ? 'translate-x-5 opacity-0' : 'translate-x-0 opacity-100'
        }`}>
          <SearchButton />
        </div>
      </div>

      {/* Widget de Acessibilidade */}
      <AccessibilityWidget />

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
              <span className="text-white font-medium mx-4">Portal da Transparência</span>
              
              {/* Botões de Acesso */}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                  onClick={() => window.open('https://mail.hostinger.com', '_blank')}
                >
                  Acessar Webmail
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                  onClick={() => window.open('/contato', '_self')}
                >
                  Ouvidoria
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal do Footer */}
        <div className="w-full py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Telefone */}
              <div className="bg-green-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Telefone</h4>
                <p className="text-white text-xl font-bold">(38) 3833-1492</p>
              </div>

              {/* Horário de Atendimento */}
              <div className="bg-green-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Horário de atendimento</h4>
                <p className="text-white text-xl font-bold">07h às 13h</p>
              </div>

              {/* A Câmara */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">A Câmara</h4>
                <ul className="space-y-2">
                  <li><Link href="/vereadores"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Vereadores</span></Link></li>
                  <li><Link href="/mesa-diretora"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Mesa Diretora</span></Link></li>
                  <li><Link href="/comissoes"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Comissões</span></Link></li>
                </ul>
              </div>

              {/* Legislação */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Legislação</h4>
                <ul className="space-y-2">
                  <li><Link href="/atividades"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Atividades Legislativas</span></Link></li>
                  <li><Link href="/documentos"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Documentos</span></Link></li>
                  <li><Link href="/noticias"><span className="text-white text-sm hover:text-green-300 cursor-pointer">Notícias</span></Link></li>
                </ul>
              </div>
            </div>

            {/* Endereço */}
            <div className="mt-6">
              <div className="bg-green-800/30 rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2">Endereço</h4>
                <p className="text-white text-lg font-medium">Rua Amândio José de Carvalho, nº 371, Centro</p>
              </div>
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