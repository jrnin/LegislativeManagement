import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { FileText, CloudUpload, CheckCircle, AlertTriangle, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/utils/formatters";
import type { Document } from "@shared/schema";

interface MigrationStatus {
  id: number;
  fileName: string;
  originalPath: string;
  status: 'pending' | 'migrating' | 'success' | 'error';
  error?: string;
  newPath?: string;
}

export default function DocumentMigration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [migrationProgress, setMigrationProgress] = useState<MigrationStatus[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<string>("");

  // Get documents with local file paths that need migration
  const { data: documentsToMigrate = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    select: (data) => data.filter(doc => 
      doc.filePath && 
      !doc.filePath.startsWith('/objects/') && 
      doc.filePath.includes('/home/runner/workspace/uploads/')
    ),
  });

  const migrationMutation = useMutation({
    mutationFn: async (documentIds: number[]) => {
      const response = await fetch('/api/admin/migrate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Migração concluída",
        description: "Documentos migrados para Object Storage com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsRunning(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro na migração",
        description: error.message,
      });
      setIsRunning(false);
    },
  });

  const handleMigrateSingle = async (document: Document) => {
    setIsRunning(true);
    setCurrentDocument(document.fileName || "");
    
    const initialStatus: MigrationStatus = {
      id: document.id,
      fileName: document.fileName || "",
      originalPath: document.filePath || "",
      status: 'migrating'
    };
    
    setMigrationProgress([initialStatus]);

    try {
      await migrationMutation.mutateAsync([document.id]);
      
      setMigrationProgress([{
        ...initialStatus,
        status: 'success',
        newPath: '/objects/...' // Will be set by the backend
      }]);
    } catch (error) {
      setMigrationProgress([{
        ...initialStatus,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }]);
    }
    
    setCurrentDocument("");
  };

  const handleMigrateAll = async () => {
    if (documentsToMigrate.length === 0) return;
    
    setIsRunning(true);
    setCurrentDocument("Migrando todos os documentos...");
    
    const initialStatuses: MigrationStatus[] = documentsToMigrate.map(doc => ({
      id: doc.id,
      fileName: doc.fileName || "",
      originalPath: doc.filePath || "",
      status: 'pending'
    }));
    
    setMigrationProgress(initialStatuses);

    try {
      const documentIds = documentsToMigrate.map(doc => doc.id);
      await migrationMutation.mutateAsync(documentIds);
      
      // Update all to success
      setMigrationProgress(prev => prev.map(status => ({
        ...status,
        status: 'success' as const
      })));
    } catch (error) {
      // Mark all as error
      setMigrationProgress(prev => prev.map(status => ({
        ...status,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })));
    }
    
    setCurrentDocument("");
  };

  const getStatusIcon = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'migrating':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: MigrationStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'migrating':
        return <Badge variant="default">Migrando</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">Carregando...</div>;
  }

  return (
    <div className="container px-4 sm:px-6 lg:px-8 mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Migração de Documentos</h1>
          <p className="text-muted-foreground">
            Migre documentos do armazenamento local para Object Storage
          </p>
        </div>
      </div>

      {documentsToMigrate.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Todos os documentos já foram migrados para Object Storage ou não há documentos para migrar.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{documentsToMigrate.length} documento(s)</strong> precisam ser migrados do armazenamento local para Object Storage.
                Esta operação irá mover os arquivos para o cloud storage e atualizar os caminhos no banco de dados.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={handleMigrateAll}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <CloudUpload className="h-4 w-4" />
              Migrar Todos ({documentsToMigrate.length})
            </Button>
          </div>

          {isRunning && currentDocument && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processando: {currentDocument}</span>
                  </div>
                  <Progress value={migrationProgress.length > 0 ? 
                    (migrationProgress.filter(p => p.status === 'success' || p.status === 'error').length / migrationProgress.length) * 100 
                    : 0} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {migrationProgress.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Status da Migração</CardTitle>
                <CardDescription>
                  Progresso da migração dos documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {migrationProgress.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status.status)}
                        <div>
                          <p className="font-medium">{status.fileName}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">
                            {status.originalPath}
                          </p>
                          {status.error && (
                            <p className="text-sm text-red-600 mt-1">{status.error}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(status.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Documentos Pendentes</CardTitle>
              <CardDescription>
                Documentos que ainda estão no armazenamento local
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentsToMigrate.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {document.documentType} Nº {document.documentNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {document.fileName} • {document.documentDate ? formatDate(document.documentDate.toString()) : ""}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {document.filePath}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/download/documents/${document.id}`, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleMigrateSingle(document)}
                        disabled={isRunning}
                      >
                        <CloudUpload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}