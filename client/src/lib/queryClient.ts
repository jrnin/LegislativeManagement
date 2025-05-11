import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Overload para GET request simples
export async function apiRequest<T>(url: string): Promise<T>;
// Overload para requests com método e dados
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response>;
// Implementação
export async function apiRequest<T>(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  data?: unknown | undefined,
): Promise<T | Response> {
  // Caso 1: apiRequest<T>(url)
  if (urlOrData === undefined) {
    const url = methodOrUrl;
    const res = await fetch(url, {
      method: 'GET',
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return await res.json();
  }
  
  // Caso 2: apiRequest(method, url, data?)
  const method = methodOrUrl;
  const url = urlOrData as string;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
