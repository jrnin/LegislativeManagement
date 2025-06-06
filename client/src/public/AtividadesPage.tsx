import React, { useState } from 'react';
import { Activity, Search, Filter, X, Calendar, User, Download, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';

// Interface para atividade legislativa
interface LegislativeActivity {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  sessionDate: string;
  authors: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
}

// Interface para a resposta da API
interface ActivitiesResponse {
  activities: LegislativeActivity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: {
    activityTypes: string[];
    statusTypes: string[];
  };
}

export default function AtividadesPage() {
  // Estados para filtros
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  
  // Construir query string para filtros
  const getQueryString = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type) params.append('activityType', type);
    if (status) params.append('status', status);
    return params.toString();
  };
  
  // Query para buscar atividades em tempo real
  const { data: response, isLoading, error } = useQuery<ActivitiesResponse>({
    queryKey: ['/api/public/legislative-activities', search, type, status],
    queryFn: async () => {
      const queryString = getQueryString();
      const url = `/api/public/legislative-activities${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Erro ao carregar atividades: ${res.status}`);
      }
      
      return res.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos para dados em tempo real
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Extrair dados da resposta
  const activities = response?.activities || [];
  const filterOptions = response?.filters || { activityTypes: [], statusTypes: [] };
  const totalActivities = response?.pagination?.total || 0;
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearch('');
    setType('');
    setStatus('');
  };

  // Função para fazer download do arquivo da atividade
  const handleDownload = async (activityId: number, activityTitle: string) => {
    try {
      const response = await fetch(`/api/public/activities/${activityId}/download`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      
      // Obter o nome do arquivo do cabeçalho ou usar um padrão
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${activityTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Não foi possível fazer o download do arquivo. O arquivo pode não estar disponível.');
    }
  };

  // Determinar cor do badge de status
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovada':
        return 'bg-green-100 text-green-800';
      case 'rejeitada':
        return 'bg-red-100 text-red-800';
      case 'em discussão':
        return 'bg-yellow-100 text-yellow-800';
      case 'pendente':
        return 'bg-orange-100 text-orange-800';
      case 'tramitando':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determinar cor do badge de tipo
  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'projeto de lei':
        return 'bg-purple-100 text-purple-800';
      case 'moção':
        return 'bg-indigo-100 text-indigo-800';
      case 'requerimento':
        return 'bg-teal-100 text-teal-800';
      case 'emenda':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Aplicar filtros e buscar atividades
  const applyFilters = () => {
    fetchActivities();
  };

  return (
    <>
      <Helmet>
        <title>Atividades Legislativas | Sistema Legislativo</title>
        <meta name="description" content="Acompanhe as atividades legislativas da Câmara Municipal com ferramentas de busca e filtros avançados." />
      </Helmet>
      
      {/* Hero Section */}
      <div className="text-white py-16" style={{background: 'linear-gradient(to right, #7FA653, #63783D)'}}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Atividades Legislativas</h1>
              <p className="text-xl text-white opacity-90 max-w-2xl">
                Acompanhe projetos de lei, moções, requerimentos e outras atividades legislativas 
                da Câmara Municipal. Mantenha-se informado sobre as decisões que impactam nossa cidade.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Activity size={64} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        {/* Barra de Busca Principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar atividades legislativas
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Digite o título, tipo ou palavras-chave da atividade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 h-12 text-base"
                />
              </div>
            </div>
            
            <Button 
              onClick={applyFilters} 
              className="h-12 px-8 bg-green-600 hover:bg-green-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="bg-gray-50 rounded-lg border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Tipo:</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-48 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todos os tipos</option>
                {filterOptions.activityTypes.map((activityType, index) => (
                  <option key={`${activityType}-${index}`} value={activityType}>{activityType}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Situação:</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-48 h-10 px-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todas as situações</option>
                {filterOptions.statusTypes.map((statusType, index) => (
                  <option key={`${statusType}-${index}`} value={statusType}>{statusType}</option>
                ))}
              </select>
            </div>
            
            {(search || type || status) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Resumo dos filtros aplicados */}
        {(search || type || status) && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">
              Filtros aplicados:
            </span>
            
            {search && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                <span>Texto: {search}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearch('')}
                />
              </Badge>
            )}
            
            {type && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                <span>Tipo: {type}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setType('')}
                />
              </Badge>
            )}
            
            {status && (
              <Badge variant="outline" className="flex items-center gap-1 bg-green-50">
                <span>Situação: {status}</span>
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setStatus('')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Cabeçalho dos Resultados */}
        <div className="mb-6 bg-white rounded-lg border p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Atividades Encontradas</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {totalActivities} {totalActivities === 1 ? 'atividade' : 'atividades'}
              </Badge>
            </div>
            
            {totalActivities > 0 && (
              <div className="text-sm text-gray-500">
                Ordenado por data (mais recente primeiro)
              </div>
            )}
          </div>
        </div>

        {/* Lista de atividades */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Carregando atividades...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-red-500 mb-4">Ocorreu um erro ao carregar as atividades: {error.message}</p>
          </div>
        ) : (
          <div>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="bg-white rounded-lg border shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* Informações principais da atividade */}
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {activity.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>Data: {formatDate(activity.sessionDate)}</span>
                              </span>
                              <span>•</span>
                              <Badge className={getTypeBadgeClass(activity.type)}>
                                {activity.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Descrição */}
                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                        
                        {/* Autores */}
                        {activity.authors && activity.authors.length > 0 && (
                          <div className="mb-4">
                            <span className="text-sm text-gray-500 mb-2 block">Autores:</span>
                            <div className="flex flex-wrap gap-2">
                              {activity.authors.map((author, authorIndex) => (
                                <div key={`${author.id}-${authorIndex}`} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                                  <User className="h-3 w-3 text-gray-600" />
                                  <span className="text-sm text-gray-700">{author.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Status e ações na mesma linha */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Situação:</span>
                            <Badge className={getStatusBadgeClass(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(activity.id, activity.title)}
                              className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                            >
                              <Download className="h-4 w-4" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20 bg-gray-50 rounded-lg"
              >
                <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma atividade encontrada</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Não foram encontradas atividades com os filtros selecionados. Tente ajustar os critérios de busca.
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </>
  );
}