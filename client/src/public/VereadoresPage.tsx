import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ArrowRight,
  Calendar
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { getInitials } from '@/lib/utils';

// Interface para vereador
interface Councilor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  party: string;
  position: string;
  imageUrl?: string;
  commission?: string[];
  elected: string;
  biography?: string;
}

// Componente de card para vereador
const CouncilorCard = ({ councilor }: { councilor: Councilor }) => (
  <Card className="h-full hover:shadow-md transition-all overflow-hidden">
    <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-2" />
    <CardHeader className="pb-2">
      <div className="flex items-start gap-4">
        <Avatar className="h-20 w-20 border-2 border-white shadow-md">
          <AvatarImage src={councilor.imageUrl} />
          <AvatarFallback className="bg-blue-700 text-white">
            {getInitials(councilor.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-xl">{councilor.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{councilor.party}</Badge>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              {councilor.position}
            </Badge>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Mail className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">{councilor.email}</span>
      </div>
      {councilor.phone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">{councilor.phone}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-gray-600">Eleito em: {councilor.elected}</span>
      </div>
      {councilor.commission && councilor.commission.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-1">Comissões:</p>
          <div className="flex flex-wrap gap-1">
            {councilor.commission.map((com, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {com}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </CardContent>
    <CardFooter>
      <Link href={`/public/vereadores/${councilor.id}`}>
        <Button variant="outline" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1">
          Ver perfil completo <ArrowRight size={16} />
        </Button>
      </Link>
    </CardFooter>
  </Card>
);

export default function VereadoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState<string[]>([]);
  const [positionFilter, setPositionFilter] = useState<string[]>([]);

  // Dados mockados de vereadores
  const mockCouncilors: Councilor[] = [
    {
      id: "1",
      name: "Ana Silva",
      email: "ana.silva@camara.gov.br",
      phone: "(11) 5555-1234",
      party: "Partido A",
      position: "Presidente",
      imageUrl: "https://randomuser.me/api/portraits/women/32.jpg",
      commission: ["Comissão de Educação", "Comissão de Direitos Humanos"],
      elected: "2020",
      biography: "Ana Silva é formada em Direito e atua como vereadora desde 2016."
    },
    {
      id: "2",
      name: "Carlos Santos",
      email: "carlos.santos@camara.gov.br",
      phone: "(11) 5555-2345",
      party: "Partido B",
      position: "Vice-Presidente",
      imageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
      commission: ["Comissão de Saúde", "Comissão de Finanças"],
      elected: "2020",
      biography: "Carlos Santos tem experiência em gestão pública e está em seu segundo mandato."
    },
    {
      id: "3",
      name: "Mariana Oliveira",
      email: "mariana.oliveira@camara.gov.br",
      phone: "(11) 5555-3456",
      party: "Partido C",
      position: "Secretária",
      imageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
      commission: ["Comissão de Meio Ambiente", "Comissão de Cultura"],
      elected: "2020",
      biography: "Mariana Oliveira é engenheira ambiental e defensora das causas ambientais."
    },
    {
      id: "4",
      name: "Ricardo Almeida",
      email: "ricardo.almeida@camara.gov.br",
      phone: "(11) 5555-4567",
      party: "Partido A",
      position: "Vereador",
      imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
      commission: ["Comissão de Urbanismo", "Comissão de Transporte"],
      elected: "2020",
      biography: "Ricardo Almeida é arquiteto e defende o planejamento urbano sustentável."
    },
    {
      id: "5",
      name: "Juliana Costa",
      email: "juliana.costa@camara.gov.br",
      phone: "(11) 5555-5678",
      party: "Partido D",
      position: "Vereadora",
      imageUrl: "https://randomuser.me/api/portraits/women/23.jpg",
      commission: ["Comissão de Educação", "Comissão de Direitos Humanos"],
      elected: "2020",
      biography: "Juliana Costa é professora e defensora da educação pública de qualidade."
    },
    {
      id: "6",
      name: "Paulo Ferreira",
      email: "paulo.ferreira@camara.gov.br",
      phone: "(11) 5555-6789",
      party: "Partido B",
      position: "Vereador",
      imageUrl: "https://randomuser.me/api/portraits/men/35.jpg",
      commission: ["Comissão de Saúde", "Comissão de Esportes"],
      elected: "2020",
      biography: "Paulo Ferreira é médico e atua na área da saúde pública há mais de 15 anos."
    },
    {
      id: "7",
      name: "Luciana Ribeiro",
      email: "luciana.ribeiro@camara.gov.br",
      phone: "(11) 5555-7890",
      party: "Partido E",
      position: "Vereadora",
      imageUrl: "https://randomuser.me/api/portraits/women/58.jpg",
      commission: ["Comissão de Finanças", "Comissão de Administração Pública"],
      elected: "2020",
      biography: "Luciana Ribeiro é economista e especialista em políticas públicas."
    },
    {
      id: "8",
      name: "Antônio Martins",
      email: "antonio.martins@camara.gov.br",
      phone: "(11) 5555-8901",
      party: "Partido C",
      position: "Vereador",
      imageUrl: "https://randomuser.me/api/portraits/men/53.jpg",
      commission: ["Comissão de Cultura", "Comissão de Turismo"],
      elected: "2020",
      biography: "Antônio Martins é produtor cultural e defensor das políticas culturais."
    },
    {
      id: "9",
      name: "Fernanda Lima",
      email: "fernanda.lima@camara.gov.br",
      phone: "(11) 5555-9012",
      party: "Partido A",
      position: "Vereadora",
      imageUrl: "https://randomuser.me/api/portraits/women/66.jpg",
      commission: ["Comissão de Direitos Humanos", "Comissão de Assistência Social"],
      elected: "2020",
      biography: "Fernanda Lima é assistente social e trabalha com comunidades vulneráveis."
    },
    {
      id: "10",
      name: "Eduardo Souza",
      email: "eduardo.souza@camara.gov.br",
      phone: "(11) 5555-0123",
      party: "Partido D",
      position: "Vereador",
      imageUrl: "https://randomuser.me/api/portraits/men/68.jpg",
      commission: ["Comissão de Segurança Pública", "Comissão de Legislação"],
      elected: "2020",
      biography: "Eduardo Souza é advogado e especialista em segurança pública."
    }
  ];

  // Simulando consulta à API para obter vereadores
  const { data: councilors = mockCouncilors } = useQuery({
    queryKey: ['/api/public/councilors'],
    enabled: false,
    initialData: mockCouncilors
  });

  // Extrair lista de partidos únicos
  const uniqueParties = Array.from(new Set(councilors.map(c => c.party)));
  
  // Extrair lista de cargos/posições únicas
  const uniquePositions = Array.from(new Set(councilors.map(c => c.position)));

  // Filtrar vereadores baseado nos critérios
  const filteredCouncilors = councilors.filter(councilor => {
    // Filtro de pesquisa por texto
    const matchesSearch = 
      searchTerm === '' || 
      councilor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      councilor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (councilor.commission?.some(com => com.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Filtro por partido
    const matchesParty = partyFilter.length === 0 || partyFilter.includes(councilor.party);
    
    // Filtro por posição/cargo
    const matchesPosition = positionFilter.length === 0 || positionFilter.includes(councilor.position);
    
    return matchesSearch && matchesParty && matchesPosition;
  });

  // Alternar seleção de partido no filtro
  const togglePartyFilter = (party: string) => {
    setPartyFilter(prev => 
      prev.includes(party) 
        ? prev.filter(p => p !== party) 
        : [...prev, party]
    );
  };

  // Alternar seleção de posição no filtro
  const togglePositionFilter = (position: string) => {
    setPositionFilter(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position) 
        : [...prev, position]
    );
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setPartyFilter([]);
    setPositionFilter([]);
  };

  return (
    <>
      <Helmet>
        <title>Vereadores | Sistema Legislativo</title>
        <meta name="description" content="Conheça os vereadores da Câmara Municipal, suas comissões e formas de contato." />
      </Helmet>

      {/* Banner da página */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Vereadores</h1>
              <p className="text-blue-100 max-w-2xl">
                Conheça os representantes eleitos para a Câmara Municipal. 
                Acompanhe seus trabalhos, projetos e entre em contato.
              </p>
            </div>
            <div className="hidden md:block">
              <Users size={80} className="text-blue-200 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="bg-white border-b shadow-sm py-4 px-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, email ou comissão..."
                className="pl-9 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Filtrar por Partido
                    {partyFilter.length > 0 && (
                      <Badge className="ml-1 bg-blue-100 text-blue-800">{partyFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Partidos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueParties.map(party => (
                    <DropdownMenuCheckboxItem
                      key={party}
                      checked={partyFilter.includes(party)}
                      onCheckedChange={() => togglePartyFilter(party)}
                    >
                      {party}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    Filtrar por Cargo
                    {positionFilter.length > 0 && (
                      <Badge className="ml-1 bg-blue-100 text-blue-800">{positionFilter.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Cargos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniquePositions.map(position => (
                    <DropdownMenuCheckboxItem
                      key={position}
                      checked={positionFilter.includes(position)}
                      onCheckedChange={() => togglePositionFilter(position)}
                    >
                      {position}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchTerm || partyFilter.length > 0 || positionFilter.length > 0) && (
                <Button variant="ghost" onClick={clearFilters} className="text-blue-600">
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de vereadores */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          {filteredCouncilors.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-2">Nenhum vereador encontrado</h3>
              <p className="text-gray-500 mb-4">
                Não foram encontrados vereadores correspondentes aos filtros aplicados.
              </p>
              <Button onClick={clearFilters}>Limpar Filtros</Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Mostrando {filteredCouncilors.length} vereadores
                  {(searchTerm || partyFilter.length > 0 || positionFilter.length > 0) && " com os filtros aplicados"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCouncilors.map(councilor => (
                  <CouncilorCard key={councilor.id} councilor={councilor} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Seção de informações adicionais */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Papel do Vereador</h2>
              <p className="text-gray-600 mb-4">
                O vereador é o representante do cidadão na Câmara Municipal. Sua função principal é legislar, 
                ou seja, elaborar leis municipais e fiscalizar o trabalho do Poder Executivo (Prefeitura).
              </p>
              <p className="text-gray-600">
                Os vereadores também participam de comissões temáticas para debater assuntos específicos e 
                têm a função de apresentar as demandas da população ao poder público.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Composição da Câmara</h2>
              <p className="text-gray-600 mb-4">
                A Câmara Municipal é composta por vereadores eleitos pela população para um mandato de quatro anos. 
                O número de vereadores varia de acordo com a população do município.
              </p>
              <p className="text-gray-600">
                A Mesa Diretora da Câmara é formada por um Presidente, um Vice-Presidente e Secretários, que são 
                responsáveis pela administração da Casa Legislativa.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}