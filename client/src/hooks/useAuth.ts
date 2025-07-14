import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function useAuth(shouldFetch: boolean = true) {
  const [localLoading, setLocalLoading] = useState(shouldFetch);
  const queryClient = useQueryClient();
  
  const { 
    data: user, 
    isLoading: queryLoading, 
    error,
    refetch 
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: shouldFetch, // Habilitar a consulta automática
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  useEffect(() => {
    // Executar a consulta apenas se shouldFetch for true
    if (shouldFetch) {
      const checkAuth = async () => {
        await refetch();
        setLocalLoading(false);
      };
      
      checkAuth();
    } else {
      setLocalLoading(false);
    }
  }, [refetch, shouldFetch]);

  // Função para fazer login
  const login = async (email: string, password: string) => {
    try {
      setLocalLoading(true);
      const response = await apiRequest("POST", "/api/login/email", { email, password });
      const data = await response.json();
      
      if (data.success) {
        // Buscar os dados do usuário após login bem-sucedido
        await refetch();
        setLocalLoading(false);
        return { success: true, message: data.message };
      } else {
        setLocalLoading(false);
        return { success: false, message: data.message || "Credenciais inválidas" };
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      setLocalLoading(false);
      
      let errorMessage = "Ocorreu um erro durante o login";
      
      if (error.status === 401) {
        errorMessage = "Credenciais inválidas";
      } else if (error.status === 403) {
        errorMessage = "Email não verificado. Verifique sua caixa de entrada para ativar sua conta.";
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      setLocalLoading(true);
      await apiRequest("GET", "/api/logout");
      
      // Limpar todo o cache do React Query
      queryClient.clear();
      
      // Limpar dados locais do usuário
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Forçar limpeza de cookies/sessão localmente
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      setLocalLoading(false);
      
      // Fazer redirecionamento completo da página
      window.location.replace("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setLocalLoading(false);
      // Mesmo em caso de erro, redirecionar para login
      window.location.replace("/login");
    }
  };

  return {
    user,
    isLoading: localLoading || queryLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser: refetch
  };
}
