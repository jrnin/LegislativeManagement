import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  Download, 
  Calendar, 
  HardDrive, 
  Files, 
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditReport {
  filename: string;
  timestamp: string;
  type: 'log' | 'json';
  size: number;
  created: string;
  modified: string;
}

interface AuditResult {
  success: boolean;
  auditPeriod: string;
  filesCount: number;
  totalSize: string;
  reports: {
    textFile: string;
    jsonFile: string;
  };
  output: string;
}

export default function UploadsAudit() {
  const [auditDays, setAuditDays] = useState(6);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar relatórios existentes
  const { data: reports, isLoading: reportsLoading } = useQuery<AuditReport[]>({
    queryKey: ['/api/admin/uploads/audit/reports'],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Mutation para gerar nova auditoria
  const generateAuditMutation = useMutation({
    mutationFn: async (days: number): Promise<AuditResult> => {
      const response = await fetch('/api/admin/uploads/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ days })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar auditoria');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Auditoria concluída com sucesso",
        description: `Encontrados ${data.filesCount} arquivos em ${data.auditPeriod} (${data.totalSize})`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/uploads/audit/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar auditoria",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
    }
  });

  const handleGenerateAudit = () => {
    if (auditDays < 1 || auditDays > 365) {
      toast({
        title: "Período inválido",
        description: "O período deve ser entre 1 e 365 dias",
        variant: "destructive"
      });
      return;
    }
    generateAuditMutation.mutate(auditDays);
  };

  const handleDownload = (filename: string) => {
    const downloadUrl = `/api/admin/uploads/audit/download/${filename}`;
    window.open(downloadUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    try {
      // Convert timestamp format "2025-08-04T02-02-09" to proper ISO format
      const isoString = dateString.replace(/[\-T]/g, (match, offset) => {
        if (offset < 10) return '-';  // Keep date separators
        if (offset === 10) return 'T'; // Replace first T
        return ':'; // Replace remaining dashes with colons for time
      });
      
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        // Fallback: parse manually if ISO conversion fails
        const parts = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
        if (parts) {
          const [, year, month, day, hour, minute, second] = parts;
          const validDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                                   parseInt(hour), parseInt(minute), parseInt(second));
          return format(validDate, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
        }
        return dateString; // Return original if all parsing fails
      }
      
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Auditoria de Uploads</h1>
        <p className="text-gray-600 mt-2">
          Gerencie e monitore todas as atividades do diretório /uploads
        </p>
      </div>

      {/* Card para gerar nova auditoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Gerar Nova Auditoria
          </CardTitle>
          <CardDescription>
            Analise todas as atividades de arquivo no diretório /uploads para um período específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="auditDays">Período (dias)</Label>
              <Input
                id="auditDays"
                type="number"
                min="1"
                max="365"
                value={auditDays}
                onChange={(e) => setAuditDays(parseInt(e.target.value) || 1)}
                className="w-32"
              />
            </div>
            <div className="flex-1" />
            <Button 
              onClick={handleGenerateAudit}
              disabled={generateAuditMutation.isPending}
              className="flex items-center gap-2"
            >
              {generateAuditMutation.isPending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              {generateAuditMutation.isPending ? 'Gerando...' : 'Gerar Auditoria'}
            </Button>
          </div>

          {generateAuditMutation.isSuccess && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Auditoria concluída!</strong><br />
                Período: {generateAuditMutation.data.auditPeriod}<br />
                Arquivos encontrados: {generateAuditMutation.data.filesCount}<br />
                Tamanho total: {generateAuditMutation.data.totalSize}
              </AlertDescription>
            </Alert>
          )}

          {generateAuditMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao gerar auditoria: {generateAuditMutation.error?.message || 'Erro desconhecido'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de relatórios existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Files className="h-5 w-5" />
            Relatórios de Auditoria
          </CardTitle>
          <CardDescription>
            Histórico de auditorias realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin mr-2" />
              Carregando relatórios...
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório de auditoria encontrado</p>
              <p className="text-sm">Gere uma nova auditoria para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Agrupar relatórios por timestamp */}
              {Object.entries(
                reports.reduce((groups, report) => {
                  const key = report.timestamp;
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(report);
                  return groups;
                }, {} as Record<string, AuditReport[]>)
              ).map(([timestamp, groupReports]) => (
                <div key={timestamp} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {formatDateTime(timestamp.replace(/[\-T]/g, match => match === 'T' ? ' ' : '/'))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {formatFileSize(groupReports.reduce((sum, r) => sum + r.size, 0))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupReports.map((report) => (
                      <div 
                        key={report.filename}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Relatório {report.type.toUpperCase()}
                              </span>
                              <Badge 
                                variant={report.type === 'json' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {report.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(report.size)}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(report.filename)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre o sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Auditoria de Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">O que é analisado:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Todos os arquivos em /uploads</li>
                <li>Data de criação e modificação</li>
                <li>Tamanho dos arquivos</li>
                <li>Hash MD5 para integridade</li>
                <li>Categorização por tipo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Formatos de relatório:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>LOG:</strong> Formato texto legível</li>
                <li><strong>JSON:</strong> Dados estruturados para análise</li>
                <li>Relatórios incluem estatísticas detalhadas</li>
                <li>Agrupamento por categoria de arquivo</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Dica de Uso:</h4>
            <p className="text-sm text-blue-800">
              Use auditorias regulares para monitorar o crescimento do armazenamento, 
              identificar arquivos órfãos e manter a organização do sistema. 
              Recomenda-se gerar auditorias semanais para acompanhamento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}