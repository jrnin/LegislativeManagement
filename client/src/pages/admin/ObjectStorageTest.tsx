import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, Image, Download } from "lucide-react";
import type { UploadResult } from "@uppy/core";

export default function ObjectStorageTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    url: string;
    path: string;
    size: number;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      toast({
        title: "Erro",
        description: "Falha ao obter URL de upload",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setIsUploading(true);
    
    try {
      for (const file of result.successful) {
        // Set ACL policy for uploaded file
        const response = await fetch('/api/objects/set-file', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileURL: file.uploadURL,
            entityType: 'test',
            entityId: 'test',
            visibility: 'private', // Test with private files
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles(prev => [...prev, {
            name: file.name || 'Unknown',
            url: file.uploadURL || '',
            path: data.objectPath,
            size: file.size || 0,
          }]);

          toast({
            title: "Sucesso",
            description: `Arquivo "${file.name}" enviado com sucesso`,
          });
        } else {
          throw new Error('Failed to set file policy');
        }
      }
    } catch (error) {
      console.error('Error setting file policy:', error);
      toast({
        title: "Erro",
        description: "Falha ao configurar permissões do arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste Object Storage</h1>
          <p className="text-muted-foreground">
            Sistema de armazenamento persistente na nuvem
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Arquivos
            </CardTitle>
            <CardDescription>
              Teste o upload de arquivos para o Object Storage do Replit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Usuário:</strong> {user?.email}</p>
              <p><strong>Limite:</strong> 10 MB por arquivo</p>
              <p><strong>Armazenamento:</strong> Persistente (não será perdido no deploy)</p>
            </div>

            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={10485760} // 10MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full"
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Selecionar Arquivos</span>
              </div>
            </ObjectUploader>

            {isUploading && (
              <div className="text-center text-muted-foreground">
                Configurando permissões dos arquivos...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Enviados</CardTitle>
              <CardDescription>
                Arquivos armazenados no Object Storage com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {file.path}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.path, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Object Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Vantagens</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Armazenamento persistente na nuvem</li>
                  <li>• Não perde arquivos no deploy</li>
                  <li>• Controle de acesso granular</li>
                  <li>• Upload direto para Google Cloud Storage</li>
                  <li>• Auditoria completa de arquivos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Configuração</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Bucket criado automaticamente</li>
                  <li>• Diretórios públicos e privados</li>
                  <li>• Políticas de ACL configuráveis</li>
                  <li>• URLs assinadas para upload</li>
                  <li>• Integração com autenticação</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm">
                <strong>Migração:</strong> Este sistema substitui o armazenamento local em `/uploads` 
                garantindo que documentos legislativos, avatares e outros arquivos sejam preservados 
                entre deploys e disponíveis em produção.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}