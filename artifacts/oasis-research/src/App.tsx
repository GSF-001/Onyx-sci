import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/Landing";
import Search from "./pages/Search";
import Copilot from "./pages/Copilot";
import Graph from "./pages/Graph";
import Gaps from "./pages/Gaps";
import Trends from "./pages/Trends";
import Collaborate from "./pages/Collaborate";
import Papers from "./pages/Papers";
import Collections from "./pages/Collections";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add dark mode by default
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/search" component={Search} />
      <Route path="/copilot" component={Copilot} />
      <Route path="/graph" component={Graph} />
      <Route path="/gaps" component={Gaps} />
      <Route path="/trends" component={Trends} />
      <Route path="/collaborate" component={Collaborate} />
      <Route path="/papers" component={Papers} />
      <Route path="/collections" component={Collections} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
