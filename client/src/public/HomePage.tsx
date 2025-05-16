import React, { useState } from 'react';
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
  Thermometer
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
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-indigo-900/70"></div>
            
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
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
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

// Componente para card de vereador
interface CouncilorCardProps {
  id: string;
  name: string;
  role: string;
  party: string;
  imageUrl?: string;
}

const CouncilorCard = ({ id, name, role, party, imageUrl }: CouncilorCardProps) => (
  <Link href={`/public/vereadores/${id}`}>
    <a className="block">
      <Card className="text-center hover:shadow-md transition-all">
        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={imageUrl} />
              <AvatarFallback className="bg-blue-700 text-white text-lg">{getInitials(name)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>{party}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mx-auto">{role}</Badge>
        </CardContent>
      </Card>
    </a>
  </Link>
);

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

          <Tabs defaultValue="Todas">
            <TabsList className="mb-6 bg-transparent border-b pb-2 w-full overflow-x-auto flex-no-wrap whitespace-nowrap justify-start">
              {newsCategories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="rounded-full px-4 py-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="Todas" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna da esquerda (maior, com imagens) - ocupa 2/3 do espaço */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800">Destaques</h3>
                  
                  {/* Carrossel de notícias em destaque com overlay */}
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full rounded-lg shadow-md overflow-hidden"
                  >
                    <CarouselContent>
                      {news.slice(0, 4).map((item) => (
                        <CarouselItem key={item.id}>
                          <Link href={`/public/noticias/${item.id}`}>
                            <a className="block relative">
                              <div className="aspect-[16/9] overflow-hidden">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover"
                                />
                                {/* Overlay gradiente */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                              </div>
                              
                              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {item.category}
                                  </Badge>
                                  <span className="text-sm text-blue-100">{formatDate(item.date)}</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">
                                  {item.title}
                                </h3>
                                <p className="text-gray-200 mb-3 line-clamp-2 sm:line-clamp-3">{item.excerpt}</p>
                                <div className="inline-flex items-center text-blue-200 hover:text-blue-100 transition-colors">
                                  Leia mais <ArrowRight size={14} className="ml-1" />
                                </div>
                              </div>
                            </a>
                          </Link>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="absolute z-10 flex justify-between w-full top-1/2 -translate-y-1/2">
                      <CarouselPrevious className="left-2 bg-white/40 hover:bg-white/80 border-none text-white" />
                      <CarouselNext className="right-2 bg-white/40 hover:bg-white/80 border-none text-white" />
                    </div>
                  </Carousel>
                  
                  {/* Demais notícias em grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
                    {news.slice(4, 10).map((item) => (
                      <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <Link href={`/public/noticias/${item.id}`}>
                          <a className="block">
                            <div className="aspect-[3/2] overflow-hidden relative">
                              <img 
                                src={item.imageUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="p-3">
                              <div className="flex justify-between items-center mb-1 text-xs">
                                <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                  {item.category}
                                </Badge>
                                <span className="text-gray-500">{formatDate(item.date)}</span>
                              </div>
                              <h3 className="font-semibold line-clamp-2 text-sm hover:text-blue-600 transition-colors">
                                {item.title}
                              </h3>
                            </div>
                          </a>
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  {/* Instagram Feed da Câmara de Jaíba */}
                  <div className="mt-10 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <div className="text-2xl font-bold text-blue-900 flex items-center">
                          <span className="text-blue-600">#insta</span>
                          <span className="ml-2">@camaradejaiba</span>
                        </div>
                      </div>
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center text-blue-600 font-medium"
                      >
                        Seguir <ChevronRight size={16} />
                      </a>
                    </div>
                    
                    {/* Grid de 6 imagens do Instagram */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?w=500&auto=format&fit=crop&q=60" 
                            alt="Sessão extraordinária na Câmara Municipal de Jaíba" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Sessão extraordinária na Câmara Municipal de Jaíba</p>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60" 
                            alt="Reunião da comissão especial" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Reunião da comissão especial para análise do orçamento</p>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=60" 
                            alt="Audiência pública" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Audiência pública sobre melhorias na infraestrutura</p>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1507137903531-34be734e5b1b?w=500&auto=format&fit=crop&q=60" 
                            alt="Homenagem aos servidores públicos" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Homenagem aos servidores públicos municipais</p>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=500&auto=format&fit=crop&q=60" 
                            alt="Cerimônia de premiação" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Cerimônia de premiação dos alunos da rede municipal</p>
                            </div>
                          </div>
                        </div>
                      </a>
                      
                      <a 
                        href="https://instagram.com/camaradejaiba" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="overflow-hidden aspect-square rounded-md hover:opacity-90 transition-opacity group"
                      >
                        <div className="relative w-full h-full">
                          <img 
                            src="https://images.unsplash.com/photo-1561489396-2da385eccd49?w=500&auto=format&fit=crop&q=60" 
                            alt="Participação na conferência" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                            <div className="p-3 text-white text-xs">
                              <div className="flex items-center mb-1">
                                <Instagram size={14} className="inline mr-1" />
                                <span className="mr-2">@camaradejaiba</span>
                              </div>
                              <p className="line-clamp-2">Participação na conferência de legislativos municipais</p>
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Coluna da direita (menor, sem imagens) - ocupa 1/3 do espaço */}
                <div className="space-y-6">
                  {/* Previsão do tempo semanal */}
                  <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4 border-b pb-2 text-blue-800 flex items-center">
                      <CloudSun className="mr-2 text-blue-600" size={20} />
                      Previsão do Tempo
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Clima atual */}
                      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-50 to-sky-50 p-3 rounded-lg">
                        <div>
                          <div className="text-gray-600 text-sm">Hoje</div>
                          <div className="text-lg font-semibold">Jaíba, MG</div>
                          <div className="flex items-center">
                            <Thermometer size={14} className="text-red-500 mr-1" /> 
                            <span className="text-2xl font-bold">27°</span>
                          </div>
                        </div>
                        <div className="text-blue-500">
                          <CloudSun size={48} />
                        </div>
                      </div>
                      
                      {/* Previsão por dias da semana */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
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

      {/* Seção de vereadores e eventos próximos */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vereadores */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Users className="mr-2 text-blue-600" />
                  Vereadores
                </h2>
                <Link href="/public/vereadores">
                  <a className="text-blue-600 hover:underline flex items-center">
                    Ver todos <ChevronRight size={16} />
                  </a>
                </Link>
              </div>

              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {councilors.map((councilor) => (
                    <CarouselItem key={councilor.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <CouncilorCard
                          id={councilor.id}
                          name={councilor.name}
                          role={councilor.role}
                          party={councilor.party}
                          imageUrl={councilor.imageUrl}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-center mt-4">
                  <CarouselPrevious />
                  <CarouselNext />
                </div>
              </Carousel>
            </div>

            {/* Próximos eventos */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Calendar className="mr-2 text-blue-600" />
                  Agenda
                </h2>
                <Link href="/public/eventos">
                  <a className="text-blue-600 hover:underline flex items-center">
                    Ver todos <ChevronRight size={16} />
                  </a>
                </Link>
              </div>

              <div className="space-y-4">
                {events.map((event) => (
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
            </div>
          </div>
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
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-600">
              Calendário de Audiências
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de redes sociais com feed do Instagram */}
      <section className="py-14 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Siga-nos nas Redes Sociais</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Acompanhe nosso trabalho, notícias, eventos e mantenha-se atualizado sobre as atividades 
              da Câmara Municipal de Jaíba.
            </p>
          </div>
          
          <div className="flex justify-center space-x-6 mb-10">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
               className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center 
                         hover:bg-blue-700 transition-colors">
              {React.createElement(Facebook, { size: 24 })}
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
               className="w-12 h-12 bg-sky-500 text-white rounded-full flex items-center justify-center 
                         hover:bg-sky-600 transition-colors">
              {React.createElement(Twitter, { size: 24 })}
            </a>
            <a href="https://instagram.com/camaradejaiba" target="_blank" rel="noopener noreferrer" 
               className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 
                         text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
              {React.createElement(Instagram, { size: 24 })}
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" 
               className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center 
                         hover:bg-red-700 transition-colors">
              {React.createElement(Youtube, { size: 24 })}
            </a>
          </div>
          
          {/* Feed do Instagram incorporado */}
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 
                              rounded-full flex items-center justify-center text-white mr-3">
                {React.createElement(Instagram, { size: 20 })}
              </div>
              <div>
                <h3 className="font-bold">@camaradejaiba</h3>
                <p className="text-sm text-gray-500">Feed do Instagram</p>
              </div>
            </div>
            
            <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded-lg">
              <iframe
                title="Instagram Feed"
                src="https://www.instagram.com/camaradejaiba/embed"
                className="w-full h-full border-0"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}