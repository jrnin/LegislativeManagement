import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/login/LoginPage";
import EmailVerificationPage from "@/pages/login/EmailVerificationPage";
import UserList from "@/pages/users/UserList";
import UserForm from "@/pages/users/UserForm";
import LegislatureList from "@/pages/legislatures/LegislatureList";
import LegislatureForm from "@/pages/legislatures/LegislatureForm";
import EventList from "@/pages/events/EventList";
import EventForm from "@/pages/events/EventForm";
import EventDetails from "@/pages/events/EventDetails";
import ActivityList from "@/pages/legislative-activities/ActivityList";
import ActivityForm from "@/pages/legislative-activities/ActivityForm";
import ActivityDetails from "@/pages/legislative-activities/ActivityDetails";
import DocumentList from "@/pages/documents/DocumentList";
import DocumentForm from "@/pages/documents/DocumentForm";
import CommitteeList from "@/pages/committees/CommitteeList";
import CommitteeForm from "@/pages/committees/CommitteeForm";
import CommitteeDetails from "@/pages/committees/CommitteeDetails";
import CouncilorList from "@/pages/councilors/CouncilorList";
import CouncilorDetails from "@/pages/councilors/CouncilorDetails";
import PublicRoutes from "@/public/PublicRoutes";
import { useAuth } from "@/hooks/useAuth";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationToast from "@/components/ui/notifications/NotificationToast";

function AuthenticatedApp() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/users" component={UserList} />
        <Route path="/users/new" component={UserForm} />
        <Route path="/users/:id" component={UserForm} />
        <Route path="/legislatures" component={LegislatureList} />
        <Route path="/legislatures/new" component={LegislatureForm} />
        <Route path="/legislatures/:id" component={LegislatureForm} />
        <Route path="/events" component={EventList} />
        <Route path="/events/new" component={EventForm} />
        <Route path="/events/edit/:id" component={EventForm} />
        <Route path="/events/:id" component={EventDetails} />
        <Route path="/activities" component={ActivityList} />
        <Route path="/activities/new" component={ActivityForm} />
        <Route path="/activities/:id/edit" component={ActivityForm} />
        <Route path="/activities/:id" component={ActivityDetails} />
        <Route path="/documents" component={DocumentList} />
        <Route path="/documents/new" component={DocumentForm} />
        <Route path="/documents/:id/edit" component={DocumentForm} />
        <Route path="/documents/:id" component={DocumentForm} />
        <Route path="/committees" component={CommitteeList} />
        <Route path="/committees/new" component={CommitteeForm} />
        <Route path="/committees/edit/:id" component={CommitteeForm} />
        <Route path="/committees/:id" component={CommitteeDetails} />
        <Route path="/councilors" component={CouncilorList} />
        <Route path="/councilors/:id" component={CouncilorDetails} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
  
  // Verificar se estamos em rotas especiais
  const isVerifyEmailRoute = location === "/verify-email";
  const isLoginRoute = location === "/login";
  
  // Verificar se estamos em uma rota pública
  // Considerar tanto "/public" quanto rotas na raiz como públicas, EXCETO /login
  const isPublicRoute = (location.startsWith("/public") || 
                       location === "/" || 
                       location.startsWith("/documentos") || 
                       location.startsWith("/vereadores") || 
                       location.startsWith("/atividades")) &&
                       !location.startsWith("/login") &&
                       !location.startsWith("/verify-email");
  
  // Só usar hook de auth se não for rota pública
  const { isLoading, isAuthenticated } = isPublicRoute ? { isLoading: false, isAuthenticated: false } : useAuth();
  
  // Renderizar o app com base no estado de autenticação e rota
  const renderApp = () => {
    // Se estamos em uma rota pública, renderize o site público sem verificação de auth
    if (isPublicRoute) {
      return (
        <TooltipProvider>
          <PublicRoutes />
          <Toaster />
        </TooltipProvider>
      );
    }
    
    // Se estiver carregando a autenticação, mostre o loading
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }
    
    // Se estiver autenticado, envolva com o NotificationProvider
    if (isAuthenticated) {
      return (
        <NotificationProvider>
          <AuthenticatedApp />
          <NotificationToast />
        </NotificationProvider>
      );
    }
    
    // Caso contrário, renderize o app não autenticado ou redirecione para a página pública
    if (isVerifyEmailRoute || isLoginRoute) {
      return <UnauthenticatedApp />;
    } else {
      // Redirecionar para a página pública se não estiver autenticado
      // e não estiver em nenhuma rota especial
      window.location.href = "/";
      return null;
    }
  };
  
  return (
    <TooltipProvider>
      <Toaster />
      {renderApp()}
    </TooltipProvider>
  );
}

export default App;
