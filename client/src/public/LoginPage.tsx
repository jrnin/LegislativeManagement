import React from 'react';
import { Helmet } from 'react-helmet';
import { LogIn, Shield, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const handleLogin = () => {
    // Redirect to the server login endpoint
    window.location.href = '/api/login';
  };

  return (
    <>
      <Helmet>
        <title>Login | Câmara Municipal de Jaíba</title>
        <meta name="description" content="Acesse o sistema da Câmara Municipal de Jaíba" />
      </Helmet>
      
      {/* Header */}
      <div className="text-white py-16" style={{background: 'linear-gradient(to right, #7FA653, #63783D)'}}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Acesso ao Sistema</h1>
            <p className="text-xl text-white opacity-90 max-w-2xl mx-auto">
              Entre no sistema da Câmara Municipal de Jaíba para acessar 
              funcionalidades administrativas e recursos internos.
            </p>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Login do Sistema
              </CardTitle>
              <CardDescription>
                Faça login para acessar o painel administrativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Button 
                  onClick={handleLogin}
                  className="w-full"
                  size="lg"
                  style={{backgroundColor: '#007825'}}
                >
                  <LogIn size={20} className="mr-2" />
                  Entrar com Replit
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                <p>
                  Utilize suas credenciais do Replit para acessar o sistema.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="mt-8 grid grid-cols-1 gap-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Users size={20} className="text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Gestão de Usuários</h3>
                <p className="text-sm text-gray-600">Gerencie vereadores e funcionários</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <FileText size={20} className="text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Documentos</h3>
                <p className="text-sm text-gray-600">Crie e gerencie documentos oficiais</p>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <Shield size={20} className="text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Segurança</h3>
                <p className="text-sm text-gray-600">Acesso seguro e controlado</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}