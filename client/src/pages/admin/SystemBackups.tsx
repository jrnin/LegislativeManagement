import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Database, Files, Settings, Code, RefreshCw, HardDrive, Calendar, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupFile {
  name: string;
  size: number;
  created: string;
  path: string;
}

interface BackupData {
  database: BackupFile[];
  files: BackupFile[];
  config: BackupFile[];
  source: BackupFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getBackupIcon(type: string) {
  switch (type) {
    case 'database':
      return <Database className="h-4 w-4" />;
    case 'files':
      return <Files className="h-4 w-4" />;
    case 'config':
      return <Settings className="h-4 w-4" />;
    case 'source':
      return <Code className="h-4 w-4" />;
    default:
      return <HardDrive className="h-4 w-4" />;
  }
}

function getBackupTypeLabel(type: string): string {
  switch (type) {
    case 'database':
      return 'Banco de Dados';
    case 'files':
      return 'Arquivos';
    case 'config':
      return 'Configuração';
    case 'source':
      return 'Código Fonte';
    default:
      return type;
  }
}

function BackupTypeCard({ type, backups, onDownload }: { 
  type: string; 
  backups: BackupFile[]; 
  onDownload: (type: string, filename: string) => void;
}) {
  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
  const latestBackup = backups[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getBackupIcon(type)}
          {getBackupTypeLabel(type)}
        </CardTitle>
        <CardDescription>
          {backups.length} backup(s) disponível(is) • {formatFileSize(totalSize)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {backups.length > 0 ? (
          <div className="space-y-3">
            {latestBackup && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Backup mais recente</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(latestBackup.created), "PPpp", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(latestBackup.size)}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onDownload(type, latestBackup.name)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Baixar
                </Button>
              </div>
            )}
            {backups.length > 1 && (
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Ver todos os {backups.length} backups
                </summary>
                <div className="mt-2 space-y-2">
                  {backups.slice(1).map((backup) => (
                    <div key={backup.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="text-sm font-medium">{backup.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(backup.created), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })} • {formatFileSize(backup.size)}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onDownload(type, backup.name)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Nenhum backup encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SystemBackups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const { data: backups, isLoading, refetch } = useQuery<BackupData>({
    queryKey: ['/api/system/backups'],
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar backup');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup criado",
        description: "O backup do sistema foi criado com sucesso",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = (type: string, filename: string) => {
    const url = `/api/system/backups/download/${type}/${filename}`;
    window.open(url, '_blank');
  };

  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    createBackupMutation.mutate();
    // Reset loading state after mutation completes
    setTimeout(() => setIsCreatingBackup(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Backups do Sistema</h1>
          <p className="text-muted-foreground">Carregando backups...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalBackups = backups ? 
    backups.database.length + backups.files.length + backups.config.length + backups.source.length : 0;
  
  const totalSize = backups ? 
    [...backups.database, ...backups.files, ...backups.config, ...backups.source]
      .reduce((sum, backup) => sum + backup.size, 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backups do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie backups completos do banco de dados, arquivos e configurações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={createBackupMutation.isPending || isCreatingBackup}
              >
                {(createBackupMutation.isPending || isCreatingBackup) ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando Backup...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4 mr-2" />
                    Criar Backup Completo
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Criação de Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso irá criar um backup completo do sistema incluindo:
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Banco de dados PostgreSQL</li>
                    <li>Arquivos de upload</li>
                    <li>Configurações do sistema</li>
                    <li>Código fonte</li>
                  </ul>
                  <br />
                  O processo pode levar alguns minutos para ser concluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateBackup}>
                  Criar Backup
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBackups}</div>
            <p className="text-xs text-muted-foreground">
              arquivos de backup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              total dos backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups?.database[0] ? 
                formatDistanceToNow(new Date(backups.database[0].created), { 
                  addSuffix: true, 
                  locale: ptBR 
                }) : 'Nunca'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              backup do banco
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Type Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {backups && (
          <>
            <BackupTypeCard 
              type="database" 
              backups={backups.database} 
              onDownload={handleDownload}
            />
            <BackupTypeCard 
              type="files" 
              backups={backups.files} 
              onDownload={handleDownload}
            />
            <BackupTypeCard 
              type="config" 
              backups={backups.config} 
              onDownload={handleDownload}
            />
            <BackupTypeCard 
              type="source" 
              backups={backups.source} 
              onDownload={handleDownload}
            />
          </>
        )}
      </div>

      {/* Recent Activity Table */}
      {totalBackups > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Os backups mais recentes criados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups && [...backups.database, ...backups.files, ...backups.config, ...backups.source]
                  .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                  .slice(0, 10)
                  .map((backup) => {
                    const type = backup.name.includes('legislative_db') ? 'database' : 
                               backup.name.includes('uploads_') ? 'files' :
                               backup.name.includes('config_') ? 'config' : 'source';
                    return (
                      <TableRow key={backup.name}>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            {getBackupIcon(type)}
                            {getBackupTypeLabel(type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{backup.name}</TableCell>
                        <TableCell>{formatFileSize(backup.size)}</TableCell>
                        <TableCell>
                          {format(new Date(backup.created), "PPpp", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownload(type, backup.name)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}