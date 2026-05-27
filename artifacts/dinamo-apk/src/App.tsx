import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route } from "wouter";
import Home from "@/pages/home";
import PlayerDetail from "@/pages/player-detail";
import Compare from "@/pages/compare";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark min-h-screen bg-background text-foreground">
        <WouterRouter base={base}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/player/:id" component={PlayerDetail} />
            <Route path="/compare" component={Compare} />
          </Switch>
        </WouterRouter>
      </div>
    </QueryClientProvider>
  );
}
