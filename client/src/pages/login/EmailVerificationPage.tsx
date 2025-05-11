import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function EmailVerificationPage() {
  const [location, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error" | "manual">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Obtém o valor do parâmetro 'verified' da URL
    const searchParams = new URLSearchParams(window.location.search);
    const verifiedParam = searchParams.get("verified");
    
    if (verifiedParam === "true") {
      setVerificationStatus("success");
    } else if (verifiedParam === "false") {
      setVerificationStatus("error");
      setErrorMessage(searchParams.get("message") || "Não foi possível verificar seu email. Por favor, tente novamente.");
    } else {
      // Acesso manual para verificação
      setVerificationStatus("manual");
    }
  }, [setLocation]);
  
  // Função para verificar manualmente o e-mail com o token
  const handleManualVerification = async () => {
    if (!verificationToken || verificationToken.trim() === "") {
      toast({
        title: "Erro",
        description: "Por favor, informe o token de verificação",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Redirecionamento para a API de verificação
      window.location.href = `/api/verify-email?token=${verificationToken}`;
    } catch (error) {
      console.error("Erro na verificação manual:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o email. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold">Verificando seu email...</h3>
            <p className="text-gray-500 mt-2">Por favor, aguarde um momento.</p>
          </div>
        );
        
      case "success":
        return (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold">Email verificado com sucesso!</h3>
            <p className="text-gray-500 mt-2">Sua conta foi ativada e você já pode fazer login no sistema.</p>
            <Button className="mt-6" asChild>
              <Link href="/login">Ir para a página de login</Link>
            </Button>
          </div>
        );
        
      case "error":
        return (
          <div className="flex flex-col items-center py-8">
            <XCircle className="h-16 w-16 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold">Erro ao verificar email</h3>
            <p className="text-gray-500 mt-2">{errorMessage}</p>
            <div className="flex gap-4 mt-6">
              <Button variant="outline" asChild>
                <Link href="/login">Voltar para login</Link>
              </Button>
              <Button asChild>
                <a href="mailto:suporte@sistema-legislativo.com.br">Contatar suporte</a>
              </Button>
            </div>
          </div>
        );
        
      case "manual":
        return (
          <div className="flex flex-col items-center py-8">
            <Mail className="h-16 w-16 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold">Verificação Manual de Email</h3>
            <p className="text-gray-500 mt-2 text-center">
              O SendGrid não está enviando emails. Para fins de teste, cole o token de verificação abaixo.
            </p>
            <div className="w-full mt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  O token pode ser encontrado no console do servidor após o registro.
                </p>
                <Input
                  type="text"
                  placeholder="Cole o token de verificação aqui"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/login">Voltar para login</Link>
                </Button>
                <Button 
                  onClick={handleManualVerification}
                  disabled={isSubmitting || !verificationToken}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Email"
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
            Sistema de Gerenciamento Legislativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Verificação de email
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Verificação de Email</CardTitle>
            <CardDescription>
              {verificationStatus === "success" 
                ? "Seu email foi verificado com sucesso" 
                : verificationStatus === "error" 
                  ? "Ocorreu um erro ao verificar seu email" 
                  : "Verificando seu email..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}