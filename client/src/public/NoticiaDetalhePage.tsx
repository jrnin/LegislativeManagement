import React, { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link2, 
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Tag,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'wouter';

interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
  } | string;
  category: {
    id: number;
    name: string;
  } | string;
  tags: string[];
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const NoticiaDetalhePage = () => {
  const params = useParams();
  const articleId = parseInt(params.id || '1');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const { toast } = useToast();

  // Fetch single news article
  const { data: article, isLoading: articleLoading, error: articleError } = useQuery<NewsArticle>({
    queryKey: [`/api/public/news/${articleId}`],
    enabled: !!articleId,
  });

  // Fetch related articles
  const { data: relatedArticles } = useQuery<{ articles: NewsArticle[] }>({
    queryKey: [`/api/public/news?limit=3&exclude=${articleId}`],
    enabled: !!article,
  });

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando notícia...</p>
        </div>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Notícia não encontrada</h2>
          <p className="text-gray-600 mb-4">A notícia que você está procurando não existe ou foi removida.</p>
          <Link href="/noticias">
            <Button>
              <ArrowLeft size={16} className="mr-2" />
              Voltar para notícias
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR });
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

  const shareOnSocial = (platform: string) => {
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link da notícia foi copiado para sua área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getAuthorName = (author: NewsArticle['author']) => {
    return typeof author === 'object' && author?.name ? author.name : author;
  };

  const getCategoryName = (category: NewsArticle['category']) => {
    return typeof category === 'object' && category?.name ? category.name : category;
  };

  const getStatusColor = (status: NewsArticle['status']) => {
    const colors = {
      'published': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: NewsArticle['status']) => {
    const texts = {
      'published': 'Publicado',
      'draft': 'Rascunho',
      'archived': 'Arquivado',
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/noticias">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Voltar para notícias
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="mb-6 flex items-center gap-3">
              <Badge className={`${getCategoryColor(getCategoryName(article.category))} text-base px-3 py-1`}>
                {getCategoryName(article.category)}
              </Badge>
              {article.featured && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  ⭐ Destaque
                </Badge>
              )}
              <Badge className={`${getStatusColor(article.status)} text-xs px-2 py-1`}>
                {getStatusText(article.status)}
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{color: '#48654e'}}>
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center">
                <User size={16} className="mr-2" />
                <span>{getAuthorName(article.author)}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>Publicado em {formatDateTime(article.publishedAt || article.createdAt)}</span>
              </div>
              {article.updatedAt && new Date(article.updatedAt).getTime() !== new Date(article.createdAt).getTime() && (
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>Atualizado em {formatDateTime(article.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <Button
                  variant={liked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLiked(!liked)}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp size={16} />
                  <span>{liked ? 1 : 0}</span>
                </Button>
                
                <Button
                  variant={bookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBookmarked(!bookmarked)}
                >
                  <Bookmark size={16} />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 mr-2">Compartilhar:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('facebook')}
                  title="Compartilhar no Facebook"
                >
                  <Facebook size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('twitter')}
                  title="Compartilhar no Twitter"
                >
                  <Twitter size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('linkedin')}
                  title="Compartilhar no LinkedIn"
                >
                  <Linkedin size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('whatsapp')}
                  title="Compartilhar no WhatsApp"
                >
                  <Share2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  title="Copiar link"
                >
                  <Link2 size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {article.imageUrl && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-96 object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-ul:text-gray-700"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center" style={{color: '#48654e'}}>
                <Tag size={20} className="mr-2" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SEO Information */}
          {(article.seoTitle || article.seoDescription || article.seoKeywords) && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center" style={{color: '#48654e'}}>
                <FileText size={20} className="mr-2" />
                Informações SEO
              </h3>
              <div className="space-y-4">
                {article.seoTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Título SEO:</label>
                    <p className="text-sm text-gray-600 mt-1">{article.seoTitle}</p>
                  </div>
                )}
                {article.seoDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Descrição SEO:</label>
                    <p className="text-sm text-gray-600 mt-1">{article.seoDescription}</p>
                  </div>
                )}
                {article.seoKeywords && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Palavras-chave SEO:</label>
                    <p className="text-sm text-gray-600 mt-1">{article.seoKeywords}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles && relatedArticles.articles && relatedArticles.articles.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6" style={{color: '#48654e'}}>
                Notícias Relacionadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.articles.slice(0, 4).map((related) => (
                  <Link key={related.id} href={`/noticias/${related.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex">
                        {related.imageUrl && (
                          <div className="w-24 h-24 flex-shrink-0">
                            <img 
                              src={related.imageUrl} 
                              alt={related.title}
                              className="w-full h-full object-cover rounded-l-lg"
                            />
                          </div>
                        )}
                        <CardContent className="flex-1 p-4">
                          <Badge className={`${getCategoryColor(getCategoryName(related.category))} text-xs px-2 py-0.5`}>
                            {getCategoryName(related.category)}
                          </Badge>
                          <h4 className="font-semibold text-sm mt-2 mb-1 line-clamp-2">
                            {related.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {related.excerpt}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {formatDate(related.publishedAt || related.createdAt)}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticiaDetalhePage;