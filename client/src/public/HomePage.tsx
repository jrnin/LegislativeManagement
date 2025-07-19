import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  FileText, 
  Users, 
  Gavel,
  ChevronRight,
  ArrowRight,
  Loader2,
  Clock,
  Eye,
  MapPin,
  Newspaper,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/400/300';
              }}
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

// Função auxiliar para obter iniciais
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function HomePage() {
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/public/news'],
    select: (data: any) => {
      if (!data || !data.articles || !Array.isArray(data.articles)) return [];
      
      return data.articles.map((article: any) => ({
        id: article.id,
        title: String(article.title || ''),
        excerpt: String(article.excerpt || article.content?.substring(0, 200) + '...' || ''),
        date: String(article.publishedDate || article.createdAt || ''),
        imageUrl: String(article.coverImage || '/api/placeholder/400/300'),
        category: String(article.category?.name || 'Notícias')
      }));
    }
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/public/events'],
    refetchInterval: 30000
  });

  const { data: councilors = [], isLoading: councilorLoading } = useQuery({
    queryKey: ['/api/public/councilors'],
    enabled: true
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/public/legislative-activities'],
    select: (data: any) => {
      const rawActivities = data?.activities || [];
      return rawActivities.map((activity: any) => ({
        id: activity.id,
        activityNumber: String(activity.activityNumber || ''),
        activityType: String(activity.activityType || 'Atividade'),
        description: String(activity.description || 'Sem descrição'),
        date: String(activity.activityDate || activity.createdAt || ''),
        status: String(activity.situacao || 'Em Tramitação'),
        authors: String(activity.authors || 'Não informado')
      }));
    }
  });
  
  const news = newsData || [];

  // Formatador de datas
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>Sistema Legislativo - Portal Público</title>
        <meta name="description" content="Portal público do Sistema Legislativo Municipal. Acesse informações sobre vereadores, documentos, atividades legislativas e mais." />
      </Helmet>

      {/* Seção Hero Principal com vista aérea */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 w-full h-full z-0">
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              className="pointer-events-none"
              style={{
                width: '100vw',
                height: '56.25vw',
                minHeight: '100vh',
                minWidth: '177.78vh',
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

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />
        
        {/* Conteúdo */}
        <div className="container mx-auto px-4 relative z-20">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Câmara Municipal
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Portal de Transparência e Participação Cidadã
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sessoes">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  <Calendar className="mr-2" size={20} />
                  Ver Sessões
                </Button>
              </Link>
              <Link href="/documentos">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  <FileText className="mr-2" size={20} />
                  Documentos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Próximas Sessões */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Calendar className="mr-3" style={{color: '#48654e'}} />
              Próximas Sessões
            </h2>
            <Link href="/sessoes">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {eventsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
              <p className="text-gray-600">Carregando sessões...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhuma sessão agendada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 6).map((event: any) => (
                <Link key={event.id} href={`/eventos/${event.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge variant="outline" className="mt-2">
                            {event.category}
                          </Badge>
                        </div>
                        <Badge variant={event.status === 'Aberto' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={16} className="mr-2" />
                          {formatDate(event.date)} às {event.time}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin size={16} className="mr-2" />
                          {event.location}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção de Notícias */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <FileText className="mr-3" style={{color: '#48654e'}} />
              Notícias e Publicações
            </h2>
            <Link href="/noticias">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {newsLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
              <p className="text-gray-600">Carregando notícias...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhuma notícia encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna da esquerda (maior, com carrossel) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    {/* Destaque principal com carrossel */}
                    {news.length > 0 && (
                      <Carousel opts={{ loop: true }} className="w-full mb-8">
                        <CarouselContent>
                          {news.slice(0, 3).map((item) => (
                            <CarouselItem key={item.id}>
                              <Link href={`/noticias/${item.id}`}>
                                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl cursor-pointer group">
                                  <img
                                    src={item.imageUrl} 
                                    alt={item.title}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.currentTarget.src = '/api/placeholder/400/300';
                                    }}
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
                              </Link>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    )}
                    
                    {/* Grid de notícias menores */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Coluna da direita (sidebar) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-4" style={{color: '#48654e'}}>
                    Últimas Publicações
                  </h3>
                  <div className="space-y-4">
                    {news.slice(0, 5).map((item) => (
                      <Link key={item.id} href={`/noticias/${item.id}`}>
                        <div className="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Seção de Vereadores */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Users className="mr-3" style={{color: '#48654e'}} />
              Nossos Vereadores(as)
            </h2>
            <Link href="/vereadores">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todos <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {councilorLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
              <p className="text-gray-600">Carregando vereadores...</p>
            </div>
          ) : councilors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhum vereador encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {councilors.slice(0, 12).map((councilor: any) => (
                <Link key={councilor.id} href={`/vereadores/${councilor.id}`}>
                  <div className="text-center group cursor-pointer">
                    <div className="relative mb-4">
                      <Avatar className="w-20 h-20 mx-auto border-4 border-transparent group-hover:border-blue-200 transition-colors">
                        <AvatarImage 
                          src={councilor.avatarUrl} 
                          alt={councilor.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg font-semibold" style={{backgroundColor: '#48654e', color: 'white'}}>
                          {getInitials(councilor.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <h3 className="font-semibold text-sm text-center leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {councilor.name}
                    </h3>
                    <p className="text-xs text-gray-500 text-center">
                      {councilor.politicalParty}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção de Últimas Atividades */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Gavel className="mr-3" style={{color: '#48654e'}} />
              Últimas Atividades Legislativas
            </h2>
            <Link href="/atividades">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {activitiesLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{color: '#48654e'}} />
              <p className="text-gray-600">Carregando atividades...</p>
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhuma atividade encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.slice(0, 6).map((activity: any) => (
                <Link key={activity.id} href={`/atividades/${activity.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="mb-2">
                          {activity.activityType}
                        </Badge>
                        <span className="text-sm font-medium text-gray-600">
                          Nº {activity.activityNumber}
                        </span>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {activity.description}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={14} className="mr-2" />
                          {formatDate(activity.date)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {activity.authors}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seção de Acesso Rápido */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/documentos">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-6">
                <FileText size={40} className="mx-auto mb-4" style={{color: '#48654e'}} />
                <h3 className="font-semibold text-lg mb-2">Documentos</h3>
                <p className="text-gray-600 text-sm">Acesse leis, decretos e documentos oficiais</p>
              </Card>
            </Link>
            
            <Link href="/comissoes">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-6">
                <Users size={40} className="mx-auto mb-4" style={{color: '#48654e'}} />
                <h3 className="font-semibold text-lg mb-2">Comissões</h3>
                <p className="text-gray-600 text-sm">Conheça as comissões e seus membros</p>
              </Card>
            </Link>
            
            <Link href="/mesa-diretora">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-6">
                <Building size={40} className="mx-auto mb-4" style={{color: '#48654e'}} />
                <h3 className="font-semibold text-lg mb-2">Mesa Diretora</h3>
                <p className="text-gray-600 text-sm">Veja a composição da Mesa Diretora</p>
              </Card>
            </Link>
            
            <Link href="/contato">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center p-6">
                <MapPin size={40} className="mx-auto mb-4" style={{color: '#48654e'}} />
                <h3 className="font-semibold text-lg mb-2">Contato</h3>
                <p className="text-gray-600 text-sm">Entre em contato conosco</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}