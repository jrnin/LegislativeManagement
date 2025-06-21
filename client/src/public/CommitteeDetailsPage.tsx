import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Users, Calendar, Clock, User } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Committee {
  id: number;
  name: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string | null;
  updatedAt: string | null;
  members?: Array<{
    id: string;
    name: string;
    role: string;
    email?: string;
  }>;
}

export default function CommitteeDetailsPage() {
  const { id } = useParams();
  
  const { data: committee, isLoading, error } = useQuery({
    queryKey: [`/api/public/committees/${id}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes da comissão...</p>
        </div>
      </div>
    );
  }

  if (error || !committee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar detalhes da comissão.</p>
          <Link href="/committees">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Voltar às Comissões
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{committee.name} | Câmara Municipal de Jaíba</title>
        <meta name="description" content={`Detalhes da ${committee.name} da Câmara Municipal de Jaíba.`} />
      </Helmet>
      
      {/* Header */}
      <div className="text-white py-16" style={{background: 'linear-gradient(to right, #7FA653, #63783D)'}}>
        <div className="container mx-auto px-4">
          <Link href="/committees">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Voltar às Comissões
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {committee.type}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{committee.name}</h1>
              <p className="text-xl text-white opacity-90 max-w-2xl">
                {committee.description}
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

      {/* Committee Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users size={20} className="mr-2" />
                  Informações da Comissão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {committee.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2 text-green-600" />
                    <div>
                      <span className="font-medium">Data de Início:</span><br />
                      {new Date(committee.startDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2 text-green-600" />
                    <div>
                      <span className="font-medium">Data de Fim:</span><br />
                      {new Date(committee.endDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Section */}
            {committee.members && committee.members.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User size={20} className="mr-2" />
                    Membros da Comissão
                  </CardTitle>
                  <CardDescription>
                    Conheça os vereadores que fazem parte desta comissão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {committee.members.map((member) => (
                      <div key={member.id} className="flex items-center p-3 border rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <User size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          {member.email && (
                            <p className="text-xs text-gray-500">{member.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Tipo de Comissão</span>
                  <p className="text-gray-900">{committee.type}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <div className="mt-1">
                    {new Date() >= new Date(committee.startDate) && new Date() <= new Date(committee.endDate) ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Ativa
                      </Badge>
                    ) : new Date() < new Date(committee.startDate) ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Futura
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        Encerrada
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-600">Período de Atividade</span>
                  <p className="text-gray-900">
                    {new Date(committee.startDate).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(committee.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {committee.members && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total de Membros</span>
                    <p className="text-gray-900">{committee.members.length} vereadores</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}