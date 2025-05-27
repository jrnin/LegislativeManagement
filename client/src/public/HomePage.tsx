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

      {/* Seção Hero Principal com vídeo de fundo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 w-full h-full z-0">
          <iframe
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              width: '1900',
              height: '600',
              transform: 'scale(1.2)',
              transformOrigin: 'center center'
            }}
            src="https://www.youtube.com/embed/l7VAs92qEXA?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playlist=l7VAs92qEXA"
            title="Vídeo de fundo da Câmara Municipal"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        
        {/* Overlay escuro para melhorar legibilidade do texto */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sistema Legislativo
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Transparência, participação e democracia ao alcance de todos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-green-700 hover:bg-gray-100">
                <Users className="mr-2" />
                Conheça os Vereadores
              </Button>
              <Button size="lg" variant="outline" className="border-white text-green-700 hover:bg-white hover:text-green-700">
                <FileText className="mr-2" />
                Documentos Públicos
              </Button>
            </div>
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

      {/* Seção de Serviços por Categoria */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{color: '#63783D'}}>Serviços</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Acesse os serviços disponíveis organizados por categoria
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Serviços para População */}
            <div className="bg-blue-600 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-8 text-white">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Users size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">População</h3>
                </div>
                
                <div className="flex items-center mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                    alt="Atendimento ao cidadão"
                    className="w-24 h-24 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Água - 2ª via e débitos
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Atendimento Genergy
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Banco de dados ambiental
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Carta de serviços
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Cartilha de arborização
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Consulta de débitos
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Dados cadastrais imóvel
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Diário Oficial
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Serviços para Empresas */}
            <div className="bg-green-600 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-8 text-white">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <Building size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Empresas</h3>
                </div>
                
                <div className="flex items-center mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                    alt="Serviços empresariais"
                    className="w-24 h-24 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Consulta de débitos
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        DECAM
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        ICMS/DIPAM
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Legislação ISSQN
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        NFe e outros
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Notas fiscais
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        PPLI
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Verificar documentos
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Serviços para Funcionários */}
            <div className="bg-orange-500 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-8 text-white">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <FileText size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Funcionários</h3>
                </div>
                
                <div className="flex items-center mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                    alt="Serviços para funcionários"
                    className="w-24 h-24 rounded-lg object-cover mr-4"
                  />
                  <div className="flex-1">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Denúncias - Assédio Moral
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Gestão administrativa
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Holerite online
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        Informe de rendimentos
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                        RH WEB
                      </li>
                    </ul>
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

                {/* Grid de notícias menores */}
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
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
      </section>

      {/* Nova seção de vereadores com design moderno */}
      <section className="py-20 px-4 relative overflow-hidden" style={{background: 'linear-gradient(135deg, #48654e 0%, #253529 100%)'}}>
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-40 h-40 opacity-5 rounded-full" style={{backgroundColor: '#8aa88a'}}></div>
          <div className="absolute bottom-10 right-20 w-32 h-32 opacity-5 rounded-full" style={{backgroundColor: '#8aa88a'}}></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 opacity-5 rounded-full" style={{backgroundColor: '#8aa88a'}}></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Nossos Vereadores
            </h2>
            <p className="text-white/90 text-lg max-w-3xl mx-auto leading-relaxed">
              Conheça os representantes eleitos que trabalham incansavelmente pelo desenvolvimento da nossa cidade
            </p>
          </div>
          
          {councilorLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-white" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 lg:gap-10">
              {(councilors?.length > 0 ? councilors : mockCouncilors).slice(0, 5).map((councilor, index) => (
                <Link key={councilor.id} href={`/public/vereadores/${councilor.id}`}>
                  <div className="group cursor-pointer text-center transform transition-all duration-300 hover:scale-105">
                    {/* Container da imagem */}
                    <div className="relative mb-6">
                      <div className="relative">
                        <div className="w-67 h-90 mx-auto border-2 border-white/40 group-hover:border-white transition-all duration-300 shadow-lg rounded-lg overflow-hidden" style={{width: '270px', height: '360px'}}>
                          {councilor.profileImageUrl ? (
                            <img 
                              src={councilor.profileImageUrl} 
                              alt={councilor.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold" style={{backgroundColor: '#8aa88a'}}>
                              {getInitials(councilor.name)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Badge de destaque para o primeiro vereador */}
                      {index === 0 && (
                        <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-xl"
                             style={{backgroundColor: '#8aa88a'}}>
                          <Users size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Informações do vereador */}
                    <div className="text-white space-y-3">
                      <h3 className="text-xl lg:text-2xl font-bold group-hover:opacity-80 transition-opacity duration-300">
                        {councilor.name}
                      </h3>
                      <p className="text-white/90 text-base font-medium">
                        {councilor.party || councilor.occupation || "Vereador(a)"}
                      </p>
                      {councilor.role && (
                        <Badge className="text-sm px-3 py-1 text-white border-2" 
                               style={{backgroundColor: 'rgba(138, 168, 138, 0.3)', borderColor: '#8aa88a'}}>
                          {councilor.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/public/vereadores">
              <Button size="lg" className="text-white border-2 px-8 py-3 text-lg font-semibold hover:opacity-90 transition-all duration-300"
                      style={{backgroundColor: 'rgba(138, 168, 138, 0.2)', borderColor: '#8aa88a'}}>
                <Users className="mr-3" size={24} />
                Ver Todos os Vereadores
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de estatísticas */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{color: '#63783D'}}>Transparência em Números</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Dados atualizados sobre as atividades e gestão da Câmara Municipal
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "247", label: "Projetos de Lei", icon: FileText },
              { number: "89", label: "Sessões Realizadas", icon: Calendar },
              { number: "15", label: "Vereadores Ativos", icon: Users },
              { number: "156", label: "Documentos Públicos", icon: Building }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#CFE0BC'}}>
                  {React.createElement(stat.icon, { size: 32, color: '#63783D' })}
                </div>
                <div className="text-3xl font-bold mb-2" style={{color: '#7FA653'}}>{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de redes sociais */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{color: '#63783D'}}>Siga-nos nas Redes Sociais</h2>
            <p className="text-gray-600">
              Fique por dentro das últimas notícias e atividades da Câmara
            </p>
          </div>
          
          <div className="flex justify-center space-x-6">
            {[
              { icon: Facebook, color: "#1877F2", name: "Facebook" },
              { icon: Instagram, color: "#E4405F", name: "Instagram" },
              { icon: Twitter, color: "#1DA1F2", name: "Twitter" },
              { icon: Youtube, color: "#FF0000", name: "YouTube" }
            ].map((social, index) => (
              <a
                key={index}
                href="#"
                className="w-12 h-12 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                style={{ backgroundColor: social.color }}
                aria-label={social.name}
              >
                {React.createElement(social.icon, { size: 24 })}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}