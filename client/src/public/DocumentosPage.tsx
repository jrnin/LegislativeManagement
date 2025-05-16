import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  List,
  Grid
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
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interface para documento
interface Document {
  id: number;
  title: string;
  type: string;
  number: string;
  date: string;
  category: string;
  status: string;
  author?: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  downloadCount?: number;
}

// Componente de card para documento
const DocumentCard = ({ document }: { document: Document }) => (
  <Card className="h-full hover:shadow-md transition-all">
    <div className={`h-1 ${getDocumentTypeColor(document.type)}`} />
    <CardHeader className="pb-2">
      <div className="flex justify-between">
        <Badge 
          variant="outline" 
          className={getDocumentTypeColor(document.type, true)}
        >
          {document.type}
        </Badge>
        <Badge variant="secondary">{document.number}</Badge>
      </div>
      <CardTitle className="text-base mt-2 line-clamp-2">{document.title}</CardTitle>
      <CardDescription className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {formatDate(document.date)}
      </CardDescription>
    </CardHeader>
    <CardContent className="pb-2 pt-0">
      {document.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{document.description}</p>
      )}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Categoria: {document.category}</span>
        {document.fileType && (
          <Badge variant="outline" className="text-xs">
            {document.fileType.toUpperCase()}
          </Badge>
        )}
      </div>
    </CardContent>
    <CardFooter className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1 gap-1">
        <Eye className="h-3 w-3" />
        Visualizar
      </Button>
      {document.fileUrl && (
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <Download className="h-3 w-3" />
          Download
        </Button>
      )}
    </CardFooter>
  </Card>
);

// Função para formatar data
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    return dateString;
  }
};

// Função para determinar a cor com base no tipo de documento
const getDocumentTypeColor = (type: string, isBadge: boolean = false) => {
  let colorClass = "";
  
  switch (type.toLowerCase()) {
    case "lei":
    case "lei complementar":
      colorClass = isBadge ? "text-green-800 bg-green-50" : "bg-green-500";
      break;
    case "decreto":
    case "decreto legislativo":
      colorClass = isBadge ? "text-blue-800 bg-blue-50" : "bg-blue-500";
      break;
    case "resolução":
      colorClass = isBadge ? "text-purple-800 bg-purple-50" : "bg-purple-500";
      break;
    case "portaria":
      colorClass = isBadge ? "text-yellow-800 bg-yellow-50" : "bg-yellow-500";
      break;
    case "parecer":
      colorClass = isBadge ? "text-orange-800 bg-orange-50" : "bg-orange-500";
      break;
    case "ata":
      colorClass = isBadge ? "text-teal-800 bg-teal-50" : "bg-teal-500";
      break;
    default:
      colorClass = isBadge ? "text-gray-800 bg-gray-50" : "bg-gray-500";
  }
  
  return colorClass;
};

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Dados mockados de documentos
  const mockDocuments: Document[] = [
    {
      id: 1,
      title: "Lei Orçamentária Anual 2023",
      type: "Lei",
      number: "123/2023",
      date: "2023-03-15",
      category: "Orçamento",
      status: "Aprovada",
      description: "Estima a receita e fixa a despesa do Município para o exercício financeiro de 2023.",
      fileUrl: "/documentos/lei_123_2023.pdf",
      fileType: "pdf",
      fileSize: "2.4 MB",
      downloadCount: 127
    },
    {
      id: 2,
      title: "Plano Diretor Municipal",
      type: "Lei Complementar",
      number: "021/2022",
      date: "2022-11-10",
      category: "Urbanismo",
      status: "Aprovada",
      description: "Institui o Plano Diretor do Município e estabelece as diretrizes e normas para o planejamento urbano.",
      fileUrl: "/documentos/lei_comp_021_2022.pdf",
      fileType: "pdf",
      fileSize: "5.7 MB",
      downloadCount: 243
    },
    {
      id: 3,
      title: "Resolução sobre o Regimento Interno da Câmara",
      type: "Resolução",
      number: "045/2022",
      date: "2022-09-20",
      category: "Legislativo",
      status: "Aprovada",
      description: "Altera dispositivos do Regimento Interno da Câmara Municipal.",
      fileUrl: "/documentos/resolucao_045_2022.pdf",
      fileType: "pdf",
      fileSize: "1.2 MB",
      downloadCount: 89
    },
    {
      id: 4,
      title: "Decreto de Nomeação de Servidores",
      type: "Decreto",
      number: "078/2023",
      date: "2023-02-05",
      category: "Administrativo",
      status: "Publicado",
      description: "Dispõe sobre a nomeação de servidores aprovados em concurso público.",
      fileUrl: "/documentos/decreto_078_2023.pdf",
      fileType: "pdf",
      fileSize: "850 KB",
      downloadCount: 56
    },
    {
      id: 5,
      title: "Portaria de Organização Administrativa",
      type: "Portaria",
      number: "032/2023",
      date: "2023-01-15",
      category: "Administrativo",
      status: "Publicada",
      description: "Dispõe sobre a organização administrativa da Câmara Municipal.",
      fileUrl: "/documentos/portaria_032_2023.pdf",
      fileType: "pdf",
      fileSize: "730 KB",
      downloadCount: 43
    },
    {
      id: 6,
      title: "Parecer da Comissão de Finanças sobre o Orçamento",
      type: "Parecer",
      number: "012/2023",
      date: "2023-03-10",
      category: "Orçamento",
      status: "Aprovado",
      description: "Parecer da Comissão de Finanças e Orçamento sobre o Projeto de Lei Orçamentária Anual 2023.",
      fileUrl: "/documentos/parecer_012_2023.pdf",
      fileType: "pdf",
      fileSize: "1.1 MB",
      downloadCount: 38
    },
    {
      id: 7,
      title: "Ata da Sessão Ordinária",
      type: "Ata",
      number: "015/2023",
      date: "2023-04-05",
      category: "Legislativo",
      status: "Aprovada",
      description: "Ata da 15ª Sessão Ordinária da Câmara Municipal realizada em 05 de abril de 2023.",
      fileUrl: "/documentos/ata_015_2023.pdf",
      fileType: "pdf",
      fileSize: "980 KB",
      downloadCount: 27
    },
    {
      id: 8,
      title: "Lei de Proteção Ambiental",
      type: "Lei",
      number: "128/2023",
      date: "2023-04-22",
      category: "Meio Ambiente",
      status: "Aprovada",
      description: "Estabelece normas de proteção ambiental e preservação dos recursos naturais no Município.",
      fileUrl: "/documentos/lei_128_2023.pdf",
      fileType: "pdf",
      fileSize: "3.2 MB",
      downloadCount: 95
    },
    {
      id: 9,
      title: "Decreto de Regulamentação do Trânsito",
      type: "Decreto",
      number: "082/2023",
      date: "2023-03-28",
      category: "Transporte",
      status: "Publicado",
      description: "Regulamenta o trânsito em áreas centrais do Município e estabelece horários de circulação.",
      fileUrl: "/documentos/decreto_082_2023.pdf",
      fileType: "pdf",
      fileSize: "1.5 MB",
      downloadCount: 72
    },
    {
      id: 10,
      title: "Lei de Incentivo à Cultura",
      type: "Lei",
      number: "131/2023",
      date: "2023-05-10",
      category: "Cultura",
      status: "Aprovada",
      description: "Institui o Programa Municipal de Incentivo à Cultura e estabelece mecanismos de fomento.",
      fileUrl: "/documentos/lei_131_2023.pdf",
      fileType: "pdf",
      fileSize: "2.1 MB",
      downloadCount: 63
    },
    {
      id: 11,
      title: "Parecer da Comissão de Educação",
      type: "Parecer",
      number: "018/2023",
      date: "2023-05-05",
      category: "Educação",
      status: "Aprovado",
      description: "Parecer da Comissão de Educação sobre o Projeto de Lei de Reforma Educacional.",
      fileUrl: "/documentos/parecer_018_2023.pdf",
      fileType: "pdf",
      fileSize: "920 KB",
      downloadCount: 41
    },
    {
      id: 12,
      title: "Ata da Audiência Pública",
      type: "Ata",
      number: "003/2023",
      date: "2023-04-18",
      category: "Participação Popular",
      status: "Aprovada",
      description: "Ata da Audiência Pública realizada para discutir o Plano de Mobilidade Urbana.",
      fileUrl: "/documentos/ata_ap_003_2023.pdf",
      fileType: "pdf",
      fileSize: "1.3 MB",
      downloadCount: 58
    }
  ];

  // Simulando consulta à API para obter documentos
  const { data: documents = mockDocuments } = useQuery({
    queryKey: ['/api/public/documents'],
    enabled: false,
    initialData: mockDocuments
  });

  // Extrair tipos únicos de documentos
  const uniqueTypes = Array.from(new Set(documents.map(d => d.type)));
  
  // Extrair categorias únicas
  const uniqueCategories = Array.from(new Set(documents.map(d => d.category)));
  
  // Extrair anos únicos
  const uniqueYears = Array.from(new Set(documents.map(d => {
    const year = new Date(d.date).getFullYear();
    return year.toString();
  }))).sort((a, b) => parseInt(b) - parseInt(a)); // Ordenar do mais recente para o mais antigo

  // Aplicar filtros e ordenação
  const filteredDocuments = documents
    .filter(doc => {
      // Filtro de pesquisa por texto
      const matchesSearch = 
        searchTerm === '' || 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por tipo de documento
      const matchesType = typeFilter.length === 0 || typeFilter.includes(doc.type);
      
      // Filtro por categoria
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(doc.category);
      
      // Filtro por ano
      const matchesYear = !yearFilter || new Date(doc.date).getFullYear().toString() === yearFilter;
      
      return matchesSearch && matchesType && matchesCategory && matchesYear;
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
        case 'downloads-desc':
          return (b.downloadCount || 0) - (a.downloadCount || 0);
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

  // Alternar seleção de categoria no filtro
  const toggleCategoryFilter = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter([]);
    setCategoryFilter([]);
    setYearFilter('');
  };

  return (
    <>
      <Helmet>
        <title>Documentos | Sistema Legislativo</title>
        <meta name="description" content="Acesse leis, decretos, resoluções, portarias e outros documentos oficiais da Câmara Municipal." />
      </Helmet>

      {/* Banner da página */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Documentos Oficiais</h1>
              <p className="text-blue-100 max-w-2xl">
                Acesse leis, decretos, resoluções, portarias e outros documentos oficiais. 
                Todos os documentos estão disponíveis para consulta e download.
              </p>
            </div>
            <div className="hidden md:block">
              <FileText size={80} className="text-blue-200 opacity-70" />
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
                placeholder="Buscar documentos..."
                className="pl-9 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Tipo
                    {typeFilter.length > 0 && (
                      <Badge className="ml-1 bg-blue-100 text-blue-800">{typeFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tipos de Documento</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueTypes.map(type => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={typeFilter.includes(type)}
                      onCheckedChange={() => toggleTypeFilter(type)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Categoria
                    {categoryFilter.length > 0 && (
                      <Badge className="ml-1 bg-blue-100 text-blue-800">{categoryFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueCategories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={categoryFilter.includes(category)}
                      onCheckedChange={() => toggleCategoryFilter(category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os anos</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Mais recentes</SelectItem>
                  <SelectItem value="date-asc">Mais antigos</SelectItem>
                  <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                  <SelectItem value="downloads-desc">Mais baixados</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none rounded-l-md"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none rounded-r-md"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {(searchTerm || typeFilter.length > 0 || categoryFilter.length > 0 || yearFilter) && (
                <Button variant="ghost" onClick={clearFilters} className="text-blue-600">
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de documentos */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não foram encontrados documentos correspondentes aos filtros aplicados.
              </p>
              <Button onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Mostrando {filteredDocuments.length} documentos
                  {(searchTerm || typeFilter.length > 0 || categoryFilter.length > 0 || yearFilter) && " com os filtros aplicados"}
                </p>
              </div>

              {viewMode === 'grid' ? (
                // Visualização em grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredDocuments.map(document => (
                    <DocumentCard key={document.id} document={document} />
                  ))}
                </div>
              ) : (
                // Visualização em lista
                <div className="bg-white rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Tipo</TableHead>
                        <TableHead className="w-[120px]">Número</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead className="w-[120px]">Data</TableHead>
                        <TableHead className="w-[120px]">Categoria</TableHead>
                        <TableHead className="w-[100px]">Arquivo</TableHead>
                        <TableHead className="text-right w-[120px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map(document => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getDocumentTypeColor(document.type, true)}
                            >
                              {document.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{document.number}</TableCell>
                          <TableCell>
                            <div className="font-medium">{document.title}</div>
                            {document.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">{document.description}</div>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(document.date)}</TableCell>
                          <TableCell>{document.category}</TableCell>
                          <TableCell>
                            {document.fileType && (
                              <div className="flex items-center">
                                <Badge variant="outline" className="text-xs">
                                  {document.fileType.toUpperCase()} {document.fileSize && `• ${document.fileSize}`}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-blue-600">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {document.fileUrl && (
                              <Button variant="ghost" size="icon" className="text-blue-600">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Seção de informações sobre documentos */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Sobre os Documentos Oficiais</h2>
              <p className="text-gray-600 mb-4">
                Os documentos oficiais são instrumentos legais e administrativos que regulam o funcionamento do poder legislativo
                e sua relação com os cidadãos e demais órgãos públicos.
              </p>
              <p className="text-gray-600">
                Através desta página, você pode acessar, consultar e baixar todos os documentos produzidos pela Câmara Municipal,
                garantindo transparência e acesso à informação.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Tipos de Documentos</h2>
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Leis</h3>
                  <p className="text-sm text-gray-600">Normas jurídicas que estabelecem direitos, deveres e obrigações.</p>
                </div>
                <div>
                  <h3 className="font-medium">Decretos</h3>
                  <p className="text-sm text-gray-600">Atos administrativos que regulamentam leis ou dispõem sobre organização administrativa.</p>
                </div>
                <div>
                  <h3 className="font-medium">Resoluções</h3>
                  <p className="text-sm text-gray-600">Atos normativos que tratam de matérias de interesse interno da Câmara.</p>
                </div>
                <div>
                  <h3 className="font-medium">Portarias</h3>
                  <p className="text-sm text-gray-600">Atos administrativos que tratam de assuntos internos ou determinações específicas.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}