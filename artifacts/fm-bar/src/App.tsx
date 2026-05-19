import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import OperatorPage from "@/pages/operator";
import HistoryPage from "@/pages/history";
import MenuPage from "@/pages/menu";
import DashboardPage from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function ThemeInitializer() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return null;
}

function EmployeeGate({ children }: { children: React.ReactNode }) {
  const [employeeName, setEmployeeName] = useState(() => {
    return localStorage.getItem("employeeName") || "";
  });

  const [inputName, setInputName] = useState(employeeName);

  function saveEmployeeName() {
    const cleanName = inputName.trim();

    if (!cleanName) {
      alert("Digite o nome do funcionário.");
      return;
    }

    localStorage.setItem("employeeName", cleanName);
    setEmployeeName(cleanName);
  }

  function changeEmployeeName() {
    localStorage.removeItem("employeeName");
    setEmployeeName("");
    setInputName("");
  }

  if (!employeeName) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Identificar funcionário</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Digite seu nome para registrar as ações deste aparelho.
            </p>
          </div>

          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            placeholder="Ex: Lucas, Amanda, Caixa"
            value={inputName}
            onChange={(event) => setInputName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveEmployeeName();
            }}
            autoFocus
          />

          <button
            className="w-full rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
            onClick={saveEmployeeName}
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-3 right-3 z-50 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
        <div>
          Funcionário: <strong>{employeeName}</strong>
        </div>
        <button className="underline opacity-80" onClick={changeEmployeeName}>
          trocar
        </button>
      </div>

      {children}
    </>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={OperatorPage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/menu" component={MenuPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <TooltipProvider>
        <EmployeeGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </EmployeeGate>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;