import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileText, Users, Newspaper, Activity, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MigrationResult {
  users: { updated: number; errors: number };
  activities: { updated: number; errors: number };
  documents: { updated: number; errors: number };
  news: { updated: number; errors: number };
}

interface MigrationResponse {
  success: boolean;
  message: string;
  results: MigrationResult;
  totalUpdated: number;
  totalErrors: number;
}

export default function FileMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResponse | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/migrate-file-references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result: MigrationResponse = await response.json();
      setMigrationResult(result);

      if (result.success) {
        toast({
          title: "Migração Concluída",
          description: `${result.totalUpdated} referências atualizadas com sucesso!`,
        });
      } else {
        toast({
          title: "Erro na Migração",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar migração",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const MigrationItem = ({ 
    icon: Icon, 
    title, 
    description, 
    oldPath, 
    newPath, 
    result 
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    oldPath: string;
    newPath: string;
    result?: { updated: number; errors: number };
  }) => (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <Icon className="h-6 w-6 text-blue-600" />
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">{oldPath}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-green-600">{newPath}</span>
          </div>
        </div>
      </div>
      {result && (
        <div className="text-right">
          <Badge variant={result.errors > 0 ? "destructive" : "default"}>
            {result.updated} atualizados
          </Badge>
          {result.errors > 0 && (
            <Badge variant="destructive" className="ml-1">
              {result.errors} erros
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Migração de Arquivos para Object Storage</h1>
        <p className="text-gray-600 mt-2">
          Migrate as referências do banco de dados para os novos caminhos do Object Storage na nuvem.
        </p>
      </div>

      {/* Warning Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span>Importante</span>
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Esta operação atualiza as referências de arquivos no banco de dados para apontar para o Object Storage.
            Certifique-se de que a migração de arquivos já foi executada com sucesso.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Migration Items */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Arquivo a Migrar</CardTitle>
          <CardDescription>
            As seguintes categorias serão migradas do sistema de arquivos local para o Object Storage:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MigrationItem
            icon={Users}
            title="Avatares de Usuários"
            description="Fotos de perfil dos usuários do sistema"
            oldPath="/uploads/avatars/"
            newPath="/public-objects/public/avatars/"
            result={migrationResult?.results.users}
          />
          
          <MigrationItem
            icon={Newspaper}
            title="Imagens de Notícias"
            description="Imagens associadas às notícias publicadas"
            oldPath="/uploads/news/"
            newPath="/public-objects/public/news/"
            result={migrationResult?.results.news}
          />
          
          <MigrationItem
            icon={Activity}
            title="Documentos de Atividades"
            description="Arquivos anexados às atividades legislativas"
            oldPath="/uploads/activities/"
            newPath="/objects/.private/activities/"
            result={migrationResult?.results.activities}
          />
          
          <MigrationItem
            icon={FileText}
            title="Documentos Oficiais"
            description="Documentos oficiais e anexos"
            oldPath="/uploads/documents/"
            newPath="/objects/.private/documents/"
            result={migrationResult?.results.documents}
          />
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResult && (
        <Card className={migrationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${migrationResult.success ? "text-green-800" : "text-red-800"}`}>
              <CheckCircle className="h-5 w-5" />
              <span>Resultado da Migração</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{migrationResult.totalUpdated}</div>
                <div className="text-sm text-gray-600">Referências Atualizadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{migrationResult.totalErrors}</div>
                <div className="text-sm text-gray-600">Erros Encontrados</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-700">{migrationResult.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={handleMigration} 
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Executando Migração...' : 'Executar Migração das Referências'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}