import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, Filter, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function CouncilorList() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("name");
  const isAdmin = currentUser?.role === "admin";

  const { data: councilors, isLoading } = useQuery<User[]>({
    queryKey: ["/api/councilors"],
  });

  const [filteredCouncilors, setFilteredCouncilors] = useState<User[]>([]);

  useEffect(() => {
    if (!councilors) return;

    let results = [...councilors];

    // Filtrar por termo de busca
    if (searchTerm) {
      results = results.filter(
        (councilor) =>
          councilor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          councilor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar resultados
    results.sort((a, b) => {
      if (orderBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (orderBy === "email") {
        return (a.email || "").localeCompare(b.email || "");
      } else if (orderBy === "registration") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return 0;
    });

    setFilteredCouncilors(results);
  }, [councilors, searchTerm, orderBy]);

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "V";
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Vereadores</h1>
          <p className="text-muted-foreground">
            Gerencie os vereadores do sistema legislativo municipal.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar vereadores..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={orderBy}
                onValueChange={setOrderBy}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Ordenar por" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="registration">Data de Cadastro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdmin && (
              <Button asChild>
                <Link href="/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Vereador
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCouncilors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <UserRound className="h-16 w-16 text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum vereador encontrado</h3>
              <p className="text-muted-foreground mt-2">
                Não foi encontrado nenhum vereador com os critérios de busca atuais.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCouncilors.map((councilor) => (
                <Link key={councilor.id} href={`/councilors/${councilor.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1"></div>
                      <div className="p-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                            <AvatarImage
                              src={councilor.profileImageUrl || ""}
                              alt={councilor.name || "Vereador"}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg">
                              {getInitials(councilor.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{councilor.name}</h3>
                            <p className="text-sm text-muted-foreground">{councilor.email}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="bg-blue-50">
                              Vereador
                            </Badge>
                            {councilor.createdAt && (
                              <Badge variant="outline" className="bg-slate-50">
                                Desde {formatDate(councilor.createdAt)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}