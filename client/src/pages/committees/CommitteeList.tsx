import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Users, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

// Definição de tipos
type CommitteeType = "Permanente" | "Temporária" | "Extraordinária";

interface CommitteeMember {
  userId: string;
  role: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface Committee {
  id: number;
  name: string;
  description: string;
  type: CommitteeType;
  startDate: string | Date;
  endDate: string | Date;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  members?: CommitteeMember[];
}

export function CommitteeList() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const { data: committees, isLoading, error } = useQuery({
    queryKey: ['/api/committees'],
  });
  
  const isAdmin = user?.role === 'admin';
  
  const getBadgeColor = (type: CommitteeType) => {
    switch (type) {
      case "Permanente":
        return "bg-blue-500 hover:bg-blue-600";
      case "Temporária":
        return "bg-amber-500 hover:bg-amber-600";
      case "Extraordinária":
        return "bg-purple-500 hover:bg-purple-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };
  
  // Renderiza estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }
  
  // Renderiza mensagem de erro
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold">Erro ao carregar comissões</h3>
          <p className="text-muted-foreground">Ocorreu um erro ao buscar as comissões. Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as comissões legislativas e seus membros
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => navigate("/committees/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Comissão
          </Button>
        )}
      </div>
      
      {committees?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma comissão encontrada</h3>
          <p className="text-muted-foreground">Não existem comissões cadastradas no sistema.</p>
          {isAdmin && (
            <Button className="mt-4" onClick={() => navigate("/committees/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira comissão
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees?.map((committee: Committee) => (
            <Card key={committee.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge 
                    className={`${getBadgeColor(committee.type as CommitteeType)} text-white`}
                  >
                    {committee.type}
                  </Badge>
                  
                  <Badge variant={committee.active ? "success" : "destructive"}>
                    {committee.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-2">{committee.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {committee.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {formatDate(committee.startDate)} - {formatDate(committee.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {committee.members?.length || 0} membro{committee.members?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-3 flex justify-end border-t">
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/committees/${committee.id}`)}
                >
                  Ver detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}