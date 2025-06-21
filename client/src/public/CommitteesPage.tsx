import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Eye, Users, Calendar, Clock } from 'lucide-react';
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
}

export default function CommitteesPage() {
  const { data: committees, isLoading, error } = useQuery({
    queryKey: ['/api/public/committees'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar comissões. Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Comissões | Câmara Municipal de Jaíba</title>
        <meta name="description" content="Conheça as comissões da Câmara Municipal de Jaíba e seus membros." />
      </Helmet>
      
      {/* Hero Section */}
      <div className="text-white py-16" style={{background: 'linear-gradient(to right, #7FA653, #63783D)'}}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Comissões</h1>
              <p className="text-xl text-white opacity-90 max-w-2xl">
                Conheça as comissões permanentes e temporárias da Câmara Municipal de Jaíba, 
                seus objetivos e membros participantes.
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

      {/* Committees Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {committees && committees.length > 0 ? (
            committees.map((committee: Committee) => (
              <Card key={committee.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {committee.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {committee.type}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {committee.description}
                  </p>
                  
                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar size={14} className="mr-2" />
                      <span>Início: {new Date(committee.startDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-2" />
                      <span>Fim: {new Date(committee.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <Link href={`/committees/${committee.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye size={16} className="mr-2" />
                      Visualizar Detalhes
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma comissão encontrada
              </h3>
              <p className="text-gray-600">
                No momento não há comissões ativas cadastradas no sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}