import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import HelpSupport from "@/pages/help-support";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route path="/profile">
        <Profile />
      </Route>
      <Route path="/settings">
        <Settings />
      </Route>
      <Route path="/help-support">
        <HelpSupport />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
