import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Search, Filter, FileText, User, Tag, Image as ImageIcon, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { NewsArticle, NewsCategory } from '@shared/schema';
import { formatDate } from '@/lib/utils';

const NoticiasPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch published news articles
  const { data: newsData, isLoading: loadingNews } = useQuery({
    queryKey: ["/api/public/news", { search: searchTerm, category: selectedCategory, page: currentPage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      params.append("page", currentPage.toString());
      params.append("limit", itemsPerPage.toString());
      
      const response = await fetch(`/api/public/news?${params}`);
      if (!response.ok) throw new Error("Erro ao carregar notícias");
      return response.json();
    },
  });

  // Fetch news categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["/api/public/news/categories"],
    queryFn: async () => {
      const response = await fetch("/api/public/news/categories");
      if (!response.ok) throw new Error("Erro ao carregar categorias");
      return response.json();
    },
  });

  const newsArticles = newsData?.articles || [];
  const pagination = newsData?.pagination || { page: 1, hasMore: false };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Publicado";
      case "draft":
        return "Rascunho";
      case "archived":
        return "Arquivado";
      default:
        return status;
    }
  };

  if (loadingNews || loadingCategories) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando notícias...</p>
        </div>
      </div>
    );
  }

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
              Mantenha-se informado sobre as últimas decisões, projetos e atividades da Câmara Municipal
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: NewsCategory) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {newsArticles.length} notícias
          </p>
        </div>

        {/* News Grid */}
        {newsArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {newsArticles.map((article: NewsArticle) => (
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
                  {!article.imageUrl && (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {typeof article.category === 'object' && article.category?.name ? article.category.name : article.category}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(article.status)}`}>
                      {getStatusText(article.status)}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold line-clamp-2 mb-3">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {article.excerpt}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <User size={14} />
                      <span>{typeof article.author === 'object' && article.author?.name ? article.author.name : article.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                  </div>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Link href={`/noticias/${article.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <FileText size={14} className="mr-2" />
                      Ler Notícia
                    </Button>
                  </Link>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 text-xs"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <Eye size={12} className="mr-1" />
                        Pré-visualizar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{article.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <User size={14} />
                              <span>{typeof article.author === 'object' && article.author?.name ? article.author.name : article.author}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar size={14} />
                              <span>{formatDate(article.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {typeof article.category === 'object' && article.category?.name ? article.category.name : article.category}
                          </Badge>
                        </div>
                        
                        {article.imageUrl && (
                          <div className="aspect-video overflow-hidden rounded-lg">
                            <img 
                              src={article.imageUrl} 
                              alt={article.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: article.content }} />
                        </div>
                        
                        {article.tags && article.tags.length > 0 && (
                          <div className="pt-4 border-t">
                            <div className="flex items-center space-x-2 mb-2">
                              <Tag size={16} />
                              <span className="font-medium">Tags:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhuma notícia encontrada.</p>
          </div>
        )}

        {/* Pagination */}
        {newsArticles.length > 0 && (
          <div className="flex justify-center items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="mr-2" />
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasMore}
            >
              Próxima
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiasPage;