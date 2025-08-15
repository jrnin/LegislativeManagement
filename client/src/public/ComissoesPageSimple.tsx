import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface Committee {
  id: number;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  description: string;
  members: Array<{
    userId: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function ComissoesPageSimple() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: committees = [], isLoading, error } = useQuery<Committee[]>({
    queryKey: ["/api/public/committees"],
  });

  // Scroll para o topo quando a página for carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredCommittees = committees.filter((committee: Committee) => {
    const matchesSearch = committee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         committee.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || committee.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(committees.map((c) => c.type)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isCommitteeActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Carregando Comissões...
            </h1>
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
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Erro ao carregar comissões
            </h1>
            <p className="text-gray-600">
              Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Comissões da Câmara Municipal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conheça as comissões permanentes e temporárias da Câmara Municipal, 
            seus membros e áreas de atuação
          </p>
        </div>

        {/* Filtros Simples */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar comissões por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-48">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Comissões */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {filteredCommittees.map((committee: Committee) => (
            <div key={committee.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {committee.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {committee.type}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    isCommitteeActive(committee.endDate) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isCommitteeActive(committee.endDate) ? "Ativa" : "Encerrada"}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                {committee.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div>
                  📅 {formatDate(committee.startDate)} - {formatDate(committee.endDate)}
                </div>
                <div>
                  👥 {committee.members.length} membros
                </div>
              </div>

              {/* Membros */}
              {committee.members.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Membros:</h4>
                  <div className="space-y-1">
                    {committee.members.slice(0, 3).map((member) => (
                      <div key={member.userId} className="text-xs text-gray-600 flex justify-between">
                        <span>{member.user.name}</span>
                        <span className="font-medium text-blue-600">{member.role}</span>
                      </div>
                    ))}
                    {committee.members.length > 3 && (
                      <div className="text-xs text-gray-500">
                        + {committee.members.length - 3} outros membros
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Estatísticas das Comissões
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {committees.length}
              </div>
              <div className="text-gray-600">Total de Comissões</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {committees.filter((c: Committee) => isCommitteeActive(c.endDate)).length}
              </div>
              <div className="text-gray-600">Comissões Ativas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {committees.reduce((total: number, c: Committee) => total + c.members.length, 0)}
              </div>
              <div className="text-gray-600">Total de Membros</div>
            </div>
          </div>
        </div>

        {/* Mensagem quando nenhuma comissão é encontrada */}
        {filteredCommittees.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma comissão encontrada
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de busca para encontrar as comissões desejadas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}