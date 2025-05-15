import { Switch, Route } from "wouter";
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
import { CommitteeList } from "@/pages/committees/CommitteeList";
import { CommitteeDetails } from "@/pages/committees/CommitteeDetails";
import { CommitteeForm } from "@/pages/committees/CommitteeForm";
import { useAuth } from "@/hooks/useAuth";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationToast from "@/components/ui/notifications/NotificationToast";

function AuthenticatedApp() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
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
        <Route path="/documents/:id" component={DocumentForm} />
        <Route path="/committees" component={CommitteeList} />
        <Route path="/committees/new" component={CommitteeForm} />
        <Route path="/committees/edit/:id" component={CommitteeForm} />
        <Route path="/committees/:id" component={CommitteeDetails} />
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
  // Verificar se estamos na rota de verificação de e-mail
  const isVerifyEmailRoute = window.location.pathname === "/verify-email";
  const isLoginRoute = window.location.pathname === "/login";
  
  const { isLoading, isAuthenticated } = useAuth();
  
  // Renderizar o app com base no estado de autenticação
  const renderApp = () => {
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
    
    // Caso contrário, renderize o app não autenticado
    return isVerifyEmailRoute || isLoginRoute ? (
      <UnauthenticatedApp />
    ) : (
      <LoginPage />
    );
  };
  
  return (
    <TooltipProvider>
      <Toaster />
      {renderApp()}
    </TooltipProvider>
  );
}

export default App;
