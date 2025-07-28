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

  // Função para fazer logout com nova abordagem mais robusta
  const logout = async () => {
    console.log('Iniciando processo de logout...');
    
    // Função para limpar todos os dados locais
    const clearLocalData = () => {
      // Limpar todo o cache do React Query
      queryClient.clear();
      
      // Limpar dados locais do usuário
      queryClient.setQueryData(["/api/auth/user"], null);
      
      // Limpar localStorage se houver dados salvos
      localStorage.clear();
      sessionStorage.clear();
      
      // Forçar limpeza completa de todos os cookies
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name) {
          // Múltiplas tentativas de limpeza de cookie para garantir remoção
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure`;
        }
      });
    };

    // Função para redirecionar forçadamente
    const forceRedirect = () => {
      console.log('Redirecionando para página de login...');
      // Usar replace para evitar voltar com o botão back
      window.location.replace("/login");
    };

    try {
      setLocalLoading(true);
      
      // Tentar fazer logout no servidor (não crítico se falhar)
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log('Resposta do servidor:', response.status);
      } catch (serverError) {
        console.warn('Erro ao comunicar com servidor, continuando logout local:', serverError);
      }
      
      // Limpar dados locais independentemente da resposta do servidor
      clearLocalData();
      
      setLocalLoading(false);
      console.log('Logout concluído, redirecionando...');
      
      // Redirecionar imediatamente
      forceRedirect();
      
    } catch (error) {
      console.error("Erro durante logout:", error);
      setLocalLoading(false);
      
      // Mesmo com erro, limpar tudo e redirecionar
      clearLocalData();
      forceRedirect();
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
