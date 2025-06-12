import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Eye, Filter, Search, Share2, Facebook, Twitter, Linkedin, Link2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  gallery?: string[];
  views: number;
  featured: boolean;
}

interface NewsFilters {
  category: string;
  search: string;
  dateRange: string;
  sortBy: string;
}

const categories = [
  'Todas',
  'Política',
  'Infraestrutura',
  'Saúde',
  'Educação',
  'Meio Ambiente',
  'Cultura',
  'Esporte',
  'Economia',
  'Social'
];

const NoticiasPage = () => {
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'Todas',
    search: '',
    dateRange: 'all',
    sortBy: 'recent'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Mock data - replace with real API call
  const mockNews: NewsArticle[] = [
    {
      id: 1,
      title: "Câmara aprova projeto que incentiva a reciclagem no município",
      content: "O projeto de lei que incentiva a reciclagem de resíduos sólidos foi aprovado por unanimidade na sessão de ontem. A nova legislação prevê benefícios fiscais para empresas que adotarem práticas sustentáveis e implementarem programas de coleta seletiva. A medida faz parte do plano municipal de sustentabilidade que visa reduzir em 40% a quantidade de resíduos enviados ao aterro sanitário até 2026.",
      excerpt: "O projeto de lei que incentiva a reciclagem de resíduos sólidos foi aprovado por unanimidade na sessão de ontem. A nova legislação prevê benefícios fiscais para empresas que adotarem práticas sustentáveis.",
      author: "Assessoria de Comunicação",
      publishedAt: "2025-06-10T10:00:00Z",
      category: "Meio Ambiente",
      tags: ["reciclagem", "sustentabilidade", "meio ambiente", "projeto de lei"],
      imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      views: 1247,
      featured: true
    },
    {
      id: 2,
      title: "Audiência pública discutirá mobilidade urbana na próxima semana",
      content: "Uma audiência pública para discutir o plano de mobilidade urbana será realizada na próxima semana. A população poderá enviar sugestões e participar ativamente das discussões sobre transporte público, ciclovias e melhorias no trânsito da cidade.",
      excerpt: "Uma audiência pública para discutir o plano de mobilidade urbana será realizada na próxima semana. A população poderá enviar sugestões e participar ativamente das discussões.",
      author: "Equipe Legislativa",
      publishedAt: "2025-06-08T14:30:00Z",
      category: "Infraestrutura",
      tags: ["mobilidade", "trânsito", "audiência pública", "participação"],
      imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      views: 856,
      featured: false
    },
    {
      id: 3,
      title: "Nova comissão para fiscalizar obras públicas é formada na Câmara",
      content: "Os vereadores formaram uma nova comissão especial para fiscalizar as obras públicas em andamento no município. O objetivo é garantir a qualidade dos serviços e a aplicação correta dos recursos públicos.",
      excerpt: "Os vereadores formaram uma nova comissão especial para fiscalizar as obras públicas em andamento no município. O objetivo é garantir a qualidade dos serviços.",
      author: "Mesa Diretora",
      publishedAt: "2025-06-05T09:15:00Z",
      category: "Política",
      tags: ["fiscalização", "obras públicas", "comissão", "transparência"],
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      views: 643,
      featured: false
    }
  ];

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Política': 'bg-blue-100 text-blue-800',
      'Infraestrutura': 'bg-orange-100 text-orange-800',
      'Saúde': 'bg-red-100 text-red-800',
      'Educação': 'bg-purple-100 text-purple-800',
      'Meio Ambiente': 'bg-green-100 text-green-800',
      'Cultura': 'bg-pink-100 text-pink-800',
      'Esporte': 'bg-yellow-100 text-yellow-800',
      'Economia': 'bg-indigo-100 text-indigo-800',
      'Social': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const shareOnSocial = (platform: string, article: NewsArticle) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(article.title);
    const description = encodeURIComponent(article.excerpt);

    const shareUrls: { [key: string]: string } = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title} ${url}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = (article: NewsArticle) => {
    navigator.clipboard.writeText(window.location.href);
    // You might want to show a toast notification here
  };

  const filteredNews = mockNews.filter(article => {
    const matchesCategory = filters.category === 'Todas' || article.category === filters.category;
    const matchesSearch = article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         article.content.toLowerCase().includes(filters.search.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const sortedNews = filteredNews.sort((a, b) => {
    switch (filters.sortBy) {
      case 'oldest':
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      case 'views':
        return b.views - a.views;
      case 'recent':
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  const totalPages = Math.ceil(sortedNews.length / itemsPerPage);
  const paginatedNews = sortedNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4" style={{color: '#48654e'}}>
              Notícias da Câmara Municipal
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Mantenha-se informado sobre as últimas decisões, projetos e atividades da Câmara Municipal de Jaíba
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter size={20} style={{color: '#48654e'}} />
              <span className="font-medium" style={{color: '#48654e'}}>Filtros:</span>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar notícias..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="views">Mais visualizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {paginatedNews.length} de {filteredNews.length} notícias
          </p>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedNews.map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                {article.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                {article.featured && (
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                    Destaque
                  </Badge>
                )}
                {article.gallery && article.gallery.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
                    <ImageIcon size={12} className="mr-1" />
                    {article.gallery.length}
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(article.category)}>
                    {article.category}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye size={12} className="mr-1" />
                    {article.views}
                  </div>
                </div>
                <h3 className="font-bold text-lg leading-tight hover:text-blue-600 transition-colors cursor-pointer">
                  <Link href={`/noticias/${article.id}`}>
                    {article.title}
                  </Link>
                </h3>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{article.author}</span>
                  <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {formatDate(article.publishedAt)}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center justify-between">
                  <Link href={`/noticias/${article.id}`}>
                    <Button variant="outline" size="sm">
                      Ler mais
                    </Button>
                  </Link>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareOnSocial('facebook', article)}
                      className="p-1 h-8 w-8"
                    >
                      <Facebook size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareOnSocial('twitter', article)}
                      className="p-1 h-8 w-8"
                    >
                      <Twitter size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => shareOnSocial('whatsapp', article)}
                      className="p-1 h-8 w-8"
                    >
                      <Share2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(article)}
                      className="p-1 h-8 w-8"
                    >
                      <Link2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* No results */}
        {filteredNews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou usar outros termos de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiasPage;