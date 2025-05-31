import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ChevronRight, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Helmet } from 'react-helmet';

// Interface para o modelo de Vereador (baseado na tabela users do banco de dados)
interface Councilor {
  id: string;
  name: string;
  profileImageUrl?: string;
  email: string;
  role: string;
  occupation?: string;  
  education?: string;
  partido?: string;
}

// Componente para o cartão de perfil de vereador
const CouncilorCard = ({ councilor }: { councilor: Councilor }) => (
  <Link href={`/vereadores/${councilor.id}`}>
    <Card className="text-center hover:shadow-lg transition-all h-full cursor-pointer">
      <CardHeader className="pb-2 pt-6">
        <div className="flex justify-center mb-4">
          <Avatar className="h-44 w-44 border-4 border-white shadow-md">
            <AvatarImage src={councilor.profileImageUrl} />
            <AvatarFallback className="bg-blue-700 text-white text-lg">{getInitials(councilor.name)}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-lg">{councilor.name}</CardTitle>
        <CardDescription>{councilor.occupation || 'Vereador'}</CardDescription>          
      </CardHeader>
      <CardContent className="space-y-2">
        {councilor.partido && (
          <Badge variant="default" className="mx-auto bg-green-600 hover:bg-green-700 text-white">
            {councilor.partido}
          </Badge>
        )}
        <div>
          <Badge variant="outline" className="mx-auto">{councilor.education || 'Legislatura Atual'}</Badge>
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Componente principal da página de vereadores
export default function VereadoresPage() {
  // Estados para filtros e ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [partidoFilter, setPartidoFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Buscar vereadores da API
  const { data: councilors, isLoading, error } = useQuery<Councilor[]>({
    queryKey: ['/api/public/councilors'],
  });

  // Filtrar e ordenar vereadores
  const filteredAndSortedCouncilors = useMemo(() => {
    if (!councilors) return [];

    let filtered = councilors.filter(councilor => {
      const matchesSearch = councilor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (councilor.occupation && councilor.occupation.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPartido = !partidoFilter || councilor.partido === partidoFilter;
      
      return matchesSearch && matchesPartido;
    });

    // Ordenar por nome
    filtered.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    return filtered;
  }, [councilors, searchTerm, partidoFilter, sortOrder]);

  // Obter lista única de partidos para o filtro
  const uniquePartidos = useMemo(() => {
    if (!councilors) return [];
    const partidos = councilors
      .map(c => c.partido)
      .filter((partido): partido is string => Boolean(partido))
      .filter((partido, index, arr) => arr.indexOf(partido) === index)
      .sort();
    return partidos;
  }, [councilors]);

  return (
    <>
      <Helmet>
        <title>Vereadores | Sistema Legislativo</title>
        <meta name="description" content="Conheça os vereadores da Câmara Municipal e seus trabalhos em prol do desenvolvimento da cidade." />
      </Helmet>

      {/* Hero Section */}
      <div className="text-white py-16" style={{background: 'linear-gradient(to right, #007825, #1c873d)'}}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Vereadores</h1>
              <p className="text-xl text-white opacity-90 max-w-2xl">
                Conheça os representantes eleitos que trabalham em prol do desenvolvimento de nossa cidade. 
                Acompanhe o trabalho dos vereadores e fiscalize o processo legislativo.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Users size={64} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Busca por nome */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou ocupação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtro por partido */}
                <Select value={partidoFilter || "all"} onValueChange={(value) => setPartidoFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por partido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os partidos</SelectItem>
                    {uniquePartidos.map((partido) => (
                      <SelectItem key={partido} value={partido}>
                        {partido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ordenar:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  A-Z
                </Button>
              </div>
            </div>

            {/* Contador de resultados */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredAndSortedCouncilors.length} vereador(es) encontrado(s)
              {(searchTerm || partidoFilter) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setPartidoFilter('');
                  }}
                  className="ml-2 h-auto p-0 text-blue-600"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">Ocorreu um erro ao carregar os vereadores.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : filteredAndSortedCouncilors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredAndSortedCouncilors.map((councilor) => (
            <CouncilorCard key={councilor.id} councilor={councilor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">Nenhum vereador encontrado.</p>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">
          Conheça os vereadores que trabalham em prol do desenvolvimento de nossa cidade.
        </p>
        <Link href="/">
          <a className="text-blue-600 hover:underline inline-flex items-center">
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Voltar para página inicial
          </a>
        </Link>
      </div>
      </div>
    </>
  );
}