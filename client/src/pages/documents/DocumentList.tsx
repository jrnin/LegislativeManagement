import { useState } from "react";
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
import DocumentFormModal from "../../components/documents/DocumentFormModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Download
} from "lucide-react";
import { formatDate } from "@/utils/formatters";

export default function DocumentList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showNewDocumentModal, setShowNewDocumentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

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
      "Oficio": "bg-yellow-100 text-yellow-800"
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

  // Filter documents by status if filter is applied
  const filteredDocuments = filterStatus 
    ? documents.filter(doc => doc.status === filterStatus)
    : documents;

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
          <div className="flex flex-col">
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {type} Nº {number}/{year}
              </span>
            </div>
            <Badge className={`mt-1 ${getDocumentTypeBadge(type)}`}>
              {type}
            </Badge>
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
            <span>{formatDate(date)}</span>
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
                <DropdownMenuItem onClick={() => navigate(`/documents/${document.id}`)}>
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

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documentos</h1>
        {user?.role === "admin" && (
          <Button onClick={() => {
            console.log("Abrindo modal...");
            setShowNewDocumentModal(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Documento
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-1">
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center py-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar documentos..."
                value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("description")?.setFilterValue(event.target.value)
                }
                className="pl-8"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant={filterStatus === "" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("")}
              >
                Todos
              </Button>
              <Button 
                variant={filterStatus === "Vigente" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("Vigente")}
              >
                Vigentes
              </Button>
              <Button 
                variant={filterStatus === "Revogada" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("Revogada")}
              >
                Revogados
              </Button>
              <Button 
                variant={filterStatus === "Alterada" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("Alterada")}
              >
                Alterados
              </Button>
              <Button 
                variant={filterStatus === "Suspenso" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("Suspenso")}
              >
                Suspensos
              </Button>
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
                      Nenhum documento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
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
      
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{selectedDocument?.documentType} Nº {selectedDocument?.documentNumber}"? Esta ação não pode ser desfeita.
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

      {/* Modal de Novo Documento */}
      <DocumentFormModal 
        open={showNewDocumentModal}
        onOpenChange={setShowNewDocumentModal}
      />
    </div>
  );
}
