import { useState, useEffect, useMemo } from "react";
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
import { LegislativeActivity } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarCheck,
  ChevronLeft, 
  ChevronRight, 
  Edit,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ThumbsUp,
  ThumbsDown,
  Trash2, 
  Users,
  Download
} from "lucide-react";
import { formatDateSimpleSafe } from "@/lib/dateUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ActivityList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedActivity, setSelectedActivity] = useState<LegislativeActivity | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);
  const [approvalAction, setApprovalAction] = useState<boolean>(false);
  
  // Filtros específicos
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [selectedSituation, setSelectedSituation] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Buscar todas as atividades uma vez e filtrar no frontend
  const { data: allActivities = [], isLoading } = useQuery<LegislativeActivity[]>({
    queryKey: ["/api/activities"],
    staleTime: 60000, // Cache for 1 minute
  });

  // Filtrar no frontend para melhor performance
  const activities = useMemo(() => {
    let filtered = allActivities;

    // Filtro por texto (busca) - usa debounced search
    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      const search = debouncedSearchTerm.trim().toLowerCase();
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(search) ||
        activity.activityNumber.toString().includes(search)
      );
    }

    // Filtro por tipo
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.activityType === selectedType);
    }

    // Filtro por autor
    if (selectedAuthor && selectedAuthor !== 'all') {
      filtered = filtered.filter(activity => 
        activity.authors?.some(author => author.id === selectedAuthor)
      );
    }

    // Filtro por situação
    if (selectedSituation && selectedSituation !== 'all') {
      filtered = filtered.filter(activity => activity.situacao === selectedSituation);
    }

    // Filtro por evento
    if (selectedEvent && selectedEvent !== 'all') {
      const eventId = parseInt(selectedEvent);
      filtered = filtered.filter(activity => activity.eventId === eventId);
    }

    return filtered;
  }, [allActivities, debouncedSearchTerm, selectedType, selectedAuthor, selectedSituation, selectedEvent]);

  // Buscar lista de usuários para filtro de autores
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Buscar lista de eventos para filtro de eventos
  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (activityId: number) => {
      await apiRequest("DELETE", `/api/activities/${activityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Atividade excluída",
        description: "A atividade legislativa foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir atividade",
        description: error.message,
      });
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ activityId, approved }: { activityId: number; approved: boolean }) => {
      await apiRequest("PUT", `/api/activities/${activityId}`, { approved });
    },
    onSuccess: () => {
      toast({
        title: "Aprovação atualizada",
        description: "O status de aprovação foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar aprovação",
        description: error.message,
      });
    },
  });

  const handleDeleteActivity = (activity: LegislativeActivity) => {
    setSelectedActivity(activity);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (selectedActivity) {
      deleteMutation.mutate(selectedActivity.id);
      setShowDeleteAlert(false);
    }
  };

  const handleApproval = (activity: LegislativeActivity, approved: boolean) => {
    setSelectedActivity(activity);
    setApprovalAction(approved);
    setShowApprovalAlert(true);
  };

  const confirmApproval = () => {
    if (selectedActivity) {
      approvalMutation.mutate({ 
        activityId: selectedActivity.id, 
        approved: approvalAction 
      });
      setShowApprovalAlert(false);
    }
  };

  const isUserAuthor = (activity: LegislativeActivity) => {
    return activity.authors?.some(author => author.id === user?.id);
  };

  const canEditActivity = (activity: LegislativeActivity) => {
    return user?.role === "admin" || isUserAuthor(activity);
  };

  const getActivityTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      "Pauta": "bg-blue-100 text-blue-800",
      "Indicação": "bg-green-100 text-green-800",
      "Requerimento": "bg-purple-100 text-purple-800",
      "Resolução": "bg-indigo-100 text-indigo-800",
      "Mensagem": "bg-yellow-100 text-yellow-800",
      "Moção": "bg-orange-100 text-orange-800",
      "Projeto de Lei": "bg-red-100 text-red-800"
    };
    
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  const getApprovalStatusBadge = (activity: LegislativeActivity) => {
    if (activity.approved) {
      return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Aguardando Aprovação</Badge>;
    }
  };

  const getSituationBadge = (situacao: string) => {
    const situationColors: Record<string, string> = {
      "Arquivado": "bg-gray-100 text-gray-800",
      "Aguardando Análise": "bg-blue-100 text-blue-800",
      "Análise de Parecer": "bg-orange-100 text-orange-800",
      "Aguardando Deliberação": "bg-purple-100 text-purple-800",
      "Aguardando Despacho do Presidente": "bg-yellow-100 text-yellow-800",
      "Aguardando Envio ao Executivo": "bg-indigo-100 text-indigo-800",
      "Devolvida ao Autor": "bg-red-100 text-red-800",
      "Pronta para Pauta": "bg-green-100 text-green-800",
      "Tramitando em Conjunto": "bg-cyan-100 text-cyan-800",
      "Tramitação Finalizada": "bg-emerald-100 text-emerald-800",
      "Vetado": "bg-rose-100 text-rose-800"
    };
    
    return situationColors[situacao] || "bg-gray-100 text-gray-800";
  };

  const getRegimeTramitacaoBadge = (regime: string) => {
    const regimeColors: Record<string, string> = {
      "Ordinária": "bg-blue-100 text-blue-800",
      "Urgente": "bg-red-100 text-red-800"
    };
    
    return regimeColors[regime] || "bg-gray-100 text-gray-800";
  };

  const columns: ColumnDef<LegislativeActivity>[] = [
    {
      accessorKey: "activityNumber",
      header: "Número",
      cell: ({ row }) => {
        const number = row.getValue("activityNumber") as number;
        const type = row.original.activityType;
        const activityDate = row.original.activityDate;
        const year = new Date(activityDate).getFullYear();
        
        const id = row.original.id;
        
        return (
          <div className="flex flex-col">
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <Button
                variant="link"
                className="h-auto p-0 font-medium"
                onClick={() => navigate(`/activities/${id}`)}
              >
                {type} Nº {number}/{year}
              </Button>
            </div>
            
          </div>
        );
      },
    },
    {
      accessorKey: "activityDate",
      header: "Data",
      cell: ({ row }) => {
        const date = row.getValue("activityDate") as string;
        return (
          <div className="flex items-center">
            <CalendarCheck className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formatDateSimpleSafe(date)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        const id = row.original.id;
        
        return (
          <div 
            className="max-w-xs truncate cursor-pointer hover:text-primary" 
            title={description}
            onClick={() => navigate(`/activities/${id}`)}
          >
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: "authors",
      header: "Autores",
      cell: ({ row }) => {
        const authors = row.original.authors || [];
        
        return (
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-2">
              {authors.slice(0, 3).map(author => (
                <Avatar key={author.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={author.profileImageUrl || ""} />
                  <AvatarFallback>{author.name ? author.name.charAt(0) : "U"}</AvatarFallback>
                </Avatar>
              ))}
              {authors.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                  +{authors.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {authors.length === 0 && "Nenhum autor"}
              {authors.length === 1 && authors[0].name}
              {authors.length > 1 && `${authors[0].name} e outros`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "situacao",
      header: "Situação",
      cell: ({ row }) => {
        const activity = row.original;
        const situacao = activity.situacao || "Aguardando Análise";
        return (
          <Badge className={getSituationBadge(situacao)}>
            {situacao}
          </Badge>
        );
      },
    },
    {
      accessorKey: "regimeTramitacao",
      header: "Regime",
      cell: ({ row }) => {
        const activity = row.original;
        const regime = activity.regimeTramitacao || "Ordinária";
        return (
          <Badge className={getRegimeTramitacaoBadge(regime)}>
            {regime}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const activity = row.original;
        const canEdit = canEditActivity(activity);
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
              
              {activity.filePath && (
                <DropdownMenuItem 
                  onClick={() => window.open(`/api/files/activities/${activity.id}`, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Arquivo
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              
              {canEdit && (
                <DropdownMenuItem onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              
              {isAdmin && !activity.approved && (
                <DropdownMenuItem onClick={() => handleApproval(activity, true)}>
                  <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                  Aprovar
                </DropdownMenuItem>
              )}
              
              {isAdmin && activity.approved && (
                <DropdownMenuItem onClick={() => handleApproval(activity, false)}>
                  <ThumbsDown className="mr-2 h-4 w-4 text-yellow-600" />
                  Remover Aprovação
                </DropdownMenuItem>
              )}
              
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => handleDeleteActivity(activity)}
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
    data: activities,
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

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Atividades Legislativas</h1>
        <Button onClick={() => navigate("/activities/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Busca por texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Projeto de Lei">Projeto de Lei</SelectItem>
                  <SelectItem value="Projeto de Resolução">Projeto de Resolução</SelectItem>
                  <SelectItem value="Projeto de Decreto Legislativo">Projeto de Decreto Legislativo</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Requerimento">Requerimento</SelectItem>
                  <SelectItem value="Moção">Moção</SelectItem>
                  <SelectItem value="Emenda">Emenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Autor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Autor</label>
              <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os autores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os autores</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Situação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Situação</label>
              <Select value={selectedSituation} onValueChange={setSelectedSituation}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as situações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                  <SelectItem value="Aguardando Análise">Aguardando Análise</SelectItem>
                  <SelectItem value="Análise de Parecer">Análise de Parecer</SelectItem>
                  <SelectItem value="Aguardando Deliberação">Aguardando Deliberação</SelectItem>
                  <SelectItem value="Aguardando Despacho do Presidente">Aguardando Despacho do Presidente</SelectItem>
                  <SelectItem value="Aguardando Envio ao Executivo">Aguardando Envio ao Executivo</SelectItem>
                  <SelectItem value="Devolvida ao Autor">Devolvida ao Autor</SelectItem>
                  <SelectItem value="Pronta para Pauta">Pronta para Pauta</SelectItem>
                  <SelectItem value="Tramitando em Conjunto">Tramitando em Conjunto</SelectItem>
                  <SelectItem value="Tramitação Finalizada">Tramitação Finalizada</SelectItem>
                  <SelectItem value="Vetado">Vetado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Evento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Evento</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.eventCategory} Nº {event.eventNumber} - {formatDateSimpleSafe(event.eventDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão para limpar filtros */}
          {(debouncedSearchTerm || selectedType !== 'all' || selectedAuthor !== 'all' || selectedSituation !== 'all' || selectedEvent !== 'all') && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setSelectedType("all");
                  setSelectedAuthor("all");
                  setSelectedSituation("all");
                  setSelectedEvent("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>        
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar atividades..."
                value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("description")?.setFilterValue(event.target.value)
                }
                className="pl-8"
              />
            </div>
          </div>
          
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      Nenhuma atividade legislativa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} atividade(s) no total.
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a atividade "{selectedActivity?.activityType} Nº {selectedActivity?.activityNumber}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approval confirmation dialog */}
      <AlertDialog open={showApprovalAlert} onOpenChange={setShowApprovalAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalAction ? "Confirmar aprovação" : "Remover aprovação"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalAction 
                ? `Tem certeza que deseja aprovar a atividade "${selectedActivity?.activityType} Nº ${selectedActivity?.activityNumber}"?`
                : `Tem certeza que deseja remover a aprovação da atividade "${selectedActivity?.activityType} Nº ${selectedActivity?.activityNumber}"?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
