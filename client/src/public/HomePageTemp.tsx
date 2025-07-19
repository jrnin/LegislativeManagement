import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Loader2,
  Newspaper,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function HomePage() {
  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['/api/public/news'],
    select: (data: any) => {
      if (!data || !data.articles || !Array.isArray(data.articles)) return [];
      
      return data.articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt || article.content?.substring(0, 200) + '...',
        date: article.publishedDate || article.createdAt,
        imageUrl: article.coverImage || '/api/placeholder/400/300',
        category: article.category?.name || 'Notícias'
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

      {/* Seção de notícias com layout de duas colunas */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FileText className="mr-2" style={{color: '#48654e'}} />
              Notícias e Publicações
            </h2>
            <Link href="/noticias">
              <a className="hover:underline mt-2 sm:mt-0 flex items-center" style={{color: '#48654e'}}>
                Ver todas <ChevronRight size={16} />
              </a>
            </Link>
          </div>
          
          {/* Seção de notícias */}
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    {/* Destaque principal com carrossel */}
                    {news.length > 0 && (
                      <Carousel
                        opts={{ loop: true }}
                        className="w-full mb-8"
                      >
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
    </>
  );
}