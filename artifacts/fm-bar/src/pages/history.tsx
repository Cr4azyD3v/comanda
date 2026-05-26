import { useMemo, useState } from "react";
import {
  useListHistory,
  useClearHistory,
  getListHistoryQueryKey,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Receipt,
  Trash2,
  Download,
  RotateCcw,
} from "lucide-react";

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

  const [filter, setFilter] = useState<
    "today" | "7d" | "30d" | "all"
  >("today");

  const filteredHistory = useMemo(() => {
    const now = new Date();

    return history.filter((entry) => {
      const closedDate = new Date(entry.closedAt);

      const diffMs =
        now.getTime() - closedDate.getTime();

      const diffDays =
        diffMs / (1000 * 60 * 60 * 24);

      if (filter === "today") {
        return (
          closedDate.toDateString() ===
          now.toDateString()
        );
      }

      if (filter === "7d") {
        return diffDays <= 7;
      }

      if (filter === "30d") {
        return diffDays <= 30;
      }

      return true;
    });
  }, [history, filter]);

  const handleClear = () => {
    clearHistory.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListHistoryQueryKey(),
        });

        toast({
          title: "Histórico limpo",
          description:
            "Todas as comandas finalizadas foram apagadas.",
        });
      },
    });
  };

  const handleExportCsv = () => {
    if (filteredHistory.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "O histórico está vazio.",
      });

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

    const rows = filteredHistory.map((entry) => [
      formatDate(entry.closedAt),

      entry.customer,

      entry.items
        .map(
          (item) =>
            `${item.qty}x ${item.name} - R$ ${(
              item.price * item.qty
            ).toFixed(2)}${
              item.addedBy
                ? ` - Adicionado por: ${item.addedBy}`
                : ""
            }`,
        )
        .join(" | "),

      PAYMENT_LABELS[entry.paymentMethod] ??
        entry.paymentMethod,

      entry.closedBy ?? "",

      entry.total.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(";"))
      .join("\n");

    const blob = new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `historico-fm-bar-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast({
      title: "Histórico exportado",
      description:
        "Arquivo CSV baixado com sucesso.",
    });
  };

  const handleReopen = async (
    id: string,
    customer: string,
  ) => {
    const confirmed = window.confirm(
      `Reabrir a comanda de ${customer}?`,
    );

    if (!confirmed) return;

    const response = await fetch(
      `${API_URL}/api/history/${id}/reopen`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      toast({
        title: "Erro ao reabrir",
        description:
          "Não foi possível reabrir essa comanda.",
      });

      return;
    }

    queryClient.invalidateQueries({
      queryKey: getListHistoryQueryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: getListTabsQueryKey(),
    });

    toast({
      title: "Comanda reaberta",
      description: `${customer} voltou para comandas abertas.`,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 md:p-6 border-b border-border bg-card flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-primary flex items-center gap-3">
              <Receipt className="w-8 h-8" />
              Histórico
            </h1>

            <p className="text-muted-foreground mt-2">
              Comandas fechadas e finalizadas.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={
                filteredHistory.length === 0
              }
              onClick={handleExportCsv}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    filteredHistory.length ===
                      0 ||
                    clearHistory.isPending
                  }
                  className="border-destructive/40 text-destructive hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Histórico
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Limpar todo o histórico?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    Essa ação vai apagar
                    permanentemente todas as{" "}
                    {filteredHistory.length}{" "}
                    comandas finalizadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancelar
                  </AlertDialogCancel>

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

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={
              filter === "today"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("today")
            }
          >
            Hoje
          </Button>

          <Button
            size="sm"
            variant={
              filter === "7d"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("7d")
            }
          >
            7 dias
          </Button>

          <Button
            size="sm"
            variant={
              filter === "30d"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("30d")
            }
          >
            30 dias
          </Button>

          <Button
            size="sm"
            variant={
              filter === "all"
                ? "default"
                : "outline"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            Tudo
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 md:p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-card border border-border rounded-md animate-pulse"
              />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden bg-card w-full overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-background/50 hover:bg-background/50">
                  <TableHead>
                    Data/Hora
                  </TableHead>

                  <TableHead>
                    Cliente
                  </TableHead>

                  <TableHead>
                    Itens
                  </TableHead>

                  <TableHead>
                    Pagamento
                  </TableHead>

                  <TableHead>
                    Funcionário
                  </TableHead>

                  <TableHead className="text-right">
                    Total
                  </TableHead>

                  <TableHead className="text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredHistory.map(
                  (entry) => (
                    <TableRow
                      key={entry.id}
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {formatDate(
                          entry.closedAt,
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-lg">
                        {entry.customer}
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground max-w-[280px]">
                        <div className="flex flex-col gap-1">
                          {entry.items.map(
                            (
                              item,
                              index,
                            ) => (
                              <div
                                key={`${item.name}-${index}`}
                                className="truncate"
                              >
                                {item.qty}x{" "}
                                {item.name}

                                {item.addedBy ? (
                                  <span className="opacity-70">
                                    {" "}
                                    — por{" "}
                                    {
                                      item.addedBy
                                    }
                                  </span>
                                ) : null}
                              </div>
                            ),
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                            PAYMENT_COLORS[
                              entry
                                .paymentMethod
                            ] ??
                            "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {PAYMENT_LABELS[
                            entry
                              .paymentMethod
                          ] ??
                            entry.paymentMethod}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">
                        {entry.closedBy ??
                          "-"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-primary text-lg">
                        {formatCurrency(
                          entry.total,
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleReopen(
                              entry.id,
                              entry.customer,
                            )
                          }
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reabrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Receipt className="w-16 h-16 mb-4 opacity-20" />

            <h2 className="text-xl font-bold text-foreground mb-2">
              Nenhum histórico
            </h2>

            <p>
              Nenhuma comanda encontrada
              neste filtro.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}