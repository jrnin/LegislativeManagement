import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login/LoginPage";

function SimpleApp() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route>
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold mb-4">Sistema de Gerenciamento Legislativo</h1>
              <p className="text-gray-600 mb-8">Bem-vindo ao sistema</p>
              <button 
                onClick={() => window.location.href = "/login"}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Fazer Login
              </button>
            </div>
          </Route>
        </Switch>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

export default SimpleApp;