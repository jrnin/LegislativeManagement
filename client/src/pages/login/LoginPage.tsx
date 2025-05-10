import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Sistema de Gerenciamento Legislativo</h2>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta para gerenciar atividades legislativas
          </p>
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Clique no botão abaixo para fazer login no sistema.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleLogin}>
              Entrar no Sistema
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-6 flex justify-center">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-1.2.1&auto=format&fit=crop&w=3450&q=80"
              alt="Câmara Municipal"
              className="mt-4 rounded-lg shadow-lg"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-black opacity-20 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
