import DirectLoginPage from "./pages/login/DirectLoginPage";
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={DirectLoginPage} />
        <Route path="/login" component={DirectLoginPage} />
        <Route path="/debug">
          {() => {
            window.location.href = '/debug';
            return null;
          }}
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;
