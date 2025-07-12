import { useState, useEffect } from "react";
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
import { Event } from "@shared/schema";
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
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Edit,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Eye 
} from "lucide-react";
import { formatDate } from "@/utils/formatters";

export default function EventList() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir evento",
        description: error.message,
      });
    },
  });

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
      setShowDeleteAlert(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      "Aberto": "status-badge-open",
      "Andamento": "status-badge-in-progress", 
      "Concluido": "status-badge-completed",
      "Cancelado": "status-badge-canceled"
    };
    return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
  };

  // Não há mais restrições para usuários do tipo "Vereador" acessarem a página de eventos

  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: "eventNumber",
      header: "Número",
      cell: ({ row }) => {
        const eventNumber = row.getValue("eventNumber") as number;
        const category = row.getValue("category") as string;
        return (
          <div className="flex items-center">
            <span className="font-medium">{category} #{eventNumber}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "eventDate",
      header: "Data",
      cell: ({ row }) => {
        const date = row.getValue("eventDate") as string;
        const time = row.original.eventTime;
        return (
          <div className="flex flex-col">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm mt-1">
              <Clock className="mr-2 h-3 w-3" />
              <span>{time}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Local",
      cell: ({ row }) => {
        const location = row.getValue("location") as string;
        const mapUrl = row.original.mapUrl;
        return (
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{location}</span>
            {mapUrl && (
              <a 
                href={mapUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-2 text-primary hover:text-primary/80"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => {
        const category = row.getValue("category") as string;
        return category;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusBadge(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const event = row.original;
        
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
              <DropdownMenuItem onClick={() => navigate(`/events/${event.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/events/edit/${event.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteEvent(event)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: events,
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
        <h1 className="text-2xl font-bold">Eventos</h1>
        <Button onClick={() => navigate("/events/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-1">
          <CardTitle>Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar eventos..."
                value={(table.getColumn("location")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("location")?.setFilterValue(event.target.value)
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
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} evento(s) no total.
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
              Tem certeza que deseja excluir o evento "{selectedEvent?.category} #{selectedEvent?.eventNumber}"? Esta ação não pode ser desfeita.
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
    </div>
  );
}
