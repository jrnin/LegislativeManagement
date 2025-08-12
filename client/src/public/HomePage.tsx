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
  Loader2,
  Clock,
  Eye,
  Users2,
  MapPin,
  Home,
  GraduationCap,
  Heart,
  Briefcase,
  Scissors,
  Car,
  CreditCard,
  AlertTriangle,
  FolderOpen,
  Newspaper,
  Theater,
  Edit,
  Shield,
  FileCheck,
  DollarSign,
  CreditCard as Payment,
  UserCheck,
  Clock as Time,
  Globe,
  Building2,
  FileBarChart,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import WeatherWidget from "@/components/WeatherWidget";

// Função auxiliar para obter iniciais
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};
// Componente para exibir as últimas atividades legislativas
const LegislativeActivitiesWidget = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['/api/public/legislative-activities', { limit: 3 }],
    queryFn: async () => {
      const response = await fetch('/api/public/legislative-activities?limit=3&page=1');
      if (!response.ok) {
        throw new Error('Erro ao buscar atividades');
      }
      return response.json();
    },
    select: (data: any) => {
      const rawActivities = data?.activities || [];
      return rawActivities.slice(0, 3); // Garantir apenas 3 atividades mais recentes
    }
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tramitação Finalizada':
        return 'bg-green-100 text-green-800';
      case 'Arquivado':
        return 'bg-gray-100 text-gray-800';
      case 'Aguardando Análise':
        return 'bg-blue-100 text-blue-800';
      case 'Análise de Parecer':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aguardando Deliberação':
        return 'bg-orange-100 text-orange-800';
      case 'Aguardando Despacho do Presidente':
        return 'bg-purple-100 text-purple-800';
      case 'Aguardando Envio ao Executivo':
        return 'bg-indigo-100 text-indigo-800';
      case 'Devolvida ao Autor':
        return 'bg-red-100 text-red-800';
      case 'Pronta para Pauta':
        return 'bg-cyan-100 text-cyan-800';
      case 'Tramitando em Conjunto':
        return 'bg-teal-100 text-teal-800';
      case 'Vetado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status || 'Status não informado';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin" style={{color: '#48654e'}} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities?.map((activity: any) => (
        <Link key={activity.id} href={`/public/atividades/${activity.id}`}>
          <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-l-8 border-l-green-700">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm leading-tight" style={{color: '#48654e'}}>
                      {activity.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {activity.type || 'Atividade Legislativa'}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                    {getStatusText(activity.status)}
                  </Badge>
                </div>
                
                {activity.description && (
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {activity.description.substring(0, 100)}...
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 ">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    {formatDate(activity.sessionDate || activity.date || activity.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Eye size={12} className="mr-1" />
                    Ver detalhes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      
      {(!activities || activities.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma atividade encontrada</p>
        </div>
      )}
      
      <div className="text-center mt-6">
        <Link href="/public/atividades">
          <Button variant="outline" size="sm" className="text-sm">
            <FileText className="mr-2" size={16} />
            Ver Todas as Atividades
          </Button>
        </Link>
      </div>
    </div>
  );
};

// Interface para QuickServiceCard
interface QuickServiceCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  external?: boolean;
}

const QuickServiceCard = ({ title, description, icon: Icon, href, external = false }: QuickServiceCardProps) => {
  const handleClick = () => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  if (external) {
    return (
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-95 border-0 bg-white/80 backdrop-blur-sm" onClick={handleClick}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg transition-colors" style={{backgroundColor: '#007825'}}>
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
            <ChevronRight size={20} className="text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-95 border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg transition-colors" style={{backgroundColor: '#007825'}}>
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
            <ChevronRight size={20} className="text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

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
  <Link href={`/noticias/${id}`}>
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
  <Link href={`/public/eventos/${id}`}>
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
  </Link>
);

// Dados mockados para serviços rápidos
const quickServices = [
  {
    title: "Transparência",
    description: "Acesse informações sobre orçamento, despesas e receitas",
    icon: PieChart,
    href: "https://cmjaiba.cidadesmg.com.br/portaltransparencia/index.xhtml",
    external: true
  },
  {
    title: "Atividades",
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
    title: "Documentos",
    description: "Acesse documentos oficiais, atas de reuniões e registros públicos",
    icon: FileText,
    href: "/public/documentos"
  },
  {
    title: "Estrutura Organizacional",
    description: "Consulte leis, decretos, portarias e toda a legislação municipal",
    icon: Gavel,
    href: "https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/estruturaOrganizacional/estruturaOrganizacional.xhtml",
      external: true,
  },
  {
    title: "Licitações",
    description: "Informações sobre processos licitatórios, contratos e convênios",
    icon: FileSearch,
    href: "https://cmjaiba.cidadesmg.com.br/portaltransparencia/index.xhtml?pagina=Licita%C3%A7%C3%B5es,%20Contrata%C3%A7%C3%B5es%20e%20Compras",
    external: true,
  },
  {
    title: "Recursos Humanos",
    description: "Dados orçamentários, despesas, receitas e relatórios fiscais",
    icon: PieChart,
    href: "https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/recursosHumanos/recursosHumanos.xhtml",
      external: true,
  },
  {
    title: "Diárias",
    description: "Confira as Diárias do legislativo, consultas e transparência",
    icon: Building,
    href: "https://cmjaiba.cidadesmg.com.br/portaltransparencia/publica/execucaoOrcamentaria/diarias/diarias.xhtml",
      external: true,
  }
];
// Dados dos serviços por categoria
const servicesData = {
  
  acessoRapido: [
    { title: "Portal da Transparência", icon: Eye, color: "bg-green-600" },
    { title: "Nota Fiscal Eletrônica", icon: FileCheck, color: "bg-blue-600", url: "https://jaibamg.webiss.com.br/"  },
    { title: "Ouvidoria Municipal", icon: Users, color: "bg-orange-600" },
    { title: "E-SIC - Informações", icon: Shield, color: "bg-purple-600" },
    { title: "Licitações e Contratos", icon: FileBarChart, color: "bg-red-600" },
    { title: "Portal do Cidadão", icon: UserCheck, color: "bg-teal-600" },
    { title: "Agenda de Eventos", icon: Calendar, color: "bg-indigo-600" },
    { title: "Notícias Municipais", icon: Newspaper, color: "bg-yellow-600" }
  ],
  servidor: [
    { title: "Portal do Servidor", icon: UserCheck, color: "bg-blue-700" },
    { title: "Contracheque Online", icon: DollarSign, color: "bg-green-700" },
    { title: "Férias e Licenças", icon: Time, color: "bg-orange-700" },
    { title: "Benefícios", icon: Heart, color: "bg-red-700" },
    { title: "Treinamentos", icon: GraduationCap, color: "bg-purple-700" },
    { title: "Avaliação de Desempenho", icon: TrendingUp, color: "bg-teal-700" },
    { title: "Protocolo Interno", icon: FileText, color: "bg-indigo-700" },
    { title: "Suporte Técnico", icon: Building2, color: "bg-gray-700" }
  ],
  empresas: [
    { title: "Alvará de Funcionamento", icon: Building2, color: "bg-blue-800" },
    { title: "CNPJ - Consulta", icon: FileSearch, color: "bg-green-800" },
    { title: "Tributos Empresariais", icon: Payment, color: "bg-orange-800" },
    { title: "Licenciamento Ambiental", icon: Globe, color: "bg-teal-800" },
    { title: "Nota Fiscal Eletrônica", icon: FileBarChart, color: "bg-purple-800" },
    { title: "Cadastro de Fornecedores", icon: Building, color: "bg-red-800" },
    { title: "Parcelamento de Débitos", icon: DollarSign, color: "bg-yellow-800" },
    { title: "Certidões Negativas", icon: Shield, color: "bg-indigo-800" }
  ]
};

export default function HomePage() {
  const [activeServiceTab, setActiveServiceTab] = useState('acessoRapido');
  
  // Consulta real à API para obter dados de eventos
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/public/events'],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  const { data: councilors = [], isLoading: councilorLoading } = useQuery({
    queryKey: ['/api/public/councilors'],
    enabled: true
  });

  const { data: newsResponse, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/public/news'],
    enabled: true
  });
  
  const news = newsResponse?.articles || [];



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
        <title>Câmara de Jaíba - Poder Legislativo</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Seção Hero Principal com vista aérea */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              className="pointer-events-none"
              style={{
                width: '100vw',
                height: '56.25vw', // 16:9 aspect ratio (9/16 = 0.5625)
                minHeight: '100vh',
                minWidth: '177.78vh', // 16:9 aspect ratio (16/9 = 1.7778)
                objectFit: 'cover'
              }}
              src="https://www.youtube.com/embed/z7FA7JA16vc?si=k87KmctYgy4BBauV&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playlist=z7FA7JA16vc"
              title="Vídeo de fundo da Câmara Municipal"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Overlay escuro para melhorar legibilidade do texto */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Transparência, participação e democracia ao alcance de todos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vereadores">
                <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100 ">
                  <Users className="mr-2" />
                  Conheça os Vereadores
                </Button>
              </Link>
              <Link href="/documentos">
                <Button size="lg" variant="outline" className="border-white text-green-700 hover:bg-white hover:text-green-700">
                  <FileText className="mr-2" />
                  Documentos Públicos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Serviços Rápidos */}
      <section className="py-4 px-2 bg-white">
        <div className="max-w-7xl mx-auto px-4">     
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickServices.slice(0, 8).map((service, index) => (
              <QuickServiceCard
                key={index}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
                external={service.external}
              />
            ))}
          </div>
        </div>
      </section>

  

      {/* Seção de notícias com layout de duas colunas */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2" style={{color: '#48654e'}} />
              Notícias e Publicações
            </h2>
            <Link href="/noticias">
              <span className="hover:underline mt-2 sm:mt-0 flex items-center cursor-pointer" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </span>
            </Link>
          </div>
          
          {/* Seção de notícias do banco de dados - Layout responsivo 3 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna principal (maior) - ocupa mais espaço */}
            <div className="lg:col-span-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">                
                  {newsLoading ? (
                    <div className="flex justify-center items-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin" style={{color: '#48654e'}} />
                    </div>
                  ) : news.length > 0 ? (
                    <>
                      {/* Destaque principal com carrossel */}
                      <Carousel
                        opts={{ 
                          loop: true,
                          autoplay: true,
                          autoplayDelay: 5000
                        }}
                        className="w-full mb-8"
                      >
                        <CarouselContent>
                          {news.slice(0, 2).map((item) => (
                            <CarouselItem key={item.id}>
                              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                                <img
                                  src={item.coverImage || item.imageUrl || '/api/placeholder/400/300'} 
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                                  <Badge className="self-start mb-3 text-xs" style={{backgroundColor: '#48654e'}}>
                                    {item.category?.name || item.category || 'Notícia'}
                                  </Badge>
                                  <h3 className="text-white text-xl font-bold mb-2 line-clamp-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-gray-200 text-sm line-clamp-2 mb-3">
                                    {item.excerpt || item.content?.slice(0, 150) + '...'}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs">{formatDate(item.createdAt || item.date)}</span>
                                    <Link href={`/noticias/${item.id}`}>
                                      <Button size="sm" variant="secondary" className="text-xs">
                                        Ler mais
                                      </Button>
                                    </Link>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {news.slice(2, 4).map((item) => (
                          <NewsCard
                            key={item.id}
                            id={item.id}
                            title={item.title}
                            excerpt={item.excerpt || item.content?.slice(0, 100) + '...'}
                            date={formatDate(item.createdAt || item.date)}
                            imageUrl={item.coverImage || item.imageUrl}
                            category={item.category?.name || item.category || 'Notícia'}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Newspaper className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                      <p className="text-lg">Nenhuma notícia encontrada</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Segunda coluna - Últimos eventos */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-md p-4 h-full">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center" style={{color: '#48654e'}}>
                  <Calendar className="mr-2" style={{color: '#48654e'}} size={20} />
                  Últimos Eventos
                </h3>
                
                {eventsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" style={{color: '#48654e'}} />
                  </div>
                ) : events.length > 0 ? (
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                    <p className="text-sm">Nenhum evento próximo</p>
                  </div>
                )}
                
                {events.length > 0 && (
                  <Link href="/public/sessoes">
                    <Button variant="ghost" size="sm" className="w-full mt-4 hover:opacity-80" style={{color: '#48654e'}}>
                      Ver agenda completa
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Terceira coluna - Clima e outros widgets */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
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
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { day: 'Seg', temp: '27°', icon: Sun, desc: 'Ensolarado' },
                      { day: 'Ter', temp: '25°', icon: CloudSun, desc: 'Parcialmente nublado' },
                      { day: 'Qua', temp: '26°', icon: Cloud, desc: 'Nublado' },
                      { day: 'Qui', temp: '24°', icon: CloudRain, desc: 'Chuva' },
                    ].map((item, index) => (
                      <div key={index} className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs font-medium mb-1">{item.day}</div>
                        <div style={{color: '#7FA653'}}>
                          {React.createElement(item.icon, { size: 16 })}
                        </div>
                        <div className="text-xs font-semibold mt-1">{item.temp}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget de Dados Demográficos - Jaíba/MG */}
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center" style={{color: '#48654e'}}>
                    <Building className="mr-2" style={{color: '#7FA653'}} size={20} />
                    Jaíba em Números
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {/* População */}
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users2 size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">População</p>
                        <p className="text-sm font-medium text-blue-700">37.000</p>
                      </div>
                    </div>

                    {/* Área */}
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Área</p>
                        <p className="text-sm font-medium text-green-700">1.182 km²</p>
                      </div>
                    </div>

                    {/* PIB per capita */}
                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Briefcase size={16} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">PIB per capita</p>
                        <p className="text-sm font-medium text-yellow-700">R$ 28.450</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Fonte: IBGE - Censo 2022
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Vereadores e Atividades Legislativas - Layout em Duas Colunas */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto px-4"> {/*
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4" style={{backgroundColor: '#48654e'}}>
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-bold" style={{color: '#48654e'}}>Vereadores e Atividades Legislativas</h2>
                <p className="text-gray-500 text-sm">2025-2028</p>
              </div>
            </div>
          </div>*/}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Coluna da Esquerda - Vereadores (2/3 do espaço) */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-bold mb-6" style={{color: '#48654e'}}>Nossos Vereadores</h3>
              
              {councilorLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 animate-spin" style={{color: '#48654e'}} />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Primeira linha - 6 vereadores */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4">
                    {(councilors?.length > 0 ? councilors : []).slice(0, 13).map((councilor, index) => (
                      <Link key={councilor.id} href={`/public/vereadores/${councilor.id}`}>
                        <div className="group cursor-pointer text-center">
                          <div className="relative mb-3">
                            {councilor.role && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                                {councilor.role === 'Presidente' && (
                                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                    Presidente
                                  </div>
                                )}
                                {councilor.role === 'Vice-Presidente' && (
                                  <div className="bg-red-400 text-white px-2 py-1 rounded text-xs font-bold">
                                    Vice-Presidente
                                  </div>
                                )}
                                {councilor.role === 'Secretário' && (
                                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                                    Secretário
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="w-280 h-370 mx-auto rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200 group-hover:border-gray-300">
                              {councilor.profileImageUrl ? (
                                <img 
                                  src={councilor.profileImageUrl} 
                                  alt={councilor.name}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor: '#8aa88a'}}>
                                  {getInitials(councilor.name)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-xs font-medium group-hover:opacity-80 transition-opacity duration-300" style={{color: '#48654e'}}>
                              {councilor.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {/*{councilor.partido || councilor.occupation || "Vereador"}*/}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Segunda linha - 6 vereadores 
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {(councilors?.length > 0 ? councilors : []).slice(6, 12).map((councilor, index) => (
                      <Link key={councilor.id} href={`/public/vereadores/${councilor.id}`}>
                        <div className="group cursor-pointer text-center">
                          <div className="relative mb-3">
                            {councilor.role && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                                {councilor.role === 'Presidente' && (
                                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                    Presidente
                                  </div>
                                )}
                                {councilor.role === 'Vice-Presidente' && (
                                  <div className="bg-red-400 text-white px-2 py-1 rounded text-xs font-bold">
                                    Vice-Presidente
                                  </div>
                                )}
                                {councilor.role === 'Secretário' && (
                                  <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                                    Secretário
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="w-280 h-370 mx-auto rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200 group-hover:border-gray-300">
                              {councilor.profileImageUrl ? (
                                <img 
                                  src={councilor.profileImageUrl} 
                                  alt={councilor.name}
                                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor: '#8aa88a'}}>
                                  {getInitials(councilor.name)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold group-hover:opacity-80 transition-opacity duration-300" style={{color: '#48654e'}}>
                              {councilor.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {councilor.partido || councilor.occupation || "Vereador"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>*/}
                </div>
              )}
              
              <div className="text-center mt-8">
                <Link href="/public/vereadores">
                  <Button size="lg" className="text-white hover:opacity-90 transition-all duration-300"
                          style={{backgroundColor: '#007825'}}>
                    <Users className="mr-3" size={20} />
                    Ver Todos os Vereadores
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Coluna da Direita - Atividades Legislativas (1/3 do espaço) */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold mb-6" style={{color: '#48654e'}}>Últimas Atividades Legislativas</h3>
              <LegislativeActivitiesWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Vídeos da Câmara Municipal */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{color: '#48654e'}}>
              Vídeos da Câmara Municipal
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Acompanhe as sessões, eventos e atividades da Câmara Municipal de Jaíba
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Vídeo 1 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative aspect-video bg-gray-200 cursor-pointer group" onClick={() => window.open('https://www.youtube.com/watch?v=CtQ_cixDOpE', '_blank')}>
                <img 
                  src="https://img.youtube.com/vi/aZNrMCohdRw/maxresdefault.jpg"
                  alt="12ª Reunião Ordinária"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://img.youtube.com/vi/aZNrMCohdRw/hqdefault.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-2" style={{color: '#48654e'}}>
                  12ª Reunião Ordinária 01/08/2025
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  Acompanhe a sessão ordinária com as principais deliberações e votações da Câmara Municipal.
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Eye className="h-3 w-3 mr-1" />
                  <span>Visualizações: 1.2k</span>
                </div>
              </CardContent>
            </Card>

            {/* Vídeo 2 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative aspect-video bg-gray-200 cursor-pointer group" onClick={() => window.open('https://www.youtube.com/watch?v=hcESKWXjRdY', '_blank')}>
                <img 
                  src="https://img.youtube.com/vi/hcESKWXjRdY/maxresdefault.jpg"
                  alt="Sessão Ordinária Janeiro"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://img.youtube.com/vi/hcESKWXjRdY/hqdefault.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-2" style={{color: '#48654e'}}>
                  Sessão Ordinária - Janeiro 2025
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  Acompanhe a sessão ordinária com as principais deliberações e votações da Câmara Municipal.
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>15 de Janeiro, 2025</span>
                </div>
              </CardContent>
            </Card>

            {/* Vídeo 3 */}
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative aspect-video bg-gray-200 cursor-pointer group" onClick={() => window.open('https://www.youtube.com/watch?v=RUL_vTIvUPQ', '_blank')}>
                <img 
                  src="https://img.youtube.com/vi/RUL_vTIvUPQ/maxresdefault.jpg"
                  alt="Audiência Pública Orçamento"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://img.youtube.com/vi/RUL_vTIvUPQ/hqdefault.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base mb-2" style={{color: '#48654e'}}>
                  Audiência Pública - Orçamento
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  Audiência pública para discussão do orçamento municipal e projetos prioritários da cidade.
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Users className="h-3 w-3 mr-1" />
                  <span>Participação Cidadão</span>
                </div>
              </CardContent>
            </Card>

            {/* Widget Meteorológico */}
            <WeatherWidget variant="detailed" className="h-full" />
          </div>

          {/* Link para o canal completo */}
          <div className="text-center">
            <a 
              href="https://www.youtube.com/@C%C3%A2maraMunicipaldeJa%C3%ADba" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Button size="lg" className="text-white hover:opacity-90 transition-all duration-300"
                      style={{backgroundColor: '#48654e'}}>
                <Youtube className="mr-3" size={20} />
                Ver Canal Completo no YouTube
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Seção Central de Serviços */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#48654e'}}>
                  <Building className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold" style={{color: '#2d3748'}}>
                  Central de Serviços
                </h2>
              </div>
            </div>
            
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <span className="text-sm font-medium text-gray-600">Exibir:</span>
              </div>
              <div className="flex space-x-6">
                
                <button 
                  onClick={() => setActiveServiceTab('acessoRapido')}
                  className={`text-sm font-medium pb-1 transition-colors ${
                    activeServiceTab === 'acessoRapido' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500 hover:text-purple-600'
                  }`}
                >
                  Acesso Rápido
                </button>
                <button 
                  onClick={() => setActiveServiceTab('servidor')}
                  className={`text-sm font-medium pb-1 transition-colors ${
                    activeServiceTab === 'servidor' 
                      ? 'text-yellow-600 border-b-2 border-yellow-600' 
                      : 'text-gray-500 hover:text-yellow-600'
                  }`}
                >
                  Servidor
                </button>
                <button 
                  onClick={() => setActiveServiceTab('empresas')}
                  className={`text-sm font-medium pb-1 transition-colors ${
                    activeServiceTab === 'empresas' 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-gray-500 hover:text-blue-400'
                  }`}
                >
                  Empresas
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesData[activeServiceTab as keyof typeof servicesData].map((service, index) => {
              const IconComponent = service.icon;
              const cardContent = (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 bg-gray-50 cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full ${service.color} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {service.title}
                      </h3>
                    </div>
                  </div>
                </Card>
              );

              // Se o serviço tem URL, envolver com link
              if ((service as any).url) {
                return (
                  <a 
                    key={index} 
                    href={(service as any).url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {cardContent}
                  </a>
                );
              }

              return cardContent;
            })}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 hover:bg-gray-50 transition-all duration-300"
              style={{borderColor: '#48654e', color: '#48654e'}}
            >
              <Building className="mr-3" size={20} />
              Ver Todos os Serviços
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </div>
        </div>
      </section>

    
    </>
  );
}