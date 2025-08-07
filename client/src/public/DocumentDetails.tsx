import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  FileText, 
  User, 
  Info,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Document } from "@shared/schema";

interface DocumentDetailsPageProps {}

export default function DocumentDetails({}: DocumentDetailsPageProps) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const documentId = params.id;

  // Buscar documento por ID
  const fetchDocument = async () => {
    if (!documentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/public/documents/${documentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Documento não encontrado");
        } else {
          setError("Erro ao carregar documento");
        }
        return;
      }
      
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      setError("Erro ao carregar documento");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  // Função para formatar data
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString.toString()), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para determinar cor do badge de status
  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'vigente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'revogada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alterada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspenso':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'vigente':
        return <CheckCircle className="h-4 w-4" />;
      case 'revogada':
      case 'suspenso':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Função para fazer download do documento
  const handleDownload = () => {
    if (!document?.filePath) return;
    
    const link = window.document.createElement('a');
    link.href = `/objects/${document.filePath.replace(/^\/objects\//, '')}`;
    link.download = document.fileName || `documento-${document.documentNumber}.pdf`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setLocation('/public/documentos')}
              variant="outline"
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Documentos
            </Button>
            
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {error || "Documento não encontrado"}
                </h3>
                <p className="text-gray-600 mb-6">
                  O documento solicitado não pôde ser carregado.
                </p>
                <Button onClick={() => setLocation('/public/documentos')}>
                  Voltar aos Documentos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Botão de voltar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={() => setLocation('/public/documentos')}
              variant="outline"
              className="mb-6 flex items-center gap-2 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Documentos
            </Button>
          </motion.div>

          {/* Card principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-white shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold mb-2">
                      {document.documentType} Nº {document.documentNumber}/{new Date(document.documentDate.toString()).getFullYear()}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-blue-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(document.documentDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{document.authorType}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${getStatusBadgeClass(document.status)} text-sm font-medium px-3 py-1`}
                    >
                      {getStatusIcon(document.status)}
                      <span className="ml-1">{document.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {/* Descrição */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Descrição</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed">
                      {document.description}
                    </p>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Informações técnicas */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Documento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tipo de Documento</label>
                        <p className="text-gray-900 font-medium">{document.documentType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Número</label>
                        <p className="text-gray-900 font-medium">
                          {document.documentNumber}/{new Date(document.documentDate.toString()).getFullYear()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Órgão de Origem</label>
                        <p className="text-gray-900 font-medium">{document.authorType}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Situação</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusBadgeClass(document.status)}>
                            {getStatusIcon(document.status)}
                            <span className="ml-1">{document.status}</span>
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Data do Documento</label>
                        <p className="text-gray-900 font-medium">{formatDate(document.documentDate)}</p>
                      </div>
                      {document.fileName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Arquivo</label>
                          <p className="text-gray-900 font-medium">{document.fileName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {document.filePath ? (
                    <Button
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                      size="lg"
                    >
                      <Download className="h-5 w-5" />
                      Baixar Documento (PDF)
                    </Button>
                  ) : (
                    <Button
                      disabled
                      variant="outline"
                      className="flex items-center gap-2 opacity-50"
                      size="lg"
                    >
                      <Download className="h-5 w-5" />
                      Documento não disponível
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}