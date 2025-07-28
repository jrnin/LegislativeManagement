import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Schema de validação para login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// Tipos derivados dos schemas
type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onLogin?: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

export default function LoginPage({ onLogin }: LoginPageProps = {}) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, login } = useAuth();

  // Redirecionar se o usuário já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, user, setLocation]);

  // Form de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });



  // Função de login com email/senha
  const handleLogin = async (values: LoginFormValues) => {
    try {
      setIsLoggingIn(true);
      
      // Usar onLogin customizado se fornecido, caso contrário usar o hook padrão
      const result = onLogin 
        ? await onLogin(values.email, values.password)
        : await login(values.email, values.password);
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Você será redirecionado para o painel administrativo",
        });
        
        // Usar navegação programática do wouter apenas se não tiver onLogin customizado
        if (!onLogin) {
          setLocation("/dashboard");
        }
      } else {
        toast({
          title: "Erro ao fazer login",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            Sistema de Gerenciamento Legislativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para gerenciar atividades legislativas
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre no sistema usando seu email e senha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoggingIn}>
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}