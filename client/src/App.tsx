import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/materials" component={Dashboard} />
        <Route path="/flashcards" component={Dashboard} />
        <Route path="/quiz" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
