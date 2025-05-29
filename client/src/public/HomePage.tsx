import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  FileText, 
  Users, 
  Zap,
  Gavel,
  FileSearch,
  Building,
  PieChart,
  ChevronRight,
  ArrowRight,
  Volume2,
  VolumeX,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CloudSun,
  CloudRain,
  Cloud,
  Sun,
  Umbrella,
  Thermometer,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Função auxiliar para obter iniciais
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

// Interface para QuickServiceCard
interface QuickServiceCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const QuickServiceCard = ({ title, description, icon: Icon, href }: QuickServiceCardProps) => (
  <Link href={href}>
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-lg transition-colors" style={{backgroundColor: '#253529'}}>
            <Icon size={24} style={{color: '#e4e6da'}} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors" style={{color: '#253529'}}>
              {title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Interface para NewsCard
interface NewsCardProps {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  imageUrl?: string;
  category: string;
}

const NewsCard = ({ id, title, excerpt, date, imageUrl, category }: NewsCardProps) => (
  <Link href={`/public/noticias/${id}`}>
    <Card className="group cursor-pointer h-full hover:shadow-lg transition-all duration-300">
      <div className="relative">
        {imageUrl && (
          <div className="aspect-[16/9] overflow-hidden rounded-t-lg">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <Badge className="absolute top-3 left-3 text-xs" style={{backgroundColor: '#253529', color: 'white'}}>
          {category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {excerpt}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{date}</span>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Interface para CouncilorCard
interface CouncilorCardProps {
  id: string;
  name: string;
  role?: string;
  party?: string;
  imageUrl?: string;
  profileImageUrl?: string;
  occupation?: string;
  education?: string;
}

const CouncilorCard = ({ id, name, role, party, imageUrl, profileImageUrl, occupation, education }: CouncilorCardProps) => (
  <Link href={`/public/vereadores/${id}`}>
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-2 pt-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={profileImageUrl || imageUrl} />
            <AvatarFallback className="text-white text-lg" style={{backgroundColor: '#7FA653'}}>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>{party || occupation || "Vereador(a)"}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {role && (
          <Badge variant="secondary" className="mb-2">
            {role}
          </Badge>
        )}
        {education && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {education}
          </p>
        )}
      </CardContent>
    </Card>
  </Link>
);

// Interface para EventCard
interface EventCardProps {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

const EventCard = ({ id, title, date, time, location, type }: EventCardProps) => (
  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg border-l-4" style={{borderLeftColor: '#7FA653'}}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between mb-2">
        <Badge variant="outline" className="text-xs" style={{borderColor: '#7FA653', color: '#63783D'}}>
          {type}
        </Badge>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center">
          <Calendar size={12} className="mr-1" />
          {date}
        </div>
        <div className="flex items-center">
          <Building size={12} className="mr-1" />
          {location}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Dados mockados para serviços rápidos
const quickServices = [
  {
    title: "Transparência",
    description: "Acesse informações sobre orçamento, despesas e receitas municipais",
    icon: PieChart,
    href: "/public/transparencia"
  },
  {
    title: "Atividades Legislativas",
    description: "Consulte atividades, projetos de lei e deliberações em andamento",
    icon: Gavel,
    href: "/public/atividades"
  },
  {
    title: "Sessões",
    description: "Acompanhe as sessões da Câmara, calendário e pautas de reuniões",
    icon: Zap,
    href: "/public/sessoes"
  },
  {
    title: "Atas e Documentos",
    description: "Acesse documentos oficiais, atas de reuniões e registros públicos",
    icon: FileText,
    href: "/public/documentos"
  },
  {
    title: "Legislação",
    description: "Consulte leis, decretos, portarias e toda a legislação municipal",
    icon: Gavel,
    href: "/public/legislacao"
  },
  {
    title: "Licitações",
    description: "Informações sobre processos licitatórios, contratos e convênios",
    icon: FileSearch,
    href: "/public/licitacoes"
  },
  {
    title: "Transparência",
    description: "Dados orçamentários, despesas, receitas e relatórios fiscais",
    icon: PieChart,
    href: "/public/transparencia"
  },
  {
    title: "Audiências",
    description: "Calendário de audiências públicas, consultas e participação cidadã",
    icon: Building,
    href: "/public/audiencias"
  }
];

// Notícias mockadas
const mockNews = [
  {
    id: 1,
    title: "Câmara aprova projeto que incentiva a reciclagem no município",
    excerpt: "O projeto de lei que incentiva a reciclagem de resíduos sólidos foi aprovado por unanimidade na sessão de ontem. A nova legislação prevê benefícios fiscais para empresas que adotarem práticas sustentáveis.",
    date: "10 de Maio de 2023",
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    category: "Meio Ambiente"
  },
  {
    id: 2,
    title: "Audiência pública discutirá mobilidade urbana na próxima semana",
    excerpt: "Uma audiência pública para discutir o plano de mobilidade urbana será realizada na próxima semana. A população poderá enviar sugestões e participar ativamente das discussões sobre transporte público.",
    date: "08 de Maio de 2023",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    category: "Urbanismo"
  },
  {
    id: 3,
    title: "Nova comissão para fiscalizar obras públicas é formada na Câmara",
    excerpt: "Os vereadores formaram uma nova comissão especial para fiscalizar as obras públicas em andamento no município. O objetivo é garantir a qualidade dos serviços e a aplicação correta dos recursos.",
    date: "05 de Maio de 2023",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    category: "Fiscalização"
  },
  {
    id: 4,
    title: "Programa de inclusão digital é aprovado e beneficiará escolas públicas",
    excerpt: "O programa de inclusão digital que beneficiará escolas públicas do município foi aprovado. A iniciativa prevê a instalação de laboratórios de informática e acesso à internet de alta velocidade.",
    date: "03 de Maio de 2023",
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
    category: "Educação"
  }
];

// Vereadores mockados
const mockCouncilors = [
  {
    id: "1",
    name: "Ana Silva",
    role: "Presidente",
    party: "Partido A",
    imageUrl: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    id: "2",
    name: "Carlos Santos",
    role: "Vice-Presidente",
    party: "Partido B",
    imageUrl: "https://randomuser.me/api/portraits/men/41.jpg"
  },
  {
    id: "3",
    name: "Mariana Oliveira",
    role: "Secretária",
    party: "Partido C",
    imageUrl: "https://randomuser.me/api/portraits/women/45.jpg"
  },
  {
    id: "4",
    name: "Ricardo Almeida",
    role: "Vereador",
    party: "Partido D",
    imageUrl: "https://randomuser.me/api/portraits/men/55.jpg"
  },
  {
    id: "5",
    name: "Fernanda Costa",
    role: "Vereadora",
    party: "Partido E",
    imageUrl: "https://randomuser.me/api/portraits/women/28.jpg"
  }
];

// Eventos mockados
const mockEvents = [
  {
    id: 1,
    title: "Sessão Ordinária da Câmara Municipal",
    date: "15/05/2023",
    time: "09:00",
    location: "Plenário Principal",
    type: "Sessão Ordinária"
  },
  {
    id: 2,
    title: "Audiência Pública - Orçamento 2024",
    date: "18/05/2023",
    time: "14:00",
    location: "Auditório da Câmara",
    type: "Audiência Pública"
  },
  {
    id: 3,
    title: "Reunião da Comissão de Finanças",
    date: "22/05/2023",
    time: "10:30",
    location: "Sala de Reuniões",
    type: "Comissão"
  },
  {
    id: 4,
    title: "Sessão Extraordinária",
    date: "26/05/2023",
    time: "15:00",
    location: "Plenário Principal",
    type: "Sessão Plenária"
  }
];

export default function HomePage() {
  // Simulando consultas à API para obter dados
  const { data: events = mockEvents } = useQuery({
    queryKey: ['/api/public/events'],
    enabled: false,
    initialData: mockEvents
  });

  const { data: councilors = [], isLoading: councilorLoading } = useQuery({
    queryKey: ['/api/public/councilors'],
    enabled: true
  });

  const { data: news = mockNews } = useQuery({
    queryKey: ['/api/public/news'],
    enabled: false,
    initialData: mockNews
  });

  // Formatador de datas
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString; // Se já for uma string formatada, retorna como está
    }
  };

  return (
    <>
      <Helmet>
        <title>Sistema Legislativo - Portal Público</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Seção Hero Principal com vista aérea */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 w-full h-full z-0">
          <iframe
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{             
              transformOrigin: 'center center'
            }}
             src="https://www.youtube.com/embed/l7VAs92qEXA?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playlist=l7VAs92qEXA"
            title="Vídeo de fundo da Câmara Municipal"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>        
                
              
        <div className="container mx-auto px-4 relative z-20">
          <div className="text-center text-white max-w-4xl mx-auto">
          
            
        
          </div>
        </div>
      </section>

      {/* Seção de Serviços Rápidos */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{color: '#48654e'}}>Acesso Rápido</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Encontre rapidamente as informações que você precisa sobre a Câmara Municipal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickServices.slice(0, 8).map((service, index) => (
              <QuickServiceCard
                key={index}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Serviços Moderna e Interativa */}
      <section className="py-24 px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'}}>
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-green-200 rounded-full opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-orange-200 rounded-full opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-green-600 to-orange-500 bg-clip-text text-transparent">
              Serviços Digitais
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-xl leading-relaxed">
              Acesse nossos serviços de forma rápida e eficiente, organizados por categoria para sua conveniência
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card de Contratos */}
            <div className="group relative">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-3xl p-8 text-white overflow-hidden shadow-2xl group-hover:shadow-pink-500/30 transition-all duration-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <h3 className="text-3xl font-bold mr-3">Contratos</h3>
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">SOLUÇÕES</span>
                    </div>
                    
                    {/* Grid de serviços */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { icon: "🛒", text: "Compras" },
                        { icon: "📋", text: "Contratos" },
                        { icon: "🏗️", text: "Obras" },
                        { icon: "📦", text: "Almoxarifado" },
                        { icon: "📱", text: "APP Almoxarifado" },
                        { icon: "🚗", text: "Frotas" }
                      ].map((service, index) => (
                        <button key={index} className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 text-left backdrop-blur-sm border border-white/10">
                          <span className="text-lg mr-2">{service.icon}</span>
                          <span className="text-sm font-medium">{service.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Imagem do profissional */}
                  <div className="ml-6">
                    <img 
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                      alt="Profissional de contratos"
                      className="w-300 h-80 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Contábil */}
            <div className="group relative">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <h3 className="text-3xl font-bold mr-3">Contábil</h3>
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">SOLUÇÕES</span>
                    </div>
                    
                    {/* Grid de serviços */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { icon: "📊", text: "ContaDil" },
                        { icon: "📈", text: "Planejamento" },
                        { icon: "🎯", text: "Controladoria" },
                        { icon: "📋", text: "Prestação de Contas" },
                        { icon: "🤝", text: "Convênios" },
                        { icon: "🌐", text: "Portal do Gestor" }
                      ].map((service, index) => (
                        <button key={index} className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 text-left backdrop-blur-sm border border-white/10">
                          <span className="text-lg mr-2">{service.icon}</span>
                          <span className="text-sm font-medium">{service.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Imagem do profissional */}
                  <div className="ml-6">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                      alt="Profissional contábil"
                      className="w-32 h-40 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Contábil */}
            <div className="group relative">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden shadow-2xl group-hover:shadow-blue-500/30 transition-all duration-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-6">
                      <h3 className="text-3xl font-bold mr-3">Contábil</h3>
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">SOLUÇÕES</span>
                    </div>

                    {/* Grid de serviços */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { icon: "📊", text: "ContaDil" },
                        { icon: "📈", text: "Planejamento" },
                        { icon: "🎯", text: "Controladoria" },
                        { icon: "📋", text: "Prestação de Contas" },
                        { icon: "🤝", text: "Convênios" },
                        { icon: "🌐", text: "Portal do Gestor" }
                      ].map((service, index) => (
                        <button key={index} className="flex items-center p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 text-left backdrop-blur-sm border border-white/10">
                          <span className="text-lg mr-2">{service.icon}</span>
                          <span className="text-sm font-medium">{service.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Imagem do profissional */}
                  <div className="ml-6">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                      alt="Profissional contábil"
                      className="w-32 h-40 object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

         
        </div>
      </section>

      {/* Seção de notícias com layout de duas colunas */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2" style={{color: '#48654e'}} />
              Notícias e Publicações
            </h2>
            <Link href="/public/noticias">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {/* Seção de notícias sem filtros */}
          <div className="grid grid-cols-4 gap-4">
            {/* Coluna da esquerda (maior, com imagens) - ocupa 2/3 do espaço */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">                
                      
                  {/* Destaque principal com carrossel */}
                  <Carousel
                    opts={{ loop: true }}
                    className="w-full mb-8"
                  >
                    <CarouselContent>
                      {news.slice(0, 3).map((item) => (
                        <CarouselItem key={item.id}>
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                            <img
                              src={item.imageUrl} 
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                              <Badge className="self-start mb-3 text-xs" style={{backgroundColor: '#48654e'}}>
                                {item.category}
                              </Badge>
                              <h3 className="text-white text-xl font-bold mb-2 line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-gray-200 text-sm line-clamp-2 mb-3">
                                {item.excerpt}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300 text-xs">{formatDate(item.date)}</span>
                                <Button size="sm" variant="secondary" className="text-xs">
                                  Ler mais
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  
                  {/* Grid de notícias menores */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {news.slice(3, 7).map((item) => (
                      <NewsCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        excerpt={item.excerpt}
                        date={formatDate(item.date)}
                        imageUrl={item.imageUrl}
                        category={item.category}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Coluna da direita (sidebar) - ocupa 1/3 do espaço */}
            
              {/* Próximos eventos */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center" style={{color: '#48654e'}}>
                  <Calendar className="mr-2" style={{color: '#48654e'}} size={20} />
                  Próximos Eventos
                </h3>
                
                <div className="space-y-4">
                  {events.slice(0, 4).map((event) => (
                    <EventCard
                      key={event.id}
                      id={event.id}
                      title={event.title}
                      date={event.date}
                      time={event.time}
                      location={event.location}
                      type={event.type}
                    />
                  ))}
                </div>
                
                <Button variant="ghost" size="sm" className="w-full mt-4 hover:opacity-80" style={{color: '#48654e'}}>
                  Ver agenda completa
                </Button>
              </div>
           
            
              {/* Widget do clima */}
              <div className="bg-[#e4e6da] rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center" style={{color: '#63783D'}}>
                  <Sun className="mr-2" style={{color: '#7FA653'}} size={20} />
                  Clima Hoje
                </h3>
                
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Sun size={32} style={{color: '#7FA653'}} />
                    <span className="text-3xl font-bold ml-2">28°C</span>
                  </div>
                  <p className="text-gray-600 text-sm">Ensolarado</p>
                  <p className="text-xs text-gray-500">Máx: 32°C • Mín: 22°C</p>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { day: 'Seg', temp: '27°', icon: Sun, desc: 'Ensolarado' },
                    { day: 'Ter', temp: '25°', icon: CloudSun, desc: 'Parcialmente nublado' },
                    { day: 'Qua', temp: '26°', icon: Cloud, desc: 'Nublado' },
                    { day: 'Qui', temp: '24°', icon: CloudRain, desc: 'Chuva' },
                  ].map((item, index) => (
                    <div key={index} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium mb-1">{item.day}</div>
                      <div style={{color: '#7FA653'}}>
                        {React.createElement(item.icon, { size: 24 })}
                      </div>
                      <div className="text-sm font-semibold mt-1">{item.temp}</div>
                    </div>
                  ))}
                </div>  
                
              </div>
              
              {/* Widget de Assuntos em Alta */}
              <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center" style={{color: '#48654e'}}>
                  <Zap className="mr-2" style={{color: '#7FA653'}} size={20} />
                  Assuntos em alta
                </h3>
                
                <div className="space-y-3">
                  {[
                    "IPTU 2025",
                    "Nota Fiscal Eletrônica", 
                    "Pregão Eletrônico",
                    "Consulta de Processos",
                    "Ouvidoria",
                    "Serviços Online"
                  ].map((topic, index) => (
                    <button 
                      key={index} 
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-gray-300"
                    >
                      <span className="text-sm font-medium text-gray-700 hover:text-gray-900">
                        {topic}
                      </span>
                    </button>
                  ))}
                </div>
              </div>      
                      
             
            
          </div>
        </div>
      </section>

      {/* Seção de Vereadores - Layout Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4" style={{backgroundColor: '#48654e'}}>
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold" style={{color: '#48654e'}}>Vereadores</h2>
                <p className="text-gray-500 text-sm">2025-2028</p>
              </div>
            </div>
          </div>
          
          {councilorLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 animate-spin" style={{color: '#48654e'}} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {(councilors?.length > 0 ? councilors : mockCouncilors).slice(0, 12).map((councilor, index) => (
                <Link key={councilor.id} href={`/public/vereadores/${councilor.id}`}>
                  <div className="group cursor-pointer text-center">
                    {/* Container da imagem com badges de cargo */}
                    <div className="relative mb-3">
                      {/* Badge de cargo */}
                      {councilor.role && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                          {councilor.role === 'Presidente' && (
                            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                              Presidente
                            </div>
                          )}
                          {councilor.role === 'Vice-Presidente' && (
                            <div className="bg-red-400 text-white px-2 py-1 rounded text-xs font-bold">
                              {index === 0 ? '2º Vice-Presidente' : '1º Vice-Presidente'}
                            </div>
                          )}
                          {councilor.role === 'Secretário' && (
                            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                              {index === 4 ? '1º Secretário' : '2º Secretário'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="w-34 h-50 mx-auto rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200 group-hover:border-gray-300">
                        {councilor.profileImageUrl ? (
                          <img 
                            src={councilor.profileImageUrl} 
                            alt={councilor.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{backgroundColor: '#8aa88a'}}>
                            {getInitials(councilor.name)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Informações do vereador */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold group-hover:opacity-80 transition-opacity duration-300" style={{color: '#48654e'}}>
                        {councilor.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {councilor.party || "Partido"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/public/vereadores">
              <Button size="lg" className="text-white hover:opacity-90 transition-all duration-300"
                      style={{backgroundColor: '#48654e'}}>
                <Users className="mr-3" size={20} />
                Ver Todos os Vereadores
              </Button>
            </Link>
          </div>
        </div>
      </section>

    
    </>
  );
}