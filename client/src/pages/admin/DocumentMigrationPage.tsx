import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, FolderTree, ArrowRight } from "lucide-react";

interface MigrationResult {
  totalDocuments: number;
  documentsWithFiles: number;
  migratedSuccessfully: number;
  migrationErrors: number;
  errors: string[];
}

export default function DocumentMigrationPage() {
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  const migrationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/documents/migrate-to-object-storage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    },
    onSuccess: (data) => {
      setMigrationResult(data.result);
    },
  });

  const handleStartMigration = () => {
    setMigrationResult(null);
    migrationMutation.mutate();
  };

  const getSuccessRate = () => {
    if (!migrationResult || migrationResult.documentsWithFiles === 0) return 0;
    return (migrationResult.migratedSuccessfully / migrationResult.documentsWithFiles) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Migração de Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Migre documentos do armazenamento local para Object Storage com estrutura organizada por ano/mês
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Nova Estrutura de Armazenamento
            </CardTitle>
            <CardDescription>
              Os documentos serão organizados na seguinte estrutura:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div>📁 /uploads/documents/</div>
              <div className="ml-4">📁 2024/</div>
              <div className="ml-8">📁 01/ (Janeiro)</div>
              <div className="ml-8">📁 02/ (Fevereiro)</div>
              <div className="ml-8">📁 ... (outros meses)</div>
              <div className="ml-4">📁 2025/</div>
              <div className="ml-8">📁 01/ (Janeiro)</div>
              <div className="ml-8">📁 ... (outros meses)</div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Organização por ano e mês do documento</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>ACL policies para controle de acesso</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Armazenamento em nuvem persistente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Control Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Controle de Migração
            </CardTitle>
            <CardDescription>
              Execute a migração dos documentos existentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleStartMigration}
              disabled={migrationMutation.isPending}
              className="w-full"
              size="lg"
            >
              {migrationMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Migrando Documentos...
                </>
              ) : (
                <>
                  <FolderTree className="mr-2 h-4 w-4" />
                  Iniciar Migração
                </>
              )}
            </Button>

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Esta operação migra documentos do sistema de arquivos local 
                para Object Storage organizado. A migração é segura e mantém os arquivos originais.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Migration Results */}
      {migrationResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resultado da Migração</CardTitle>
            <CardDescription>
              Relatório detalhado da operação de migração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {migrationResult.totalDocuments}
                </div>
                <div className="text-sm text-blue-600">Total de Documentos</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {migrationResult.documentsWithFiles}
                </div>
                <div className="text-sm text-yellow-600">Com Arquivos</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {migrationResult.migratedSuccessfully}
                </div>
                <div className="text-sm text-green-600">Migrados</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {migrationResult.migrationErrors}
                </div>
                <div className="text-sm text-red-600">Erros</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Sucesso</span>
                <span>{getSuccessRate().toFixed(1)}%</span>
              </div>
              <Progress value={getSuccessRate()} className="h-2" />
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              {migrationResult.migrationErrors === 0 ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Migração Concluída com Sucesso
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  Migração Concluída com Erros
                </Badge>
              )}
            </div>

            {/* Errors List */}
            {migrationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Erros Encontrados:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-1 text-sm">
                    {migrationResult.errors.slice(0, 20).map((error, index) => (
                      <li key={index} className="text-red-700">
                        • {error}
                      </li>
                    ))}
                    {migrationResult.errors.length > 20 && (
                      <li className="text-red-600 font-medium">
                        ... e mais {migrationResult.errors.length - 20} erros
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {migrationMutation.isError && (
        <Alert variant="destructive" className="mt-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao executar migração: {migrationMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}