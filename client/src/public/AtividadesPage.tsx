import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  ChevronRight,
  User,
  Tag,
  Clock,
  ArrowUpDown,
  ListFilter,
  FileText
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getInitials } from '@/lib/utils';

// Interface para atividade legislativa
interface LegislativeActivity {
  id: number;
  title: string;
  type: string;
  number: string;
  date: string;
  status: string;
  description: string;
  authors: Author[];
  documents?: Document[];
  votes?: {
    favor: number;
    against: number;
    abstain: number;
  };
  tags?: string[];
}

// Interface para autor
interface Author {
  id: string;
  name: string;
  party: string;
  imageUrl?: string;
  position?: string;
}

// Interface para documento
interface Document {
  id: number;
  title: string;
  type: string;
  fileUrl?: string;
}

// Componente de card para atividade legislativa
const ActivityCard = ({ activity }: { activity: LegislativeActivity }) => {
  return (
    <Card className="h-full hover:shadow-md transition-all">
      <div className={`h-1 ${getStatusColor(activity.status)}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {activity.type} nº {activity.number}
          </CardTitle>
          <Badge className={getStatusColor(activity.status)}>
            {activity.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          {formatDate(activity.date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <h3 className="font-medium mb-2">{activity.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{activity.description}</p>
        
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {activity.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium mr-1">Autores:</span>
          <div className="flex -space-x-2">
            {activity.authors.slice(0, 3).map((author) => (
              <Avatar key={author.id} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={author.imageUrl} />
                <AvatarFallback className="bg-blue-700 text-white text-xs">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {activity.authors.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                +{activity.authors.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/public/atividades/${activity.id}`}>
          <Button variant="outline" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
            Ver detalhes <ChevronRight size={16} />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

// Função para formatar data
const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    return dateString;
  }
};

// Função para determinar a cor com base no status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'aprovado':
    case 'aprovada':
      return "bg-green-500 text-white";
    case 'em tramitação':
    case 'em análise':
      return "bg-yellow-500 text-white";
    case 'rejeitado':
    case 'rejeitada':
      return "bg-red-500 text-white";
    case 'arquivado':
    case 'arquivada':
      return "bg-gray-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
};

export default function AtividadesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Dados mockados de atividades legislativas
  const mockActivities: LegislativeActivity[] = [
    {
      id: 1,
      title: "Projeto de Lei para Criação do Programa de Coleta Seletiva nas Escolas",
      type: "Projeto de Lei",
      number: "045/2023",
      date: "2023-04-15",
      status: "Em tramitação",
      description: "Institui o Programa de Coleta Seletiva nas Escolas Municipais, visando a conscientização ambiental dos alunos e a redução de resíduos. O programa prevê a instalação de pontos de coleta nas escolas, capacitação de professores e atividades educativas.",
      authors: [
        {
          id: "1",
          name: "Ana Silva",
          party: "Partido A",
          imageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
          position: "Presidente"
        },
        {
          id: "3",
          name: "Mariana Oliveira",
          party: "Partido C",
          imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
          position: "Secretária"
        }
      ],
      documents: [
        {
          id: 101,
          title: "Texto do Projeto de Lei",
          type: "PDF",
          fileUrl: "/documentos/PL-045-2023.pdf"
        },
        {
          id: 102,
          title: "Justificativa",
          type: "PDF",
          fileUrl: "/documentos/PL-045-2023-justificativa.pdf"
        }
      ],
      votes: {
        favor: 5,
        against: 2,
        abstain: 1
      },
      tags: ["Meio Ambiente", "Educação", "Sustentabilidade"]
    },
    {
      id: 2,
      title: "Requerimento para Realização de Audiência Pública sobre Mobilidade Urbana",
      type: "Requerimento",
      number: "078/2023",
      date: "2023-05-10",
      status: "Aprovado",
      description: "Requer a realização de audiência pública para discutir o Plano de Mobilidade Urbana do município, com a participação da sociedade civil, especialistas e representantes do poder público. O objetivo é coletar sugestões e debater as diretrizes do plano.",
      authors: [
        {
          id: "2",
          name: "Carlos Santos",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
          position: "Vice-Presidente"
        }
      ],
      documents: [
        {
          id: 201,
          title: "Texto do Requerimento",
          type: "PDF",
          fileUrl: "/documentos/REQ-078-2023.pdf"
        }
      ],
      tags: ["Mobilidade Urbana", "Audiência Pública", "Planejamento"]
    },
    {
      id: 3,
      title: "Emenda ao Orçamento Municipal para Aumento de Recursos na Área da Saúde",
      type: "Emenda",
      number: "023/2023",
      date: "2023-04-02",
      status: "Aprovada",
      description: "Propõe a destinação de recursos adicionais para a área da saúde no orçamento municipal, visando a ampliação do atendimento nas unidades básicas e contratação de profissionais. A emenda prevê o remanejamento de dotações orçamentárias.",
      authors: [
        {
          id: "5",
          name: "Juliana Costa",
          party: "Partido D",
          imageUrl: "https://randomuser.me/api/portraits/women/23.jpg",
          position: "Vereadora"
        },
        {
          id: "4",
          name: "Ricardo Almeida",
          party: "Partido A",
          imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
          position: "Vereador"
        },
        {
          id: "6",
          name: "Paulo Ferreira",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/35.jpg",
          position: "Vereador"
        }
      ],
      documents: [
        {
          id: 301,
          title: "Texto da Emenda",
          type: "PDF",
          fileUrl: "/documentos/EMD-023-2023.pdf"
        },
        {
          id: 302,
          title: "Impacto Orçamentário",
          type: "PDF",
          fileUrl: "/documentos/EMD-023-2023-impacto.pdf"
        }
      ],
      votes: {
        favor: 7,
        against: 1,
        abstain: 0
      },
      tags: ["Saúde", "Orçamento", "Finanças"]
    },
    {
      id: 4,
      title: "Moção de Aplausos aos Profissionais da Educação",
      type: "Moção",
      number: "015/2023",
      date: "2023-05-20",
      status: "Aprovada",
      description: "Moção de aplausos e reconhecimento aos profissionais da educação municipal pelo excelente trabalho desenvolvido durante o período de retorno às aulas presenciais pós-pandemia. A moção destaca o compromisso e dedicação dos educadores.",
      authors: [
        {
          id: "3",
          name: "Mariana Oliveira",
          party: "Partido C",
          imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
          position: "Secretária"
        },
        {
          id: "1",
          name: "Ana Silva",
          party: "Partido A",
          imageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
          position: "Presidente"
        }
      ],
      documents: [
        {
          id: 401,
          title: "Texto da Moção",
          type: "PDF",
          fileUrl: "/documentos/MOC-015-2023.pdf"
        }
      ],
      votes: {
        favor: 8,
        against: 0,
        abstain: 0
      },
      tags: ["Educação", "Reconhecimento"]
    },
    {
      id: 5,
      title: "Projeto de Lei para Incentivo ao Comércio Local",
      type: "Projeto de Lei",
      number: "052/2023",
      date: "2023-03-25",
      status: "Em tramitação",
      description: "Cria o programa de incentivo ao comércio local, com redução de taxas e tributos municipais para pequenos empresários e microempreendedores. O projeto visa fortalecer a economia local e gerar empregos no município.",
      authors: [
        {
          id: "6",
          name: "Paulo Ferreira",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/35.jpg",
          position: "Vereador"
        },
        {
          id: "2",
          name: "Carlos Santos",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
          position: "Vice-Presidente"
        }
      ],
      documents: [
        {
          id: 501,
          title: "Texto do Projeto de Lei",
          type: "PDF",
          fileUrl: "/documentos/PL-052-2023.pdf"
        },
        {
          id: 502,
          title: "Estudo de Impacto Econômico",
          type: "PDF",
          fileUrl: "/documentos/PL-052-2023-estudo.pdf"
        }
      ],
      tags: ["Economia", "Comércio Local", "Desenvolvimento"]
    },
    {
      id: 6,
      title: "Indicação de Melhoria na Iluminação Pública do Bairro Central",
      type: "Indicação",
      number: "067/2023",
      date: "2023-05-05",
      status: "Encaminhada",
      description: "Indica ao Poder Executivo a necessidade de melhoria na iluminação pública do Bairro Central, com substituição das lâmpadas antigas por LED e instalação de novos postes em pontos estratégicos. A medida visa aumentar a segurança na região.",
      authors: [
        {
          id: "4",
          name: "Ricardo Almeida",
          party: "Partido A",
          imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
          position: "Vereador"
        }
      ],
      documents: [
        {
          id: 601,
          title: "Texto da Indicação",
          type: "PDF",
          fileUrl: "/documentos/IND-067-2023.pdf"
        }
      ],
      tags: ["Iluminação Pública", "Segurança", "Infraestrutura"]
    },
    {
      id: 7,
      title: "Projeto de Decreto Legislativo para Concessão de Título de Cidadão Honorário",
      type: "Projeto de Decreto Legislativo",
      number: "008/2023",
      date: "2023-04-12",
      status: "Aprovado",
      description: "Concede o título de Cidadão Honorário ao Dr. João Pereira, pelos relevantes serviços prestados na área da saúde do município, especialmente durante o período da pandemia de COVID-19. O homenageado atua há mais de 20 anos na rede municipal.",
      authors: [
        {
          id: "5",
          name: "Juliana Costa",
          party: "Partido D",
          imageUrl: "https://randomuser.me/api/portraits/women/23.jpg",
          position: "Vereadora"
        }
      ],
      documents: [
        {
          id: 701,
          title: "Texto do Projeto de Decreto",
          type: "PDF",
          fileUrl: "/documentos/PDL-008-2023.pdf"
        },
        {
          id: 702,
          title: "Biografia do Homenageado",
          type: "PDF",
          fileUrl: "/documentos/PDL-008-2023-biografia.pdf"
        }
      ],
      votes: {
        favor: 8,
        against: 0,
        abstain: 0
      },
      tags: ["Homenagem", "Saúde"]
    },
    {
      id: 8,
      title: "Requerimento de Informações sobre Obras Paralisadas",
      type: "Requerimento",
      number: "092/2023",
      date: "2023-05-18",
      status: "Aprovado",
      description: "Solicita informações ao Poder Executivo sobre as obras públicas paralisadas no município, incluindo os motivos da paralisação, valores já investidos e previsão para retomada. O objetivo é fiscalizar a aplicação dos recursos públicos.",
      authors: [
        {
          id: "2",
          name: "Carlos Santos",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
          position: "Vice-Presidente"
        },
        {
          id: "6",
          name: "Paulo Ferreira",
          party: "Partido B",
          imageUrl: "https://randomuser.me/api/portraits/men/35.jpg",
          position: "Vereador"
        }
      ],
      documents: [
        {
          id: 801,
          title: "Texto do Requerimento",
          type: "PDF",
          fileUrl: "/documentos/REQ-092-2023.pdf"
        }
      ],
      votes: {
        favor: 6,
        against: 2,
        abstain: 0
      },
      tags: ["Fiscalização", "Obras Públicas", "Transparência"]
    }
  ];

  // Simulando consulta à API para obter atividades
  const { data: activities = mockActivities } = useQuery({
    queryKey: ['/api/public/activities'],
    enabled: false,
    initialData: mockActivities
  });

  // Extrair tipos únicos de atividades
  const uniqueTypes = Array.from(new Set(activities.map(a => a.type)));
  
  // Extrair status únicos
  const uniqueStatuses = Array.from(new Set(activities.map(a => a.status)));
  
  // Extrair anos únicos
  const uniqueYears = Array.from(new Set(activities.map(a => {
    const year = new Date(a.date).getFullYear();
    return year.toString();
  }))).sort((a, b) => parseInt(b) - parseInt(a)); // Ordenar do mais recente para o mais antigo
  
  // Extrair todos os autores únicos
  const allAuthors = activities.flatMap(a => a.authors);
  const uniqueAuthors = Array.from(
    new Map(allAuthors.map(author => [author.id, author])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  
  // Extrair todas as tags únicas
  const allTags = activities.flatMap(a => a.tags || []);
  const uniqueTags = Array.from(new Set(allTags)).sort();

  // Aplicar filtros e ordenação
  const filteredActivities = activities
    .filter(activity => {
      // Filtro de pesquisa por texto
      const matchesSearch = 
        searchTerm === '' || 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por tipo de atividade
      const matchesType = typeFilter.length === 0 || typeFilter.includes(activity.type);
      
      // Filtro por status
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(activity.status);
      
      // Filtro por ano
      const matchesYear = !yearFilter || new Date(activity.date).getFullYear().toString() === yearFilter;
      
      // Filtro por autor
      const matchesAuthor = authorFilter.length === 0 || 
        activity.authors.some(author => authorFilter.includes(author.id));
      
      // Filtro por tag
      const matchesTag = tagFilter.length === 0 || 
        (activity.tags && activity.tags.some(tag => tagFilter.includes(tag)));
      
      return matchesSearch && matchesType && matchesStatus && matchesYear && matchesAuthor && matchesTag;
    })
    .sort((a, b) => {
      // Ordenação
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'type-asc':
          return a.type.localeCompare(b.type);
        case 'status-asc':
          return a.status.localeCompare(b.status);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Alternar seleção de tipo no filtro
  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  // Alternar seleção de status no filtro
  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  // Alternar seleção de autor no filtro
  const toggleAuthorFilter = (authorId: string) => {
    setAuthorFilter(prev => 
      prev.includes(authorId) 
        ? prev.filter(id => id !== authorId) 
        : [...prev, authorId]
    );
  };

  // Alternar seleção de tag no filtro
  const toggleTagFilter = (tag: string) => {
    setTagFilter(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter([]);
    setStatusFilter([]);
    setYearFilter('');
    setAuthorFilter([]);
    setTagFilter([]);
  };

  return (
    <>
      <Helmet>
        <title>Atividades Legislativas | Sistema Legislativo</title>
        <meta name="description" content="Acompanhe projetos de lei, requerimentos, moções e outras atividades legislativas da Câmara Municipal." />
      </Helmet>

      {/* Banner da página */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Atividades Legislativas</h1>
              <p className="text-blue-100 max-w-2xl">
                Acompanhe a tramitação de projetos de lei, requerimentos, moções e outras atividades legislativas.
                Conheça o trabalho dos vereadores e fiscalize o processo legislativo.
              </p>
            </div>
            <div className="hidden md:block">
              <Activity size={80} className="text-blue-200 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white border-b shadow-sm py-4 px-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-auto md:flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar atividades legislativas..."
                className="pl-9 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Mais recentes</SelectItem>
                  <SelectItem value="date-asc">Mais antigos</SelectItem>
                  <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                  <SelectItem value="type-asc">Tipo</SelectItem>
                  <SelectItem value="status-asc">Status</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ListFilter size={16} />
                    Filtros
                    {(typeFilter.length > 0 || statusFilter.length > 0 || yearFilter || authorFilter.length > 0 || tagFilter.length > 0) && (
                      <Badge className="ml-1 bg-blue-100 text-blue-800">
                        {typeFilter.length + statusFilter.length + (yearFilter ? 1 : 0) + authorFilter.length + tagFilter.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px] p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Filtros Aplicados</h3>
                      {(typeFilter.length === 0 && statusFilter.length === 0 && !yearFilter && authorFilter.length === 0 && tagFilter.length === 0) ? (
                        <p className="text-sm text-gray-500">Nenhum filtro aplicado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {typeFilter.map(type => (
                            <Badge key={type} variant="secondary" className="flex items-center gap-1">
                              {type}
                              <button onClick={() => toggleTypeFilter(type)} className="ml-1">×</button>
                            </Badge>
                          ))}
                          {statusFilter.map(status => (
                            <Badge key={status} variant="secondary" className="flex items-center gap-1">
                              {status}
                              <button onClick={() => toggleStatusFilter(status)} className="ml-1">×</button>
                            </Badge>
                          ))}
                          {yearFilter && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              Ano: {yearFilter}
                              <button onClick={() => setYearFilter('')} className="ml-1">×</button>
                            </Badge>
                          )}
                          {authorFilter.map(authorId => {
                            const author = uniqueAuthors.find(a => a.id === authorId);
                            return (
                              <Badge key={authorId} variant="secondary" className="flex items-center gap-1">
                                {author?.name || 'Autor'}
                                <button onClick={() => toggleAuthorFilter(authorId)} className="ml-1">×</button>
                              </Badge>
                            );
                          })}
                          {tagFilter.map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button onClick={() => toggleTagFilter(tag)} className="ml-1">×</button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {(typeFilter.length > 0 || statusFilter.length > 0 || yearFilter || authorFilter.length > 0 || tagFilter.length > 0) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 h-8 text-xs">
                          Limpar todos os filtros
                        </Button>
                      )}
                    </div>
                    
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="type">
                        <AccordionTrigger className="text-sm">Tipo de Atividade</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {uniqueTypes.map(type => (
                              <div key={type} className="flex items-center">
                                <input
                                  id={`type-${type}`}
                                  type="checkbox"
                                  className="mr-2"
                                  checked={typeFilter.includes(type)}
                                  onChange={() => toggleTypeFilter(type)}
                                />
                                <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="status">
                        <AccordionTrigger className="text-sm">Status</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {uniqueStatuses.map(status => (
                              <div key={status} className="flex items-center">
                                <input
                                  id={`status-${status}`}
                                  type="checkbox"
                                  className="mr-2"
                                  checked={statusFilter.includes(status)}
                                  onChange={() => toggleStatusFilter(status)}
                                />
                                <label htmlFor={`status-${status}`} className="text-sm">
                                  <Badge className={`${getStatusColor(status)} text-xs`}>{status}</Badge>
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="year">
                        <AccordionTrigger className="text-sm">Ano</AccordionTrigger>
                        <AccordionContent>
                          <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar ano" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todos os anos</SelectItem>
                              {uniqueYears.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="author">
                        <AccordionTrigger className="text-sm">Autor</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {uniqueAuthors.map(author => (
                              <div key={author.id} className="flex items-center">
                                <input
                                  id={`author-${author.id}`}
                                  type="checkbox"
                                  className="mr-2"
                                  checked={authorFilter.includes(author.id)}
                                  onChange={() => toggleAuthorFilter(author.id)}
                                />
                                <label htmlFor={`author-${author.id}`} className="text-sm flex items-center">
                                  <Avatar className="h-5 w-5 mr-1">
                                    <AvatarImage src={author.imageUrl} />
                                    <AvatarFallback className="text-xs">{getInitials(author.name)}</AvatarFallback>
                                  </Avatar>
                                  {author.name} ({author.party})
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="tag">
                        <AccordionTrigger className="text-sm">Tags</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {uniqueTags.map(tag => (
                              <div key={tag} className="flex items-center">
                                <input
                                  id={`tag-${tag}`}
                                  type="checkbox"
                                  className="mr-2"
                                  checked={tagFilter.includes(tag)}
                                  onChange={() => toggleTagFilter(tag)}
                                />
                                <label htmlFor={`tag-${tag}`} className="text-sm">
                                  <Badge variant="outline" className="font-normal">{tag}</Badge>
                                </label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de atividades legislativas */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-500 mb-4">
                Não foram encontradas atividades legislativas correspondentes aos filtros aplicados.
              </p>
              <Button onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Mostrando {filteredActivities.length} atividades legislativas
                  {(searchTerm || typeFilter.length > 0 || statusFilter.length > 0 || yearFilter || authorFilter.length > 0 || tagFilter.length > 0) && " com os filtros aplicados"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Seção informativa */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Sobre as Atividades Legislativas</h2>
              <p className="text-gray-600 mb-4">
                As atividades legislativas são todas as ações realizadas pelos vereadores no exercício de suas funções, 
                como a apresentação de projetos de lei, requerimentos, indicações, moções, entre outros.
              </p>
              <p className="text-gray-600">
                Por meio deste portal, você pode acompanhar todas as atividades desenvolvidas na Câmara Municipal, 
                conhecer os projetos em tramitação, os autores de cada proposta e o status atual de cada atividade.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Tipos de Atividades</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Projeto de Lei
                  </h4>
                  <p className="text-sm text-gray-600 ml-6">Proposta normativa que, se aprovada, se transforma em lei municipal.</p>
                </div>
                <div>
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Requerimento
                  </h4>
                  <p className="text-sm text-gray-600 ml-6">Solicita informações ou providências a órgãos públicos.</p>
                </div>
                <div>
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Indicação
                  </h4>
                  <p className="text-sm text-gray-600 ml-6">Sugere medidas de interesse público ao Poder Executivo.</p>
                </div>
                <div>
                  <h4 className="font-medium flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Moção
                  </h4>
                  <p className="text-sm text-gray-600 ml-6">Manifesta posição política sobre determinado assunto ou homenageia pessoas ou entidades.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}