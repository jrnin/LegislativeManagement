import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from 'react-helmet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, Mail, Phone, ArrowUpDown } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Councilor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profileImageUrl?: string;
  active?: boolean;
}

export default function CouncilorList() {
  const [_, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar lista de vereadores
  const { data: councilors, isLoading } = useQuery({
    queryKey: ['/api/councilors'],
  });
  
  // Filtrar vereadores com base no termo de busca
  const filteredCouncilors = councilors?.filter((councilor: Councilor) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      councilor.name?.toLowerCase().includes(term) ||
      councilor.email?.toLowerCase().includes(term) ||
      councilor.phone?.toLowerCase().includes(term)
    );
  });
  
  // Formatador de telefone
  const formatPhone = (phone: string) => {
    if (!phone) return "Não informado";
    
    if (phone.length === 11) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
    } else if (phone.length === 10) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    }
    
    return phone;
  };

  return (
    <>
      <Helmet>
        <title>Vereadores | Sistema Legislativo</title>
        <meta name="description" content="Lista de vereadores cadastrados no sistema legislativo." />
      </Helmet>

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Vereadores</h1>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar vereadores..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {councilors?.length > 0 && (
              <Button onClick={() => setLocation("/users/new")}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {isLoading ? (
          // Skeleton loading state
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : filteredCouncilors?.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <h3 className="text-xl font-semibold mb-2">Nenhum vereador encontrado</h3>
            {searchTerm ? (
              <p className="text-muted-foreground mb-4">
                Não foram encontrados vereadores com o termo "{searchTerm}".
              </p>
            ) : (
              <p className="text-muted-foreground mb-4">
                Adicione vereadores para começar a gerenciar o sistema legislativo.
              </p>
            )}
            <Button onClick={() => setLocation("/users/new")}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Vereador
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Email</span>
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>Telefone</span>
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouncilors?.map((councilor: Councilor) => (
                  <TableRow key={councilor.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setLocation(`/councilors/${councilor.id}`)}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={councilor.profileImageUrl || undefined} alt={councilor.name} />
                          <AvatarFallback>{getInitials(councilor.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{councilor.name}</div>
                          <div className="text-xs text-muted-foreground">{councilor.role === 'councilor' ? 'Vereador' : councilor.role === 'admin' ? 'Administrador' : councilor.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground sm:hidden" />
                        <span className="truncate max-w-[180px]">{councilor.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {councilor.phone ? formatPhone(councilor.phone) : "Não informado"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge 
                        variant={councilor.active ? "default" : "secondary"}
                        className={cn(
                          councilor.active ? "bg-green-500" : "bg-gray-500"
                        )}
                      >
                        {councilor.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/councilors/${councilor.id}`);
                          }}>
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/users/${councilor.id}/edit`);
                          }}>
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}