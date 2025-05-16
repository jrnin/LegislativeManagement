import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from 'react-helmet';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Eye, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";

export default function CouncilorList() {
  const [_, setLocation] = useLocation();

  // Buscar lista de vereadores
  const { data: councilors, isLoading, error } = useQuery({
    queryKey: ["/api/councilors"],
  });

  // Função para navegar para a página de detalhes do vereador
  const handleViewCouncilor = (id: string) => {
    setLocation(`/councilors/${id}`);
  };

  return (
    <>
      <Helmet>
        <title>Vereadores | Sistema Legislativo</title>
        <meta name="description" content="Lista de vereadores cadastrados no sistema legislativo municipal." />
      </Helmet>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vereadores</h1>
            <p className="text-muted-foreground">
              Gerencie os vereadores e visualize suas atividades legislativas
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              // Esqueleto de carregamento
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-red-500 mb-4">
                  Erro ao carregar vereadores. Por favor, tente novamente.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Tentar novamente
                </Button>
              </div>
            ) : councilors?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-muted-foreground mb-4">
                  Nenhum vereador cadastrado.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {councilors?.map((councilor) => (
                    <TableRow key={councilor.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage
                            src={councilor.profileImageUrl || undefined}
                            alt={councilor.name}
                          />
                          <AvatarFallback>
                            {getInitials(councilor.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{councilor.name}</TableCell>
                      <TableCell>{councilor.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={councilor.active ? "success" : "secondary"}
                          className={councilor.active ? "bg-green-500" : "bg-gray-500"}
                        >
                          {councilor.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCouncilor(councilor.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}