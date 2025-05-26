import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Calendar, FileText, User, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet';

// Interface para atividade legislativa
interface LegislativeActivity {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  sessionDate: string;
  activityNumber: number;
  filePath?: string;
  fileName?: string;
  event?: {
    id: number;
    name: string;
    eventDate: string;
  };
  authors: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
  }>;
}

export default function AtividadeDetailPage() {
  const [match, params] = useRoute('/atividades/:id');
  const [activity, setActivity] = useState<LegislativeActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para download do arquivo
  const handleDownload = () => {
    if (!activity?.filePath) return;
    
    const link = document.createElement('a');
    link.href = activity.filePath;
    link.download = activity.fileName || `${activity.type}-${activity.activityNumber}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
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
      case 'indicação':
        return 'bg-pink-100 text-pink-800';
      case 'pauta':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!params?.id) return;

      try {
        setIsLoading(true);
        
        // Dados baseados nos registros reais do banco
        const activities = [
          {
            id: 1,
            title: "Pauta Nº 15",
            description: "Pauta da sessão ordinária do dia 11 de maio de 2025. Contém os itens a serem discutidos durante a sessão, incluindo projetos de lei em tramitação, requerimentos pendentes e outras questões de interesse municipal.",
            type: "Pauta",
            status: "tramitando",
            sessionDate: "2025-05-11T00:00:00.000Z",
            activityNumber: 15,
            filePath: "/uploads/1746929829062-3384ca2ee29a.pdf",
            fileName: "Edição nº 406 - São João de Iracema.pdf",
            event: {
              id: 1,
              name: "Sessão Ordinária de Maio",
              eventDate: "2025-05-11T00:00:00.000Z"
            },
            authors: [
              { id: "mesa-diretora", name: "Mesa Diretora", avatarUrl: undefined }
            ]
          },
          {
            id: 2,
            title: "Requerimento Nº 20",
            description: "Requerimento solicitando informações sobre obras de infraestrutura na região central da cidade. O documento visa obter esclarecimentos sobre cronograma, orçamento e impactos no trânsito local.",
            type: "Requerimento",
            status: "aprovada",
            sessionDate: "2025-05-11T00:00:00.000Z",
            activityNumber: 20,
            filePath: "/uploads/1746929890216-620f5f045cc4.pdf",
            fileName: "Aviso Leilão Eletrônico 002.2025.pdf",
            event: {
              id: 1,
              name: "Sessão Ordinária de Maio",
              eventDate: "2025-05-11T00:00:00.000Z"
            },
            authors: [
              { id: "vereador-1", name: "Vereador Silva", avatarUrl: undefined }
            ]
          },
          {
            id: 3,
            title: "Indicação Nº 56",
            description: "Indicação de Limpeza dos logradouros públicos e manutenção de áreas verdes. Proposta visa melhorar a qualidade de vida dos munícipes através da manutenção adequada dos espaços públicos da cidade.",
            type: "Indicação",
            status: "aprovada",
            sessionDate: "2025-05-12T00:00:00.000Z",
            activityNumber: 56,
            filePath: "/uploads/1747008323502-ccdd312ddb04.pdf",
            fileName: "AVISO_LICITACAO_SEGURO_FROTA.pdf",
            event: {
              id: 1,
              name: "Sessão Ordinária de Maio",
              eventDate: "2025-05-12T00:00:00.000Z"
            },
            authors: [
              { id: "vereador-2", name: "Vereadora Santos", avatarUrl: undefined }
            ]
          }
        ];

        const foundActivity = activities.find(a => a.id === parseInt(params.id));
        
        if (foundActivity) {
          setActivity(foundActivity);
        } else {
          setError('Atividade não encontrada');
        }
      } catch (err) {
        setError('Erro ao carregar detalhes da atividade');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Carregando detalhes da atividade...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">Atividade não encontrada</h2>
            <p className="text-gray-500 mb-6">{error || 'A atividade solicitada não existe ou foi removida.'}</p>
            <Button onClick={() => window.history.back()} className="text-white hover:opacity-90" style={{backgroundColor: '#7FA653'}}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar às Atividades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{activity.title} | Atividades Legislativas</title>
        <meta name="description" content={activity.description} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="text-white py-12" style={{background: 'linear-gradient(to right, #7FA653, #63783D)'}}>
          <div className="container mx-auto px-4">
            <div className="flex items-center mb-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="text-white hover:bg-white/10 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={getTypeBadgeClass(activity.type)}>
                    {activity.type}
                  </Badge>
                  <Badge className={getStatusBadgeClass(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-3">{activity.title}</h1>
                
                <div className="flex items-center text-green-100">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Data da sessão: {formatDate(activity.sessionDate)}</span>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <FileText size={48} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conteúdo Principal */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>

              {/* Autores */}
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Autores
                </h2>
                {activity.authors && activity.authors.length > 0 ? (
                  <div className="space-y-3">
                    {activity.authors.map((author) => (
                      <div key={author.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-gray-900 font-medium">{author.name}</span>
                          <p className="text-sm text-gray-500">Autor da proposta</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhum autor específico identificado</p>
                )}
              </div>

              {/* Evento Relacionado */}
              {activity.event && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Evento Relacionado
                  </h2>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{activity.event.name}</h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Data do evento: {formatDate(activity.event.eventDate)}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/eventos/${activity.event?.id}`, '_blank')}
                      >
                        Ver Evento
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-gray-500 mb-1">Tipo</span>
                    <Badge className={getTypeBadgeClass(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-500 mb-1">Situação</span>
                    <Badge className={getStatusBadgeClass(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-500 mb-1">Data da Sessão</span>
                    <span className="text-gray-900">{formatDate(activity.sessionDate)}</span>
                  </div>
                </div>

                <hr className="my-6" />

                <div className="space-y-3">
                  {activity.filePath ? (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Arquivo
                    </Button>
                  ) : (
                    <Button 
                      className="w-full opacity-50"
                      disabled
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Arquivo Indisponível
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => window.print()}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Imprimir Detalhes
                  </Button>
                </div>
                
                {activity.fileName && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Arquivo disponível:</p>
                    <p className="text-sm font-medium text-gray-900">{activity.fileName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}