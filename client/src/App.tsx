import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login/LoginPage";
import EmailVerificationPage from "@/pages/login/EmailVerificationPage";
import { useAuth } from "@/hooks/useAuth";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold p-4">Dashboard - Sistema Legislativo</h1>
      <p className="p-4">Você está autenticado com sucesso!</p>
    </div>
  );
}

function UnauthenticatedApp() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/verify-email" component={EmailVerificationPage} />
      <Route>
        {() => {
          window.location.href = "/login";
          return null;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const { isLoading, isAuthenticated } = useAuth();
  
  // Se estiver carregando a autenticação, mostre o loading
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Se estiver autenticado, mostre o app autenticado
  if (isAuthenticated) {
    return (
      <TooltipProvider>
        <AuthenticatedApp />
        <Toaster />
      </TooltipProvider>
    );
  }
  
  // Se não estiver autenticado, mostre o app não autenticado
  return (
    <TooltipProvider>
      <UnauthenticatedApp />
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
