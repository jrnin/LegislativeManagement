import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Interface para o modelo de Vereador (baseado na tabela users do banco de dados)
interface Councilor {
  id: string;
  name: string;
  profileImageUrl?: string;
  email: string;
  role: string;
  occupation?: string;
  education?: string;
}

// Componente para o cartão de perfil de vereador
const CouncilorCard = ({ councilor }: { councilor: Councilor }) => (
  <Link href={`/vereadores/${councilor.id}`}>
    <a className="block">
      <Card className="text-center hover:shadow-lg transition-all h-full">
        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={councilor.profileImageUrl} />
              <AvatarFallback className="bg-blue-700 text-white text-lg">{getInitials(councilor.name)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-lg">{councilor.name}</CardTitle>
          <CardDescription>{councilor.occupation || 'Vereador'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="mx-auto">{councilor.education || 'Legislatura Atual'}</Badge>
        </CardContent>
      </Card>
    </a>
  </Link>
);

// Componente principal da página de vereadores
export default function VereadoresPage() {
  // Buscar vereadores da API
  const { data: councilors, isLoading, error } = useQuery<Councilor[]>({
    queryKey: ['/api/public/councilors'],
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Users size={30} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Vereadores</h1>
      </div>

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
      ) : councilors && councilors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {councilors.map((councilor) => (
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
        <Link href="/public">
          <a className="text-blue-600 hover:underline inline-flex items-center">
            <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Voltar para página inicial
          </a>
        </Link>
      </div>
    </div>
  );
}