import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UseApiFetchOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApiFetch<T = any>({ onSuccess, onError }: UseApiFetchOptions<T> = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = async (
    method: string,
    url: string,
    data?: unknown
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(method, url, data);
      const result = await response.json();
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setLoading(false);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro durante a operação.",
      });
      
      if (onError) {
        onError(error);
      }
      
      return null;
    }
  };

  return {
    loading,
    error,
    get: (url: string) => fetchData("GET", url),
    post: (url: string, data: unknown) => fetchData("POST", url, data),
    put: (url: string, data: unknown) => fetchData("PUT", url, data),
    patch: (url: string, data: unknown) => fetchData("PATCH", url, data),
    delete: (url: string) => fetchData("DELETE", url),
  };
}
