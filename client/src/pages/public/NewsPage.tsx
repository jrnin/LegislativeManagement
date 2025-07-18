import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, Eye, Tag, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NewsArticle, NewsCategory } from "@shared/schema";
import { formatDate } from "@/lib/utils";

export default function PublicNewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Fetch published news articles
  const { data: newsData, isLoading: loadingNews } = useQuery({
    queryKey: ["/api/public/news", { search: searchTerm, category: selectedCategory }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Notícias</h1>
        <p className="text-gray-600 mb-6">
          Fique por dentro das últimas notícias e comunicados da Câmara Municipal
        </p>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar notícias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
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
      </div>

      {/* Lista de notícias */}
      {newsArticles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">Nenhuma notícia encontrada</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article: NewsArticle) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {article.imageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getStatusColor(article.status)}>
                    {getStatusText(article.status)}
                  </Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(article.createdAt)}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="h-4 w-4 mr-1" />
                    {article.authorName || "Autor"}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ler mais
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{selectedArticle?.title}</DialogTitle>
                      </DialogHeader>
                      {selectedArticle && (
                        <div className="space-y-4">
                          {selectedArticle.imageUrl && (
                            <div className="aspect-video overflow-hidden rounded-lg">
                              <img
                                src={selectedArticle.imageUrl}
                                alt={selectedArticle.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(selectedArticle.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {selectedArticle.authorName || "Autor"}
                            </div>
                            {selectedArticle.categoryName && (
                              <div className="flex items-center">
                                <Tag className="h-4 w-4 mr-1" />
                                {selectedArticle.categoryName}
                              </div>
                            )}
                          </div>

                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-800 font-medium mb-4">
                              {selectedArticle.excerpt}
                            </p>
                            <div 
                              className="text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                            />
                          </div>

                          {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedArticle.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}