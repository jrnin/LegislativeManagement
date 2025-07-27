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
  VolumeX
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
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Buscar dados meteorológicos da API
  const { data: weather } = useQuery({
    queryKey: ['/api/weather/current'],
    refetchInterval: 10 * 60 * 1000, // Atualizar a cada 10 minutos
    staleTime: 5 * 60 * 1000, // Considerar stale após 5 minutos
  });

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
  
  // Detectar quando o usuário rola a página para aplicar o efeito do menu fixo
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Limpar o event listener quando o componente for desmontado
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  // Links do menu principal
  const mainMenuLinks = [
    { name: 'Início', href: '/' },
    { name: 'Vereadores',
     href: '/vereadores',
    submenu: [
      { name: 'Mesa Diretora', href: '/mesa-diretora' },
      { name: 'Comissões', href: '/comissoes'},
      { name: 'Vereadores', href: '/vereadores?tipo=Vereador' }
    ]},
    { name: 'Documentos Administrativos', href: '/documentos' },
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
        name: 'Sessões Legislativas', 
        href: '/sessoes',
          external: true
      },
      {
        name: 'Documentos', 
        href: '/documentos',
          external: true
      },
      {
        name: 'Comissões', 
        href: '/comissoes',
          external: true
      }
    ]
    },
    { 
      name: 'Transparência', 
      href: '/transparencia',
      submenu: [
        { 
          name: 'Licitações', 
          href: 'http://cidadesmg.com.br/portaltransparencia/faces/user/licitacao.xhtml?Param=CamJaiba',
          external: true
        },
        { 
          name: 'Radar da Transparência', 
          href: 'https://radardatransparencia.atricon.org.br/',
          external: true
        },
        { 
          name: 'Recursos Humanos', 
          href: 'http://cidadesmg.com.br/portaltransparencia/faces/user/folha/FFolhaPagamento.xhtml?Param=CamJaiba',
          external: true
        }
      ]
    },
    { name: 'Notícias', href: '/noticias' },
    { name: 'Contato', href: '/contato'
    
    },
  ];

  // Serviços de acesso rápido
  const quickServices = [
    { name: 'Sessões', href: '/sessoes', icon: Zap },
    { name: 'Atas', href: '/atas', icon: Zap },
    { name: 'Transparência', href: '/transparencia', icon: Zap },
    { name: 'Licitações', href: '/licitacoes', icon: Zap },
    { name: 'Contratos', href: '/contratos', icon: Zap },
    { name: 'Documentos', href: '/documentos', icon: Zap },
    { name: 'Relatórios', href: '/relatorios', icon: Zap },
    { name: 'Audiências', href: '/audiencias', icon: Zap },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark bg-slate-900 text-white' : 'bg-white'} ${isHighContrast ? 'high-contrast' : ''}`}>
      <Helmet>
        <title>Sistema Legislativo - Portal Público</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Top bar com opções de acessibilidade e redes sociais */}
      <div className="w-full py-4 px-6 text-white text-sm" style={{backgroundColor: '#253529'}}>
        <div className="container mx-auto flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="mr-2 font-medium ">Acessibilidade:</span>
              <button 
                onClick={toggleDarkMode} 
                className="p-1 rounded-md hover:opacity-80" 
                style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
                aria-label={isDarkMode ? "Modo claro" : "Modo escuro"}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button 
                onClick={toggleHighContrast} 
                className="p-1 rounded-md hover:opacity-80 text-xs" 
                style={{backgroundColor: 'rgba(127, 166, 83, 0.3)'}}
                aria-label={isHighContrast ? "Contraste normal" : "Alto contraste"}
              >
                {isHighContrast ? "Contraste normal" : "Alto contraste"}
              </button>
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
              {weather ? (
                <>
                  {React.createElement(getWeatherIcon(weather.icon), { size: 16 })}
                  <span>{weather.temperature}°C</span>
                  <span className="hidden sm:inline">{weather.weatherDescription}</span>
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
          <div className="container mx-auto">
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

              {/* Barra de pesquisa - visível apenas em telas médias ou maiores */}
              <div className="hidden md:flex flex-1 max-w-md mx-6">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Pesquisar no site..."
                    className={`pl-9 pr-4 rounded-full ${
                      location === '/public' && !isScrolled
                        ? 'bg-white/20 border-white/30 placeholder:text-white/70 text-white'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Menu para desktop */}
              <nav className="hidden lg:flex items-center space-x-1">
                {mainMenuLinks.map((link) => (
                  link.submenu ? (
                    <DropdownMenu key={link.name}>
                      <DropdownMenuTrigger asChild>
                        <button className={`px-3 py-2 rounded-[10px] text-base
 font-medium transition-colors cursor-pointer flex items-center ${
                          location === link.href 
                            ? 'text-white' 
                            : location === '/public' && !isScrolled
                              ? 'text-white hover:bg-white/20'
                              : isDarkMode 
                                ? 'text-gray-300 hover:bg-slate-400 hover:text-white' 
                                : 'hover:opacity-80'
                        }`} style={location === link.href ? {backgroundColor: '#48654e'} : {color: '#253529'}}>
                          {link.name}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-[10px]">
                        {link.submenu.map((subItem) => (
                          <DropdownMenuItem key={subItem.name} className="text-base rounded-[10px]">
                            {subItem.external ? (
                              <a 
                                href={subItem.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                {subItem.name}
                              </a>
                            ) : (
                              <Link href={subItem.href} className="w-full">
                                {subItem.name}
                              </Link>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link key={link.href} href={link.href}>
                      <button className={`px-3 py-2 rounded-[10px] text-base font-medium transition-colors cursor-pointer ${
                        location === link.href 
                          ? 'text-white' 
                          : location === '/public' && !isScrolled
                            ? 'text-white hover:bg-white/20'
                            : isDarkMode 
                              ? 'text-gray-300 hover:bg-slate-700 hover:text-white' 
                              : 'hover:opacity-80'
                      }`} style={location === link.href ? {backgroundColor: '#007825'} : {color: '#253529'}}>
                        {link.name}
                      </button>
                    </Link>
                  )
                ))}
                
                <div className="ml-2">
                  
                </div>
              </nav>

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
                      
                      <div className="mt-auto pt-4 border-t">
                        <SheetClose asChild>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full"
                            onClick={() => window.location.href = "/login"}
                          >
                            Área Restrita
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full mt-8" style={{backgroundColor: '#1a3e1f'}}>
        {/* Header do Footer com ícone, redes sociais e botões */}
        <div className="w-full py-4 px-6 border-b border-green-700/30">
          <div className="container mx-auto flex flex-wrap justify-between items-center">
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
                  onClick={() => window.open('https://cmjaiba.cidadesmg.com.br/webmail', '_blank')}
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
          <div className="container mx-auto">
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
          <div className="container mx-auto">
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