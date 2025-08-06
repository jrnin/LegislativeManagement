import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Document } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Edit,
  FileText,
  History,
  MoreHorizontal,
  Plus,
  Search,
  Trash2, 
  Download,
  Filter,
  Grid,
  List,
  Users,
  Building,
  Eye,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { formatDateSimpleSafe } from "@/lib/dateUtils";

export default function DocumentList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterAuthor, setFilterAuthor] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const documents: Document[] = useMemo(() => {
    if (!documentsResponse) return [];
    if (Array.isArray(documentsResponse)) return documentsResponse;
    if (documentsResponse && typeof documentsResponse === 'object' && 'documents' in documentsResponse) {
      return (documentsResponse as any).documents || [];
    }
    return [];
  }, [documentsResponse]);

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir documento",
        description: error.message,
      });
    },
  });

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
      setShowDeleteAlert(false);
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      "Pauta": "bg-blue-100 text-blue-800",
      "Decreto": "bg-green-100 text-green-800",
      "Decreto Legislativo": "bg-purple-100 text-purple-800",
      "Lei Complementar": "bg-red-100 text-red-800",
      "Oficio": "bg-yellow-100 text-yellow-800",
      "Parecer": "bg-orange-100 text-orange-800",
      "Ata": "bg-indigo-100 text-indigo-800",
      "Lista de Presença": "bg-teal-100 text-teal-800"
    };
    
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      "Vigente": "bg-green-100 text-green-800",
      "Revogada": "bg-red-100 text-red-800",
      "Alterada": "bg-yellow-100 text-yellow-800",
      "Suspenso": "bg-purple-100 text-purple-800"
    };
    
    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getAuthorTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "Legislativo" ? "default" : "secondary"}>
        {type}
      </Badge>
    );
  };

  // Enhanced filtering logic
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentNumber?.toString().includes(searchTerm);
      
      const matchesStatus = !filterStatus || filterStatus === "todos" || doc.status === filterStatus;
      const matchesType = !filterType || filterType === "todos" || doc.documentType === filterType;
      const matchesAuthor = !filterAuthor || filterAuthor === "todos" || doc.authorType === filterAuthor;
      
      return matchesSearch && matchesStatus && matchesType && matchesAuthor;
    });
  }, [documents, searchTerm, filterStatus, filterType, filterAuthor]);

  // Document statistics
  const documentStats = useMemo(() => {
    const totalDocuments = documents.length;
    const vigentDocuments = documents.filter(doc => doc.status === "Vigente").length;
    const documentTypes = Array.from(new Set(documents.map(doc => doc.documentType))).filter(type => type && type.trim() !== "");
    const authorTypes = Array.from(new Set(documents.map(doc => doc.authorType))).filter(type => type && type.trim() !== "");
    
    return { totalDocuments, vigentDocuments, documentTypes, authorTypes };
  }, [documents]);

  const { totalDocuments, vigentDocuments, documentTypes, authorTypes } = documentStats;

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: "documentNumber",
      header: "Número",
      cell: ({ row }) => {
        const number = row.getValue("documentNumber") as number;
        const type = row.original.documentType;
        const date = row.original.documentDate;
        const year = new Date(date).getFullYear();
        
        return (
          <div 
            className="flex flex-col cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate(`/documents/${row.original.id}`)}
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {type} Nº {number}/{year}
              </span>
            </div>
            
          </div>
        );
      },
    },
    {
      accessorKey: "documentDate",
      header: "Data",
      cell: ({ row }) => {
        const date = row.getValue("documentDate") as string;
        return (
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formatDateSimpleSafe(date)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "authorType",
      header: "Autor",
      cell: ({ row }) => {
        const authorType = row.getValue("authorType") as string;
        return getAuthorTypeBadge(authorType);
      },
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-xs truncate" title={description}>
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Situação",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return getStatusBadge(status);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const document = row.original;
        const isAdmin = user?.role === "admin";
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              
              {document.filePath && (
                <DropdownMenuItem 
                  onClick={() => window.open(`/api/files/documents/${document.id}`, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Arquivo
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => navigate(`/documents/${document.id}`)}>
                <History className="mr-2 h-4 w-4" />
                Ver Histórico
              </DropdownMenuItem>
              
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate(`/documents/${document.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => handleDeleteDocument(document)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredDocuments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Grid view component
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDocuments.map((doc) => (
        <Card 
          key={doc.id} 
          className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => navigate(`/documents/${doc.id}`)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{doc.documentType}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">#{doc.documentNumber}</Badge>
                  {getStatusBadge(doc.status || "")}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {doc.filePath && (
                    <DropdownMenuItem 
                      onClick={() => window.open(`/api/files/documents/${doc.id}`, '_blank')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar
                  </DropdownMenuItem>
                  
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">
                {doc.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {doc.documentDate ? formatDateSimpleSafe(doc.documentDate) : 'Data não informada'}
                </div>
                {getAuthorTypeBadge(doc.authorType || "")}
              </div>
              {doc.fileName && (
                <div className="flex items-center text-xs text-blue-600">
                  <FileText className="mr-1 h-3 w-3" />
                  Arquivo disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      {/* Header with stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Documentos</h1>
            <p className="text-gray-500 mt-1">Gerencie todos os documentos legislativos</p>
          </div>
          {user?.role === "admin" && (
            <Button onClick={() => navigate("/documents/new")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Novo Documento
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Badge className="h-8 w-8 bg-green-100 text-green-600 flex items-center justify-center">
                  <span className="text-xs font-bold">V</span>
                </Badge>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vigentes</p>
                  <p className="text-2xl font-bold text-gray-900">{vigentDocuments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tipos</p>
                  <p className="text-2xl font-bold text-gray-900">{documentTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Autores</p>
                  <p className="text-2xl font-bold text-gray-900">{authorTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por descrição ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Vigente">Vigente</SelectItem>
                  <SelectItem value="Revogada">Revogada</SelectItem>
                  <SelectItem value="Alterada">Alterada</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAuthor} onValueChange={setFilterAuthor}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Autor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os autores</SelectItem>
                  {authorTypes.map(author => (
                    <SelectItem key={author} value={author}>{author}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Carregando documentos...</p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-500 mb-4">
              {documents.length === 0 
                ? "Ainda não há documentos cadastrados no sistema." 
                : "Tente ajustar os filtros para encontrar o que procura."}
            </p>
            {user?.role === "admin" && documents.length === 0 && (
              <Button onClick={() => navigate("/documents/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Documento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Mostrando {filteredDocuments.length} de {totalDocuments} documentos
            </p>
          </div>
          
          {viewMode === 'grid' ? (
            <GridView />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            Nenhum documento encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between space-x-2 p-4">
                  <div className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} documento(s) no total.
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{selectedDocument?.documentType} #{selectedDocument?.documentNumber}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
