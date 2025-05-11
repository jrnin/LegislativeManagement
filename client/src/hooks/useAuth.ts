import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para fazer login
  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/login/email", { email, password });
      const data = await response.json();
      
      if (data.success) {
        // Invalidar a consulta para forçar uma nova solicitação
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Credenciais inválidas" };
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
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
      await apiRequest("GET", "/api/logout");
      queryClient.clear(); // Limpar todo o cache
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout
  };
}
