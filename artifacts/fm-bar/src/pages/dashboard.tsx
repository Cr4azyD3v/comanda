import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, Users, DollarSign, ShoppingBag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useGetDashboard({ query: { refetchInterval: 5000, queryKey: getGetDashboardQueryKey() } });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card">
        <h1 className="text-3xl font-black uppercase tracking-wider text-primary flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8" />
          Painel de Controle
        </h1>
        <p className="text-muted-foreground mt-2">Visão geral do movimento de hoje.</p>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {isLoading || !dashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Card key={i} className="h-32 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Faturamento Hoje</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black font-mono text-foreground">{formatCurrency(dashboard.revenueToday)}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Comandas Abertas</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black font-mono text-foreground">{dashboard.openTabs}</div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Valor em Aberto</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black font-mono text-primary">{formatCurrency(dashboard.openValue)}</div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Itens Vendidos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black font-mono text-foreground">{dashboard.ordersToday}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-bold uppercase tracking-widest text-primary">Top Itens (Qtd)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboard.topItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboard.topItems} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                          <Tooltip 
                            cursor={{fill: 'hsl(var(--muted))'}}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                          />
                          <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">Nenhuma venda hoje.</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="font-bold uppercase tracking-widest text-primary">Top Itens (Receita)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {dashboard.topItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboard.topItems} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            cursor={{fill: 'hsl(var(--muted))'}}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                          />
                          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">Nenhuma venda hoje.</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
