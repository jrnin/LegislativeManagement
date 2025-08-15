import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileX, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface OrphanedActivity {
  id: number;
  activityNumber: number;
  description: string;
  oldPath: string;
}

interface FixResult {
  message: string;
  orphanedActivities: OrphanedActivity[];
  total: number;
}

export default function OrphanedFilesPage() {
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const { toast } = useToast();

  const fixOrphanedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/activities/fix-orphaned-paths", {});
      return response.json() as Promise<FixResult>;
    },
    onSuccess: (data) => {
      setFixResult(data);
      toast({
        title: "Correção concluída",
        description: data.message,
        variant: data.orphanedActivities.length > 0 ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error("Error fixing orphaned paths:", error);
      toast({
        title: "Erro",
        description: "Erro ao corrigir caminhos órfãos",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Correção de Arquivos Órfãos</h1>
          <p className="text-muted-foreground">
            Remove referências de arquivos que não existem mais no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileX className="h-5 w-5" />
            Correção de Caminhos Órfãos
          </CardTitle>
          <CardDescription>
            Esta ferramenta identifica e corrige atividades legislativas que fazem referência 
            a arquivos que não existem mais no sistema de arquivos local.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Esta operação irá remover permanentemente as referências
              de arquivos órfãos do banco de dados. Use com cuidado.
            </AlertDescription>
          </Alert>

          <Button
            onClick={() => fixOrphanedMutation.mutate()}
            disabled={fixOrphanedMutation.isPending}
            className="w-full"
          >
            {fixOrphanedMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando e corrigindo...
              </>
            ) : (
              <>
                <FileX className="mr-2 h-4 w-4" />
                Executar Correção
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resultado da Correção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{fixResult.total}</div>
                <div className="text-sm text-blue-600">Total de Atividades</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{fixResult.orphanedActivities.length}</div>
                <div className="text-sm text-red-600">Caminhos Órfãos Corrigidos</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {fixResult.total - fixResult.orphanedActivities.length}
                </div>
                <div className="text-sm text-green-600">Atividades Intactas</div>
              </div>
            </div>

            {fixResult.orphanedActivities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Atividades Corrigidas</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fixResult.orphanedActivities.map((activity) => (
                    <div key={activity.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">#{activity.activityNumber}</Badge>
                            <span className="text-sm font-medium">ID: {activity.id}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            <strong>Caminho removido:</strong> {activity.oldPath}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fixResult.orphanedActivities.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum arquivo órfão encontrado. Todas as atividades estão com referências válidas.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}