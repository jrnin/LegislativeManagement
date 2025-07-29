import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Download, 
  Database, 
  FolderOpen, 
  Settings, 
  Code, 
  Calendar,
  HardDrive,
  Shield,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function BackupManager() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Fetch available backups
  const { 
    data: backups = { database: [], files: [], config: [], source: [] } as BackupData,
    isLoading: loadingBackups,
    refetch: refetchBackups
  } = useQuery<BackupData>({
    queryKey: ['/api/system/backups'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      setIsCreatingBackup(true);
      return await apiRequest('POST', '/api/system/backup');
    },
    onSuccess: (data) => {
      toast({
        title: "Backup criado com sucesso!",
        description: `Backup completo do sistema foi criado às ${new Date().toLocaleTimeString()}`,
      });
      refetchBackups();
      setShowCreateDialog(false);
      setIsCreatingBackup(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar backup",
        description: error.message || "Falha no processo de backup do sistema",
      });
      setIsCreatingBackup(false);
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadBackup = (type: string, filename: string) => {
    const url = `/api/system/backups/download/${type}/${filename}`;
    window.open(url, '_blank');
  };

  const BackupSection = ({ 
    title, 
    icon: Icon, 
    files, 
    type, 
    description 
  }: { 
    title: string; 
    icon: React.ElementType; 
    files: BackupFile[]; 
    type: string; 
    description: string; 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
          <Badge variant="secondary">{files.length}</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum backup disponível
          </p>
        ) : (
          <div className="space-y-2">
            {files.slice(0, 5).map((file) => (
              <div 
                key={file.name} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{file.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(file.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(file.created), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadBackup(type, file.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {files.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                ... e mais {files.length - 5} backup(s)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Sistema de Backup
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie backups completos do sistema legislativo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchBackups()}
            disabled={loadingBackups}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingBackups ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={isCreatingBackup}
          >
            <Database className="h-4 w-4 mr-2" />
            {isCreatingBackup ? 'Criando...' : 'Criar Backup'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BackupSection
          title="Banco de Dados"
          icon={Database}
          files={backups.database}
          type="database"
          description="Backup completo de todos os dados do sistema"
        />
        
        <BackupSection
          title="Arquivos"
          icon={FolderOpen}
          files={backups.files}
          type="files"
          description="Backup de todos os documentos e anexos"
        />
        
        <BackupSection
          title="Configuração"
          icon={Settings}
          files={backups.config}
          type="files"
          description="Backup das configurações do sistema"
        />
        
        <BackupSection
          title="Código Fonte"
          icon={Code}
          files={backups.source}
          type="files"
          description="Backup do código-fonte da aplicação"
        />
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Frequência Recomendada:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Backup diário em horário de baixo uso</li>
                <li>• Backup imediato antes de atualizações</li>
                <li>• Backup semanal completo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Retenção:</h4>
              <ul className="space-y-1 text-muted-foreground ml-4">
                <li>• Backups são mantidos por 7 dias</li>
                <li>• Limpeza automática de arquivos antigos</li>
                <li>• Download recomendado para armazenamento externo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Backup Completo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação irá criar um backup completo do sistema, incluindo:
              <br /><br />
              • Banco de dados PostgreSQL (todas as tabelas e dados)
              <br />
              • Arquivos de upload (documentos, imagens, anexos)
              <br />
              • Configurações do sistema
              <br />
              • Código fonte da aplicação
              <br /><br />
              O processo pode levar alguns minutos para ser concluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingBackup}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => createBackupMutation.mutate()}
              disabled={isCreatingBackup}
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando Backup...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Criar Backup
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}