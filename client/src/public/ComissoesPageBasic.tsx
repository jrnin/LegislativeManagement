import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CommitteeMember {
  id: string;
  name: string;
  role: string;
}

interface Committee {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  members: CommitteeMember[];
}

export default function ComissoesPageBasic() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: committees, isLoading, error } = useQuery({
    queryKey: ['/api/public/committees'],
    queryFn: async () => {
      const response = await fetch('/api/public/committees');
      if (!response.ok) {
        throw new Error('Falha ao carregar comissões');
      }
      return response.json();
    }
  });

  const filteredCommittees = committees?.filter((committee: Committee) =>
    committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    committee.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Comissões da Câmara Municipal
            </h1>
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Carregando comissões...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Comissões da Câmara Municipal
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">Erro ao carregar as comissões. Tente novamente mais tarde.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comissões da Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Conheça as comissões permanentes e temporárias da nossa câmara
          </p>
          
          {/* Barra de pesquisa */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar comissões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{committees?.length || 0}</p>
                <p className="text-gray-600">Comissões Ativas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {committees?.reduce((total: number, committee: Committee) => total + committee.members.length, 0) || 0}
                </p>
                <p className="text-gray-600">Membros Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {committees?.filter((c: Committee) => c.status === 'ativa').length || 0}
                </p>
                <p className="text-gray-600">Em Atividade</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Comissões */}
        {filteredCommittees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCommittees.map((committee: Committee) => (
              <Card key={committee.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-gray-900">
                      {committee.name}
                    </CardTitle>
                    <Badge variant={committee.status === 'ativa' ? 'default' : 'secondary'}>
                      {committee.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{committee.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {committee.members.length} membros
                    </div>
                    
                    {committee.members.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Membros:</h4>
                        <div className="space-y-1">
                          {committee.members.map((member) => (
                            <div key={member.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">{member.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                      <Calendar className="h-4 w-4 mr-2" />
                      Criada em {new Date(committee.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma comissão encontrada' : 'Nenhuma comissão cadastrada'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os termos de pesquisa' 
                : 'As comissões serão exibidas aqui quando forem cadastradas'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}