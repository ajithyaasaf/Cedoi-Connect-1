import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdvancedErrorBoundary } from "@/lib/react-error-prevention";
import { ensureRefreshRuntime } from "@/lib/vite-hmr-fix";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

// Ensure RefreshRuntime is available before component definition
if (typeof window !== 'undefined') {
  ensureRefreshRuntime();
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Home />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AdvancedErrorBoundary>
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
    </AdvancedErrorBoundary>
  );
}

export default App;
