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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getInitials } from '@/lib/utils';
// Componentes para UI
import { AnimatedCard } from '@/components/ui/animated-card';
import { HoverCard3D } from '@/components/ui/hover-card-3d';

// Componente de banner de destaque com vídeo do YouTube como background
const HeroBanner = () => {
  const [isMuted, setIsMuted] = React.useState(true);
  
  return (
    <div className="relative">
      {/* Container de vídeo */}
      <div className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/l7VAs92qEXA?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=l7VAs92qEXA`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute w-[300%] h-[300%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              title="Background Video"
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-indigo-900/50"></div>
            
            {/* Conteúdo do banner */}
            <div className="container mx-auto px-8 py-16 md:py-24 relative z-10 h-full flex flex-col justify-center">
              <div className="max-w-3xl text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  Câmara Municipal - Portal Transparente
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8">
                  Acompanhe as atividades legislativas, conheça os vereadores e tenha acesso a todos os documentos públicos de forma rápida e transparente.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                    Sessões ao Vivo
                  </Button>
                  <Button size="lg" className="border-white text-white hover:bg-blue-600">
                    Ouvidoria
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Botão para controlar áudio */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 z-20 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white"
              aria-label={isMuted ? "Ativar som" : "Desativar som"}
            >
              {isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de card para serviço rápido
interface QuickServiceCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const QuickServiceCard = ({ title, description, icon: Icon, href }: QuickServiceCardProps) => (
  <Link href={href}>
    <a className="block h-full">
      <Card className="h-full transition-all hover:shadow-md hover:border-blue-200">
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
            <Icon size={24} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{description}</p>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-blue-600 flex items-center">
            Acessar <ChevronRight size={16} className="ml-1" />
          </div>
        </CardFooter>
      </Card>
    </a>
  </Link>
);

// Componente de card para notícia
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
    <a className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-md transition-all">
        {imageUrl && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">{category}</Badge>
            <span className="text-xs text-gray-500">{date}</span>
          </div>
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-3">{excerpt}</p>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-blue-600 flex items-center">
            Ler mais <ArrowRight size={14} className="ml-1" />
          </div>
        </CardFooter>
      </Card>
    </a>
  </Link>
);

// Componente para card de vereador (versão sem animações)
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
    <a className="block">
      <Card className="text-center hover:shadow-md transition-all">
        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={profileImageUrl || imageUrl} />
              <AvatarFallback className="bg-blue-700 text-white text-lg">{getInitials(name)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>{party || occupation || "Vereador(a)"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mx-auto">{role || education || "Legislatura Atual"}</Badge>
        </CardContent>
      </Card>
    </a>
  </Link>
);

// Componente para exibir vereadores na página inicial
const HomeCouncilors = () => {
  const { data: councilors, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/public/councilors'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin text-blue-600">
          <Users size={40} />
        </div>
      </div>
    );
  }

  if (error || !councilors) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">Não foi possível carregar os vereadores.</p>
      </div>
    );
  }

  // Mostrar apenas os primeiros 5 vereadores
  const displayedCouncilors = councilors.slice(0, 5);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {displayedCouncilors.map((councilor) => (
        <CouncilorCard
          key={councilor.id}
          id={councilor.id}
          name={councilor.name}
          profileImageUrl={councilor.profileImageUrl || ''}
          occupation={councilor.occupation || ''}
          education={councilor.education || ''}
        />
      ))}
    </div>
  );
};

// Componente moderno para exibir vereadores baseado na referência visual
const HomeCouncilorsModern = () => {
  const { data: councilors, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/public/councilors'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex items-center space-x-3 text-white">
          <div className="animate-spin">
            <Users size={32} />
          </div>
          <span className="text-lg">Carregando vereadores...</span>
        </div>
      </div>
    );
  }

  if (error || !councilors) {
    return (
      <div className="text-center py-12">
        <p className="text-white mb-4">Não foi possível carregar os vereadores.</p>
      </div>
    );
  }

  // Mostrar apenas os primeiros 5 vereadores em destaque
  const displayedCouncilors = councilors.slice(0, 5);

  return (
    <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
      {displayedCouncilors.map((councilor, index) => (
        <Link key={councilor.id} href={`/public/vereadores/${councilor.id}`}>
          <a className="group">
            <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105">
              {/* Avatar com efeito de destaque */}
              <div className="relative mb-4">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-[10px] overflow-hidden border-4 border-white shadow-xl group-hover:shadow-2xl transition-all">
                  <Avatar className="w-full h-full rounded-[6px]">
                    <AvatarImage 
                      src={councilor.profileImageUrl} 
                      className="object-cover w-full h-full rounded-[6px]"
                    />
                    <AvatarFallback className="bg-blue-800 text-white text-2xl lg:text-3xl font-bold rounded-[6px]">
                      {getInitials(councilor.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Badge de destaque para o primeiro vereador */}
                {index === 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Users size={16} className="text-blue-700" />
                  </div>
                )}
              </div>
              
              {/* Informações do vereador */}
              <div className="text-white">
                <h3 className="text-lg lg:text-xl font-bold mb-1 group-hover:text-blue-200 transition-colors">
                  {councilor.name}
                </h3>
                <p className="text-blue-100 text-sm lg:text-base mb-2">
                  {councilor.occupation || 'Vereador(a)'}
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-xs lg:text-sm font-medium text-white backdrop-blur-sm">
                  {councilor.education || 'Legislatura Atual'}
                </div>
              </div>
            </div>
          </a>
        </Link>
      ))}
      
      {/* Indicador visual de que há mais vereadores */}
      {councilors.length > 5 && (
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 border-dashed border-white/50 flex items-center justify-center mb-3">
            <span className="text-white/70 text-sm lg:text-base font-medium">
              +{councilors.length - 5}
            </span>
          </div>
          <p className="text-white/70 text-sm">
            Mais vereadores
          </p>
        </div>
      )}
    </div>
  );
};

// Componente para card de evento
interface EventCardProps {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
}

const EventCard = ({ id, title, date, time, location, type }: EventCardProps) => (
  <Link href={`/public/eventos/${id}`}>
    <a className="block">
      <Card className="hover:shadow-md transition-all">
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-2" />
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{type}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 flex items-center">
              <Calendar size={12} className="mr-1" /> {date}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="flex flex-col text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Horário:</span>
              <span>{time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Local:</span>
              <span>{location}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4">
          <Button variant="ghost" className="w-full text-blue-700">Ver detalhes</Button>
        </CardFooter>
      </Card>
    </a>
  </Link>
);

// Serviços rápidos
const quickServices = [
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
    party: "Partido A",
    imageUrl: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    id: "5",
    name: "Juliana Costa",
    role: "Vereadora",
    party: "Partido D",
    imageUrl: "https://randomuser.me/api/portraits/women/23.jpg"
  },
  {
    id: "6",
    name: "Paulo Ferreira",
    role: "Vereador",
    party: "Partido B",
    imageUrl: "https://randomuser.me/api/portraits/men/35.jpg"
  }
];

// Eventos mockados
const mockEvents = [
  {
    id: 1,
    title: "Sessão Ordinária",
    date: "22/05/2023",
    time: "14:00",
    location: "Plenário Principal",
    type: "Sessão Plenária"
  },
  {
    id: 2,
    title: "Audiência Pública - Plano Diretor",
    date: "24/05/2023",
    time: "19:00",
    location: "Auditório Municipal",
    type: "Audiência Pública"
  },
  {
    id: 3,
    title: "Reunião da Comissão de Educação",
    date: "25/05/2023",
    time: "10:00",
    location: "Sala de Comissões",
    type: "Reunião de Comissão"
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

// Categorias de notícias
const newsCategories = [
  "Todas", "Institucional", "Meio Ambiente", "Urbanismo", "Educação", "Saúde", "Fiscalização"
];

export default function HomePage() {
  // Simulando consultas à API para obter dados
  const { data: events = mockEvents } = useQuery({
    queryKey: ['/api/public/events'],
    enabled: false,
    initialData: mockEvents
  });

  const { data: councilors = mockCouncilors } = useQuery({
    queryKey: ['/api/public/councilors'],
    enabled: false,
    initialData: mockCouncilors
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

      {/* Banner de destaque */}
      <HeroBanner />

      {/* Seção de serviços rápidos (agora compacta, abaixo do vídeo) */}
      <section className="bg-white shadow-md py-6 relative z-10 -mt-1">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold flex items-center text-blue-700">
              <Zap className="mr-2" /> 
              Serviços ao Cidadão
            </h2>
            <Link href="/public/servicos">
              <a className="text-blue-600 hover:underline text-sm flex items-center">
                Ver todos <ChevronRight size={14} />
              </a>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickServices.map((service, index) => (
              <Link key={index} href={service.href}>
                <a className="flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 transition-colors text-center group">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:bg-blue-200">
                    <service.icon size={20} />
                  </div>
                  <span className="text-sm font-medium">{service.title}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Vereadores foi removida conforme solicitado */}

      {/* Seção de notícias com layout de duas colunas */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2 text-blue-600" />
              Notícias e Publicações
            </h2>
            <Link href="/public/noticias">
              <a className="text-blue-600 hover:underline mt-2 sm:mt-0 flex items-center">
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {/* Abas de categorias de notícias */}
          <Tabs defaultValue="Todas" className="mt-4">
            <TabsList className="bg-white p-1 rounded-lg shadow-sm mb-6 overflow-x-auto flex flex-nowrap w-full">
              {newsCategories.map((category) => (
                <TabsTrigger 
                  key={category}
                  value={category}
                  className="px-4 py-2 rounded-md data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 whitespace-nowrap"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Conteúdo da aba "Todas" */}
            <TabsContent value="Todas" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna da esquerda (maior, com imagens) - ocupa 2/3 do espaço */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Notícias da Câmara</h2>
                      
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
                                  <Badge className="self-start mb-2 bg-blue-600 hover:bg-blue-700">
                                    {item.category}
                                  </Badge>
                                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                  <p className="text-white/90 line-clamp-2 mb-3">{item.excerpt}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-white/70 text-sm">{item.date}</span>
                                    <Link href={`/public/noticias/${item.id}`}>
                                      <a className="text-white hover:text-blue-200 text-sm flex items-center transition-colors">
                                        Ler matéria <ArrowRight size={14} className="ml-1" />
                                      </a>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <div className="flex justify-center mt-4 gap-2">
                          <CarouselPrevious />
                          <CarouselNext />
                        </div>
                      </Carousel>
                      
                      {/* Grid de notícias secundárias */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {news.map((item) => (
                          <div key={item.id} className="border-b pb-4 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                                {item.category}
                              </Badge>
                              <span className="text-xs text-gray-500">{item.date}</span>
                            </div>
                            <Link href={`/public/noticias/${item.id}`}>
                              <a className="block mb-2">
                                <h4 className="font-medium hover:text-blue-600 transition-colors">
                                  {item.title}
                                </h4>
                              </a>
                            </Link>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.excerpt}</p>
                            <Link href={`/public/noticias/${item.id}`}>
                              <a className="text-sm text-blue-600 hover:underline flex items-center">
                                Ler mais <ChevronRight size={14} className="ml-1" />
                              </a>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Coluna da direita (menor, sem imagens) - ocupa 1/3 do espaço */}
                <div>
                  {/* Widget do clima */}
                  <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-800 flex items-center">
                      <CloudSun className="mr-2 text-blue-600" size={20} />
                      Clima na Cidade
                    </h3>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-gray-500 text-sm">Hoje</div>
                        <div className="text-2xl font-bold text-gray-800">25°C</div>
                        <div className="text-gray-500 text-sm">Sensação 27°C</div>
                      </div>
                      <div className="text-5xl text-blue-500">
                        <CloudSun />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      Parcialmente nublado hoje com possibilidade de chuvas isoladas à tarde.
                    </p>
                    
                    <div className="flex justify-between mb-4">
                      {[
                        { day: 'Seg', temp: '27°', icon: Sun, desc: 'Ensolarado' },
                        { day: 'Ter', temp: '25°', icon: CloudSun, desc: 'Parcialmente nublado' },
                        { day: 'Qua', temp: '26°', icon: Cloud, desc: 'Nublado' },
                        { day: 'Qui', temp: '24°', icon: CloudRain, desc: 'Chuva' },
                      ].map((item, index) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xs font-medium mb-1">{item.day}</div>
                          <div className="text-blue-600">
                            {React.createElement(item.icon, { size: 24 })}
                          </div>
                          <div className="text-sm font-semibold mt-1">{item.temp}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Umidade', value: '75%', icon: Umbrella },
                        { label: 'Vento', value: '12 km/h', icon: CloudSun },
                        { label: 'Chuva', value: '10%', icon: CloudRain },
                      ].map((item, index) => (
                        <div key={index} className="text-center border border-gray-100 rounded py-2">
                          <div className="text-blue-600 mb-1">
                            {React.createElement(item.icon, { size: 16 })}
                          </div>
                          <div className="text-xs text-gray-600">{item.label}</div>
                          <div className="text-sm font-medium">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Últimas notícias */}
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-800 flex items-center">
                      <FileText className="mr-2 text-blue-600" size={20} />
                      Últimas Notícias
                    </h3>
                    
                    <div className="space-y-4">
                      {news.slice(0, 5).map((item) => (
                        <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                          </div>
                          <Link href={`/public/noticias/${item.id}`}>
                            <a className="block">
                              <h4 className="font-medium text-sm hover:text-blue-600 transition-colors leading-tight">
                                {item.title}
                              </h4>
                            </a>
                          </Link>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="ghost" size="sm" className="w-full mt-4 text-blue-600 hover:text-blue-800">
                      Ver mais notícias
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Renderizar abas filtradas para outras categorias */}
            {newsCategories.slice(1).map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna da esquerda (maior, com imagens) */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Destaques de {category}</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {news
                        .filter(item => item.category === category)
                        .slice(0, 4)
                        .map((item) => (
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
                  
                  {/* Coluna da direita (menor, sem imagens) */}
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-800">Mais em {category}</h3>
                    
                    <div className="space-y-4">
                      {news
                        .filter(item => item.category === category)
                        .slice(0, 5)
                        .map((item) => (
                          <div key={item.id} className="border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs text-blue-600">{category}</span>
                              <span className="text-xs text-gray-500">{formatDate(item.date)}</span>
                            </div>
                            <Link href={`/public/noticias/${item.id}`}>
                              <a className="block">
                                <h4 className="font-medium text-sm hover:text-blue-600 transition-colors leading-tight">
                                  {item.title}
                                </h4>
                              </a>
                            </Link>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
      {/* Banner de chamada para ação */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Participe da Vida Política da Cidade</h2>
          <p className="max-w-2xl mx-auto mb-8 opacity-90">
            Acompanhe as sessões, envie sugestões de projetos de lei, participe das audiências públicas
            e contribua para o desenvolvimento da nossa cidade.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
              Ouvidoria
            </Button>
            <Button size="lg" className="text-blue border-white hover:bg-blue-600">
              Calendário de Audiências
            </Button>
          </div>
        </div>
      </section>

      {/* Nova seção de vereadores com design moderno */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        {/* Elemento decorativo de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="white" />
            <path d="M100,20 L100,180 M20,100 L180,100" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Nossa Equipe de Vereadores</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Conheça os representantes eleitos que trabalham em prol do desenvolvimento de nossa cidade
            </p>
          </div>
          
          {/* Cards de vereadores em layout horizontal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
            <HomeCouncilorsModern />
          </div>
          
          <div className="text-center">
            <Link href="/public/vereadores">
              <a className="inline-flex items-center px-8 py-3 bg-white text-blue-700 font-semibold rounded-full hover:bg-blue-50 transition-all shadow-lg">
                Ver todos os vereadores
                <ChevronRight size={20} className="ml-2" />
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de cards de documentos, atividades e calendário */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card de Últimos Documentos */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <FileText className="text-blue-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Últimos Documentos</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { title: "Lei Complementar nº 043/2023", date: "15/05/2023", type: "Lei Complementar" },
                    { title: "Decreto Legislativo nº 12/2023", date: "10/05/2023", type: "Decreto" },
                    { title: "Resolução nº 007/2023", date: "05/05/2023", type: "Resolução" },
                    { title: "Portaria nº 133/2023", date: "28/04/2023", type: "Portaria" },
                  ].map((doc, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {doc.type}
                        </Badge>
                        <span className="text-xs text-gray-500">{doc.date}</span>
                      </div>
                      <Link href={`/public/documentos/${index}`}>
                        <a className="text-sm font-medium hover:text-blue-600 transition-colors line-clamp-1">
                          {doc.title}
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
                
                <Link href="/public/documentos">
                  <a className="mt-4 text-blue-600 hover:underline text-sm flex items-center justify-center pt-3 border-t">
                    Ver todos os documentos <ChevronRight size={16} className="ml-1"/>
                  </a>
                </Link>
              </div>
            </div>
            
            {/* Card de Atividades Legislativas */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <Gavel className="text-green-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Atividades Legislativas</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { title: "Projeto de Lei nº 076/2023 - Reforma do Parque Municipal", date: "18/05/2023", type: "Projeto de Lei" },
                    { title: "Moção de Aplausos aos Professores da Rede Municipal", date: "12/05/2023", type: "Moção" },
                    { title: "Indicação nº 134/2023 - Melhorias no Trânsito", date: "08/05/2023", type: "Indicação" },
                    { title: "Requerimento nº 045/2023 - Informações sobre Obras", date: "02/05/2023", type: "Requerimento" },
                  ].map((activity, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          {activity.type}
                        </Badge>
                        <span className="text-xs text-gray-500">{activity.date}</span>
                      </div>
                      <Link href={`/public/atividades/${index}`}>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors line-clamp-1">
                          {activity.title}
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
                
                <Link href="/public/atividades">
                  <a className="mt-4 text-green-600 hover:underline text-sm flex items-center justify-center pt-3 border-t">
                    Ver todas as atividades <ChevronRight size={16} className="ml-1"/>
                  </a>
                </Link>
              </div>
            </div>
            
            {/* Card de Calendário de Eventos */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <Calendar className="text-purple-600" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Calendário de Eventos</h3>
                </div>
                
                <div className="mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <h4 className="font-medium">Maio 2023</h4>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-7 text-center gap-1">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={i} className="text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                      
                      {Array(31).fill(0).map((_, i) => {
                        const day = i + 1;
                        const hasEvent = [3, 10, 15, 22, 24].includes(day);
                        return (
                          <div 
                            key={i} 
                            className={`
                              text-xs py-1 rounded-full
                              ${hasEvent ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-700'}
                            `}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">03/05 - 14:00</p>
                    <p className="text-sm font-medium">Sessão Ordinária</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">10/05 - 10:00</p>
                    <p className="text-sm font-medium">Reunião de Comissão</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-3 py-1">
                    <p className="text-xs text-gray-500">15/05 - 19:00</p>
                    <p className="text-sm font-medium">Audiência Pública</p>
                  </div>
                </div>
                
                <Link href="/public/eventos">
                  <a className="mt-4 text-purple-600 hover:underline text-sm flex items-center justify-center pt-3 border-t">
                    Ver todos os eventos <ChevronRight size={16} className="ml-1"/>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}