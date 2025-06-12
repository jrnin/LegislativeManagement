import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
  Bookmark
} from 'lucide-react';
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
  updatedAt?: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  gallery?: string[];
  views: number;
  likes: number;
  featured: boolean;
  relatedArticles?: number[];
}

const NoticiaDetalhePage = () => {
  const params = useParams();
  const articleId = parseInt(params.id || '1');
  const [currentGalleryImage, setCurrentGalleryImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Mock data - replace with real API call
  const article: NewsArticle = {
    id: articleId,
    title: "Câmara aprova projeto que incentiva a reciclagem no município",
    content: `
      <p>O projeto de lei que incentiva a reciclagem de resíduos sólidos foi aprovado por unanimidade na sessão de ontem. A nova legislação prevê benefícios fiscais para empresas que adotarem práticas sustentáveis e implementarem programas de coleta seletiva.</p>
      
      <p>A medida faz parte do plano municipal de sustentabilidade que visa reduzir em 40% a quantidade de resíduos enviados ao aterro sanitário até 2026. O projeto foi proposto pelo vereador João Silva e contou com o apoio de toda a bancada.</p>
      
      <h3>Principais benefícios do projeto:</h3>
      <ul>
        <li>Redução de 15% no IPTU para empresas que implementarem coleta seletiva</li>
        <li>Isenção de taxas municipais para cooperativas de reciclagem</li>
        <li>Criação de pontos de coleta em todos os bairros da cidade</li>
        <li>Programa de educação ambiental nas escolas municipais</li>
      </ul>
      
      <p>O vereador João Silva destacou a importância da medida: "Este projeto representa um marco na política ambiental do nosso município. Estamos criando incentivos concretos para que empresas e cidadãos adotem práticas mais sustentáveis."</p>
      
      <p>A implementação do projeto começará no próximo mês, com a instalação dos primeiros pontos de coleta seletiva nos bairros centrais. A prefeitura tem prazo de 90 dias para regulamentar a lei e iniciar a concessão dos benefícios fiscais.</p>
      
      <h3>Impacto esperado</h3>
      <p>Segundo estudos da Secretaria de Meio Ambiente, a medida poderá resultar em:</p>
      <ul>
        <li>Redução de 40% nos resíduos enviados ao aterro sanitário</li>
        <li>Geração de 200 novos empregos diretos na cadeia de reciclagem</li>
        <li>Economia de R$ 2 milhões anuais em custos de destinação de resíduos</li>
        <li>Melhoria significativa na qualidade ambiental da cidade</li>
      </ul>
      
      <p>A população pode acompanhar a implementação do projeto através do portal da transparência da prefeitura, onde serão publicados relatórios mensais sobre o andamento das ações.</p>
    `,
    excerpt: "O projeto de lei que incentiva a reciclagem de resíduos sólidos foi aprovado por unanimidade na sessão de ontem. A nova legislação prevê benefícios fiscais para empresas que adotarem práticas sustentáveis.",
    author: "Assessoria de Comunicação",
    publishedAt: "2025-06-10T10:00:00Z",
    updatedAt: "2025-06-10T15:30:00Z",
    category: "Meio Ambiente",
    tags: ["reciclagem", "sustentabilidade", "meio ambiente", "projeto de lei", "benefícios fiscais"],
    imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    ],
    views: 1247,
    likes: 89,
    featured: true,
    relatedArticles: [2, 3]
  };

  const relatedNews = [
    {
      id: 2,
      title: "Audiência pública discutirá mobilidade urbana na próxima semana",
      excerpt: "Uma audiência pública para discutir o plano de mobilidade urbana será realizada na próxima semana.",
      category: "Infraestrutura",
      publishedAt: "2025-06-08T14:30:00Z",
      imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 3,
      title: "Nova comissão para fiscalizar obras públicas é formada na Câmara",
      excerpt: "Os vereadores formaram uma nova comissão especial para fiscalizar as obras públicas em andamento no município.",
      category: "Política",
      publishedAt: "2025-06-05T09:15:00Z",
      imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    }
  ];

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // Show toast notification
  };

  const nextGalleryImage = () => {
    if (article.gallery && article.gallery.length > 0) {
      setCurrentGalleryImage((prev) => (prev + 1) % article.gallery.length);
    }
  };

  const prevGalleryImage = () => {
    if (article.gallery && article.gallery.length > 0) {
      setCurrentGalleryImage((prev) => (prev - 1 + article.gallery.length) % article.gallery.length);
    }
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
            <div className="mb-6">
              <Badge className={`${getCategoryColor(article.category)} text-base px-3 py-1`}>
                {article.category}
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{color: '#48654e'}}>
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center">
                <User size={16} className="mr-2" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span>Publicado em {formatDateTime(article.publishedAt)}</span>
              </div>
              {article.updatedAt && (
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  <span>Atualizado em {formatDateTime(article.updatedAt)}</span>
                </div>
              )}
              <div className="flex items-center">
                <Eye size={16} className="mr-2" />
                <span>{article.views} visualizações</span>
              </div>
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
                  <span>{article.likes + (liked ? 1 : 0)}</span>
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
                >
                  <Facebook size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('twitter')}
                >
                  <Twitter size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('linkedin')}
                >
                  <Linkedin size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnSocial('whatsapp')}
                >
                  <Share2 size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
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

          {/* Image Gallery */}
          {article.gallery && article.gallery.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-bold mb-4" style={{color: '#48654e'}}>
                Galeria de Imagens ({article.gallery.length})
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {article.gallery.map((image, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div 
                        className="relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setCurrentGalleryImage(index);
                          setIsGalleryOpen(true);
                        }}
                      >
                        <img 
                          src={image} 
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="text-white opacity-0 hover:opacity-100 transition-opacity">
                            <Eye size={24} />
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full p-0">
                      <div className="relative">
                        <img 
                          src={article.gallery ? article.gallery[currentGalleryImage] : ''} 
                          alt={`Imagem ${currentGalleryImage + 1}`}
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                        
                        {article.gallery && article.gallery.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90"
                              onClick={prevGalleryImage}
                            >
                              <ChevronLeft size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90"
                              onClick={nextGalleryImage}
                            >
                              <ChevronRight size={16} />
                            </Button>
                          </>
                        )}
                        
                        {article.gallery && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                            {currentGalleryImage + 1} de {article.gallery.length}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
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

          {/* Related Articles */}
          {relatedNews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold mb-6" style={{color: '#48654e'}}>
                Notícias Relacionadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedNews.map((related) => (
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
                          <Badge className={`${getCategoryColor(related.category)} text-xs px-2 py-0.5`}>
                            {related.category}
                          </Badge>
                          <h4 className="font-semibold text-sm mt-2 mb-1 line-clamp-2">
                            {related.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {related.excerpt}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {formatDate(related.publishedAt)}
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