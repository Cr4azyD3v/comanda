import { useListHistory, useClearHistory, getListHistoryQueryKey, getListTabsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Trash2, Download, RotateCcw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  credito: "Crédito",
  debito: "Débito",
  pix: "Pix",
};

const PAYMENT_COLORS: Record<string, string> = {
  dinheiro: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  credito: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  debito: "bg-purple-500/15 text-purple-300 border-purple-500/40",
  pix: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function HistoryPage() {
  const { data: history = [], isLoading } = useListHistory();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const clearHistory = useClearHistory();

  const handleClear = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
        toast({ title: "Histórico limpo", description: "Todas as comandas finalizadas foram apagadas." });
      },
    });
  };

  const handleExportCsv = () => {
    if (history.length === 0) {
      toast({ title: "Nada para exportar", description: "O histórico está vazio." });
      return;
    }

    const header = [
      "Data/Hora",
      "Cliente",
      "Itens",
      "Pagamento",
      "Fechado por",
      "Total",
    ];

    const rows = history.map((entry) => [
      formatDate(entry.closedAt),
      entry.customer,
      entry.items.map((item) => `${item.qty}x ${item.name} - R$ ${(item.price * item.qty).toFixed(2)}`).join(" | "),
      PAYMENT_LABELS[entry.paymentMethod] ?? entry.paymentMethod,
      entry.closedBy ?? "",
      entry.total.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(";"))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `historico-fm-bar-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast({ title: "Histórico exportado", description: "Arquivo CSV baixado com sucesso." });
  };

  const handleReopen = async (id: string, customer: string) => {
    const confirmed = window.confirm(`Reabrir a comanda de ${customer}? Ela será removida do histórico e voltará para comandas abertas.`);

    if (!confirmed) return;

    const response = await fetch(`${API_URL}/api/history/${id}/reopen`, {
      method: "POST",
    });

    if (!response.ok) {
      toast({ title: "Erro ao reabrir", description: "Não foi possível reabrir essa comanda." });
      return;
    }

    queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });

    toast({ title: "Comanda reaberta", description: `A comanda de ${customer} voltou para as comandas abertas.` });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-primary flex items-center gap-3">
            <Receipt className="w-8 h-8" />
            Histórico
          </h1>
          <p className="text-muted-foreground mt-2">Comandas fechadas e finalizadas.</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={history.length === 0}
            onClick={handleExportCsv}
          >
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={history.length === 0 || clearHistory.isPending}
                className="border-destructive/40 text-destructive hover:bg-destructive/15 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Limpar Histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todo o histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação vai apagar permanentemente todas as {history.length} comandas finalizadas.
                  Não dá para desfazer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClear}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Apagar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-card border border-border rounded-md animate-pulse" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/50 hover:bg-background/50">
                  <TableHead className="font-bold text-foreground">Data/Hora</TableHead>
                  <TableHead className="font-bold text-foreground">Cliente</TableHead>
                  <TableHead className="font-bold text-foreground">Itens</TableHead>
                  <TableHead className="font-bold text-foreground">Pagamento</TableHead>
                  <TableHead className="font-bold text-foreground">Fechado por</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Total</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-background/50 border-border">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {formatDate(entry.closedAt)}
                    </TableCell>

                    <TableCell className="font-bold text-lg">{entry.customer}</TableCell>

                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                      {entry.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                    </TableCell>

                    <TableCell>
                      <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${PAYMENT_COLORS[entry.paymentMethod] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {PAYMENT_LABELS[entry.paymentMethod] ?? entry.paymentMethod}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {entry.closedBy ?? "-"}
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-primary text-lg">
                      {formatCurrency(entry.total)}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(entry.id, entry.customer)}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reabrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Receipt className="w-16 h-16 mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhum histórico</h2>
            <p>As comandas fechadas aparecerão aqui.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}