import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import LoginPage from "@/pages/login/LoginPage";
import Dashboard from "@/pages/dashboard/Dashboard";
import Layout from "@/components/layout/Layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function SimpleApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await apiRequest<User>('/api/auth/user');
      setUser(userData);
      
      // Se estiver na página de login e autenticado, redireciona
      if (location === '/login' && userData) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.log('Usuário não autenticado');
      if (location !== '/login') {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/login/email", { email, password });
      const data = await response.json();
      
      if (data.success) {
        await checkAuth(); // Recarrega dados do usuário
        navigate('/dashboard');
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      return { success: false, message: "Erro ao fazer login" };
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("GET", "/api/logout");
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {user ? (
        <Layout>
          <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard - Sistema Legislativo</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sair
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Eventos</h2>
                <p className="text-gray-600 mb-4">Gerencie eventos legislativos</p>
                <button
                  onClick={() => navigate('/events')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ver Eventos
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Atividades</h2>
                <p className="text-gray-600 mb-4">Gerencie atividades legislativas</p>
                <button
                  onClick={() => navigate('/activities')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ver Atividades
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Documentos</h2>
                <p className="text-gray-600 mb-4">Gerencie documentos</p>
                <button
                  onClick={() => navigate('/documents')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Ver Documentos
                </button>
              </div>
            </div>
            
            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Sistema de Timeline</h3>
              <p className="text-blue-700">
                O sistema de timeline dos eventos está funcionando! Ele rastreia automaticamente:
              </p>
              <ul className="list-disc list-inside text-blue-700 mt-2">
                <li>Navegação entre abas dos eventos</li>
                <li>Criação de comentários</li>
                <li>Visualização de atividades e documentos</li>
                <li>Ações dos usuários em tempo real</li>
              </ul>
            </div>
          </div>
        </Layout>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
      <Toaster />
    </TooltipProvider>
  );
}