import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard/Dashboard";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/login/LoginPage";
import UserList from "@/pages/users/UserList";
import UserForm from "@/pages/users/UserForm";
import LegislatureList from "@/pages/legislatures/LegislatureList";
import LegislatureForm from "@/pages/legislatures/LegislatureForm";
import EventList from "@/pages/events/EventList";
import EventForm from "@/pages/events/EventForm";
import ActivityList from "@/pages/legislative-activities/ActivityList";
import ActivityForm from "@/pages/legislative-activities/ActivityForm";
import DocumentList from "@/pages/documents/DocumentList";
import DocumentForm from "@/pages/documents/DocumentForm";
import { useAuth } from "@/hooks/useAuth";

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
        <Route path="/events/:id" component={EventForm} />
        <Route path="/activities" component={ActivityList} />
        <Route path="/activities/new" component={ActivityForm} />
        <Route path="/activities/:id" component={ActivityForm} />
        <Route path="/documents" component={DocumentList} />
        <Route path="/documents/new" component={DocumentForm} />
        <Route path="/documents/:id" component={DocumentForm} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const { isLoading, isAuthenticated } = useAuth();
  
  return (
    <TooltipProvider>
      <Toaster />
      {isLoading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : isAuthenticated ? (
        <AuthenticatedApp />
      ) : (
        <LoginPage />
      )}
    </TooltipProvider>
  );
}

export default App;
