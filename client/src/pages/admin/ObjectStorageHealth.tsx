import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database,
  HardDrive,
  Cloud,
  FileX,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HealthReport {
  totalDocuments: number;
  totalActivities: number;
  documentsWithFiles: number;
  activitiesWithFiles: number;
  objectStorageFiles: number;
  legacyFiles: number;
  missingFiles: number;
  issues: DiagnosticResult[];
}

interface DiagnosticResult {
  entityType: string;
  entityId: number;
  expectedPath: string;
  exists: boolean;
  issue: string | null;
  fixable: boolean;
}

export default function ObjectStorageHealth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { 
    data: healthReport, 
    isLoading: healthLoading, 
    error: healthError,
    refetch: refetchHealth 
  } = useQuery<HealthReport>({
    queryKey: ["/api/admin/object-storage/health"],
  });

  const cleanupMutation = useMutation({
    mutationFn: async (dryRun: boolean) => {
      const response = await fetch(`/api/admin/object-storage/cleanup?dryRun=${dryRun}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao executar limpeza');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: data.dryRun ? "Simulação Concluída" : "Limpeza Concluída",
        description: data.message,
        variant: "default",
      });
      if (!data.dryRun) {
        // Refresh health report after actual cleanup
        refetchHealth();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao executar limpeza",
        variant: "destructive",
      });
    }
  });

  const handleCleanup = (dryRun: boolean) => {
    cleanupMutation.mutate(dryRun);
  };

  if (healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando relatório de saúde do Object Storage...</span>
        </div>
      </div>
    );
  }

  if (healthError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar relatório: {(healthError as any)?.message || "Erro desconhecido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!healthReport) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nenhum dado disponível
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const healthScore = Math.round(
    ((healthReport.objectStorageFiles + healthReport.legacyFiles - healthReport.missingFiles) / 
     (healthReport.documentsWithFiles + healthReport.activitiesWithFiles)) * 100
  ) || 100;

  const criticalIssues = healthReport.issues.filter(i => !i.exists);
  const warnings = healthReport.issues.filter(i => i.exists && i.issue);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Saúde do Object Storage</h1>
          <p className="text-muted-foreground">
            Monitor e diagnostique problemas com arquivos no sistema
          </p>
        </div>
        <Button
          onClick={() => refetchHealth()}
          disabled={healthLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="issues">
            Problemas 
            {criticalIssues.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalIssues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {healthScore >= 90 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : healthScore >= 70 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Pontuação de Saúde: {healthScore}%
              </CardTitle>
              <CardDescription>
                Estado geral da integridade dos arquivos no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={healthScore} className="h-3" />
              <div className="mt-2 text-sm text-muted-foreground">
                {healthScore >= 90 && "Excelente - Sistema funcionando perfeitamente"}
                {healthScore >= 70 && healthScore < 90 && "Bom - Alguns problemas menores detectados"}
                {healthScore < 70 && "Crítico - Múltiplos problemas detectados"}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Database className="h-8 w-8 text-blue-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{healthReport.totalDocuments}</p>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <HardDrive className="h-8 w-8 text-green-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{healthReport.totalActivities}</p>
                  <p className="text-sm text-muted-foreground">Total de Atividades</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Cloud className="h-8 w-8 text-purple-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{healthReport.objectStorageFiles}</p>
                  <p className="text-sm text-muted-foreground">Arquivos no Object Storage</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <FileX className="h-8 w-8 text-red-500 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{healthReport.missingFiles}</p>
                  <p className="text-sm text-muted-foreground">Arquivos Ausentes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Storage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Armazenamento</CardTitle>
              <CardDescription>
                Como os arquivos estão distribuídos entre sistemas de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-purple-500" />
                    Object Storage
                  </span>
                  <span className="font-medium">{healthReport.objectStorageFiles} arquivos</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    Sistema Local (Legacy)
                  </span>
                  <span className="font-medium">{healthReport.legacyFiles} arquivos</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="flex items-center gap-2">
                    <FileX className="h-4 w-4" />
                    Arquivos Ausentes
                  </span>
                  <span className="font-medium">{healthReport.missingFiles} arquivos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          {criticalIssues.length === 0 && warnings.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum problema detectado</h3>
                  <p className="text-muted-foreground">
                    Todos os arquivos estão funcionando corretamente
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {criticalIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      Problemas Críticos ({criticalIssues.length})
                    </CardTitle>
                    <CardDescription>
                      Arquivos que não foram encontrados no armazenamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalIssues.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {issue.entityType === 'document' ? 'Documento' : 'Atividade'} ID: {issue.entityId}
                              </p>
                              <p className="text-sm text-muted-foreground">{issue.expectedPath}</p>
                              <p className="text-sm text-red-600">{issue.issue}</p>
                            </div>
                            <Badge variant="destructive">Crítico</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      Avisos ({warnings.length})
                    </CardTitle>
                    <CardDescription>
                      Problemas que não impedem o funcionamento mas devem ser resolvidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {warnings.map((issue, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {issue.entityType === 'document' ? 'Documento' : 'Atividade'} ID: {issue.entityId}
                              </p>
                              <p className="text-sm text-muted-foreground">{issue.expectedPath}</p>
                              <p className="text-sm text-yellow-600">{issue.issue}</p>
                            </div>
                            <Badge variant="secondary">Aviso</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Limpeza de Referências
              </CardTitle>
              <CardDescription>
                Remove referências do banco de dados para arquivos que não existem mais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Esta operação remove permanentemente as referências de arquivos ausentes do banco de dados.
                  Execute primeiro uma simulação para ver quais referências serão removidas.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCleanup(true)}
                  disabled={cleanupMutation.isPending}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${cleanupMutation.isPending ? 'animate-spin' : ''}`} />
                  Simular Limpeza
                </Button>
                
                <Button
                  onClick={() => handleCleanup(false)}
                  disabled={cleanupMutation.isPending || criticalIssues.length === 0}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Executar Limpeza Real
                </Button>
              </div>

              {criticalIssues.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma referência para limpeza encontrada.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}