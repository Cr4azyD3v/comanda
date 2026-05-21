import { useState, useMemo } from "react";
import {
  useListTabs,
  useCreateTab,
  useGetMenu,
  useAddTabItem,
  useRemoveTabItem,
  usePayTab,
  useCloseTab,
  getListTabsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Trash2,
  Check,
  Send,
  ListOrdered,
  ArrowLeft,
  ShoppingBag,
  Banknote,
  CreditCard,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "dinheiro" | "credito" | "debito" | "pix";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "pix", label: "Pix", icon: Smartphone },
];

function getEmployeeName() {
  return localStorage.getItem("employeeName") || "Desconhecido";
}

function actionKey(tabId: string, itemName: string) {
  return `${tabId}:${itemName}`;
}

function normalizeSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function OperatorPage() {
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isNewTabOpen, setIsNewTabOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<null | "pay" | "close">(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tabs = [] } = useListTabs({
    query: {
      refetchInterval: 3000,
      queryKey: getListTabsQueryKey(),
    },
  });

  const { data: menu = [] } = useGetMenu();

  const createTab = useCreateTab();
  const addTabItem = useAddTabItem();
  const removeTabItem = useRemoveTabItem();
  const payTab = usePayTab();
  const closeTab = useCloseTab();

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.id === selectedTabId),
    [tabs, selectedTabId],
  );

  const isAnyActionPending =
    createTab.isPending ||
    addTabItem.isPending ||
    removeTabItem.isPending ||
    payTab.isPending ||
    closeTab.isPending ||
    Boolean(busyAction);

  const refreshTabs = () => {
    queryClient.invalidateQueries({
      queryKey: getListTabsQueryKey(),
    });
  };

  const handleCreateTab = () => {
    const customer = newCustomerName.trim();
    if (!customer || createTab.isPending) return;

    setBusyAction("create-tab");

    createTab.mutate(
      {
        data: {
          customer,
          openedBy: getEmployeeName(),
        },
      },
      {
        onSuccess: (newTab) => {
          setSelectedTabId(newTab.id);
          setIsNewTabOpen(false);
          setNewCustomerName("");
          refreshTabs();

          toast({
            title: "Comanda criada",
            description: `Comanda aberta para ${newTab.customer}`,
          });
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível criar a comanda.",
          });
        },
        onSettled: () => setBusyAction(null),
      },
    );
  };

  const handleAddItem = (name: string, price: number) => {
    if (!selectedTabId) return;

    const key = actionKey(selectedTabId, name);
    if (busyAction === key || addTabItem.isPending) return;

    setBusyAction(key);

    addTabItem.mutate(
      {
        id: selectedTabId,
        data: {
          name,
          price,
          addedBy: getEmployeeName(),
        },
      },
      {
        onSuccess: refreshTabs,
        onError: () => {
          toast({
            title: "Erro",
            description: `Não foi possível adicionar ${name}.`,
          });
        },
        onSettled: () => setBusyAction(null),
      },
    );
  };

  const handleRemoveItem = (itemName: string) => {
    if (!selectedTabId) return;

    const key = actionKey(selectedTabId, `remove:${itemName}`);
    if (busyAction === key || removeTabItem.isPending) return;

    setBusyAction(key);

    removeTabItem.mutate(
      {
        id: selectedTabId,
        itemName,
      },
      {
        onSuccess: refreshTabs,
        onError: () => {
          toast({
            title: "Erro",
            description: `Não foi possível remover ${itemName}.`,
          });
        },
        onSettled: () => setBusyAction(null),
      },
    );
  };

  const handlePay = (paymentMethod: PaymentMethod) => {
    if (!selectedTabId || isAnyActionPending) return;

    setBusyAction("pay-tab");

    payTab.mutate(
      {
        id: selectedTabId,
        data: {
          paymentMethod,
          closedBy: getEmployeeName(),
        },
      },
      {
        onSuccess: () => {
          refreshTabs();
          setSelectedTabId(null);
          setPaymentDialog(null);

          toast({
            title: "Pago!",
            description: `Pagamento em ${paymentMethod} arquivado no histórico.`,
          });
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível pagar a comanda.",
          });
        },
        onSettled: () => setBusyAction(null),
      },
    );
  };

  const handleClose = (paymentMethod: PaymentMethod) => {
    if (!selectedTabId || isAnyActionPending) return;

    setBusyAction("close-tab");

    closeTab.mutate(
      {
        id: selectedTabId,
        data: {
          paymentMethod,
          closedBy: getEmployeeName(),
        },
      },
      {
        onSuccess: (res) => {
          refreshTabs();
          setSelectedTabId(null);
          setPaymentDialog(null);
          window.open(res.whatsappUrl, "_blank");

          toast({
            title: "Comanda fechada",
            description: "Recibo enviado para o WhatsApp.",
          });
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível fechar a comanda.",
          });
        },
        onSettled: () => setBusyAction(null),
      },
    );
  };

  const handlePending = async () => {
    if (!selectedTabId || isAnyActionPending) return;

    setBusyAction("pending-tab");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tabs/${selectedTabId}/pending`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            closedBy: getEmployeeName(),
          }),
        },
      );

      if (!response.ok) throw new Error("Erro ao marcar como pendente");

      const res = await response.json();

      refreshTabs();
      setSelectedTabId(null);
      setPaymentDialog(null);
      window.open(res.whatsappUrl, "_blank");

      toast({
        title: "Pendente enviado",
        description: "Mensagem com Pix enviada no WhatsApp.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como pendente.",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const filteredMenu = useMemo(() => {
    const search = normalizeSearch(searchTerm);

    if (!search) return menu;

    return menu
      .map((category) => {
        const normalizedCategory = normalizeSearch(category.category);

        return {
          ...category,
          items: category.items.filter((item) => {
            const normalizedName = normalizeSearch(item.name);
            const normalizedPrice = String(item.price);

            return (
              normalizedName.includes(search) ||
              normalizedCategory.includes(search) ||
              normalizedPrice.includes(search)
            );
          }),
        };
      })
      .filter((category) => category.items.length > 0);
  }, [menu, searchTerm]);
  const newTabDialog = (
    <Dialog open={isNewTabOpen} onOpenChange={setIsNewTabOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="default"
          disabled={isAnyActionPending}
          className="h-12 w-12 rounded-2xl shadow-[0_0_18px_rgba(0,255,136,0.25)]"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[92vw] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nova Comanda</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <Input
            autoFocus
            placeholder="Nome do cliente"
            value={newCustomerName}
            onChange={(event) => setNewCustomerName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreateTab();
            }}
            className="h-14 text-lg rounded-xl"
          />

          <Button
            size="lg"
            onClick={handleCreateTab}
            disabled={!newCustomerName.trim() || createTab.isPending || busyAction === "create-tab"}
            className="h-14 rounded-xl text-lg font-black"
          >
            {createTab.isPending || busyAction === "create-tab"
              ? "Criando..."
              : "Abrir Comanda"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const menuPanel = (
    <div className="flex flex-col h-full bg-background md:bg-card">
      <div className="p-3 md:p-4 border-b border-border bg-card/80 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />

          <Input
            placeholder="Buscar no cardápio..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-14 pl-12 text-base rounded-2xl bg-background border-border/70 focus-visible:ring-primary"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-5">
          {filteredMenu.map((category) => (
            <div key={category.category}>
              <h4 className="px-1 mb-2 text-xs font-black text-muted-foreground uppercase tracking-[0.18em]">
                {category.category}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                {category.items.map((item) => {
                  const key = selectedTabId ? actionKey(selectedTabId, item.name) : "";
                  const isBusy = busyAction === key || addTabItem.isPending;

                  return (
                    <button
                      key={item.id}
                      disabled={!selectedTabId || isBusy}
                      onClick={() => handleAddItem(item.name, item.price)}
                      className="min-h-28 rounded-2xl bg-card border border-border p-3 text-left active:scale-[0.98] transition-all hover:border-primary/50 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                    >
                      <div className="flex flex-col h-full">
                        <span className="font-black text-sm leading-tight line-clamp-3">
                          {item.name}
                        </span>

                        <span className="mt-auto pt-3 font-mono text-lg text-primary font-black">
                          {isBusy ? "..." : formatCurrency(item.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredMenu.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum item encontrado.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const tabsList = (
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-background md:bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h2 className="font-black text-2xl uppercase tracking-wider text-primary">
            Comandas
          </h2>
          <p className="text-xs text-muted-foreground">
            {tabs.length} abertas
          </p>
        </div>

        {newTabDialog}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 flex flex-col gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTabId(tab.id)}
              disabled={isAnyActionPending}
              className={`flex flex-col items-start w-full p-4 rounded-2xl border transition-all text-left active:scale-[0.99] disabled:opacity-70 ${
                selectedTabId === tab.id
                  ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(0,255,136,0.12)]"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span className="font-black text-xl truncate">
                  {tab.customer}
                </span>

                <span className="font-mono text-primary font-black text-lg shrink-0">
                  {formatCurrency(tab.total)}
                </span>
              </div>

              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-xs text-muted-foreground font-mono">
                  #{tab.id.slice(0, 6)}
                </span>

                <span className="text-xs text-muted-foreground">
                  {tab.items.length} itens
                </span>
              </div>
            </button>
          ))}

          {tabs.length === 0 && (
            <div className="text-center py-14 text-muted-foreground text-sm">
              Nenhuma comanda aberta.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
  const tabDetail = selectedTab ? (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-card flex justify-between items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 rounded-xl"
          onClick={() => setSelectedTabId(null)}
          disabled={isAnyActionPending}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-2xl truncate">
            {selectedTab.customer}
          </h3>

          <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
            #{selectedTab.id.slice(0, 8)}
          </p>

          {selectedTab.openedBy && (
            <p className="text-xs text-muted-foreground mt-1">
              Aberta por: {selectedTab.openedBy}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 rounded-2xl bg-primary/10 px-3 py-2 border border-primary/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Total
          </p>

          <p className="font-mono text-2xl font-black text-primary">
            {formatCurrency(selectedTab.total)}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 md:p-4">
        <div className="flex flex-col gap-3">
          {selectedTab.items.map((item, index) => {
            const key = actionKey(selectedTab.id, `remove:${item.name}`);
            const isRemoving = busyAction === key || removeTabItem.isPending;

            return (
              <div
                key={`${item.name}-${item.addedBy ?? "sem-funcionario"}-${index}`}
                className="flex items-center justify-between gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-base truncate">
                    {item.name}
                  </span>

                  <span className="font-mono text-sm text-primary mt-1">
                    {formatCurrency(item.price)} x {item.qty}
                  </span>

                  {item.addedBy && (
                    <span className="text-xs text-muted-foreground mt-1 truncate">
                      Adicionado por: {item.addedBy}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-black text-base">
                    {formatCurrency(item.price * item.qty)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isRemoving || isAnyActionPending}
                    onClick={() => handleRemoveItem(item.name)}
                    className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 md:p-4 bg-card border-t border-border grid grid-cols-1 gap-2 md:grid-cols-3">
        <Button
          size="lg"
          variant="outline"
          onClick={() => setIsMenuOpen(true)}
          disabled={isAnyActionPending}
          className="md:hidden rounded-2xl font-black text-base h-14 border-primary/50 hover:bg-primary/20"
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Adicionar Itens
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => setPaymentDialog("pay")}
          disabled={isAnyActionPending || selectedTab.items.length === 0}
          className="rounded-2xl font-black text-base h-14 border-primary/50 hover:bg-primary/20"
        >
          <Check className="mr-2 h-5 w-5" />
          Pagar
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handlePending}
          disabled={isAnyActionPending || selectedTab.items.length === 0}
          className="rounded-2xl font-black text-base h-14 border-yellow-500/60 text-yellow-300 hover:bg-yellow-500/10"
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          Pendente + WhatsApp
        </Button>

        <Button
          size="lg"
          onClick={() => setPaymentDialog("close")}
          disabled={isAnyActionPending || selectedTab.items.length === 0}
          className="rounded-2xl font-black text-base h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_rgba(0,255,136,0.18)]"
        >
          <Send className="mr-2 h-5 w-5" />
          Fechar + WhatsApp
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <ListOrdered className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-black mb-2">
          Nenhuma comanda selecionada
        </h2>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div
        className={`${
          selectedTab ? "hidden md:flex" : "flex"
        } md:flex h-full flex-col w-full md:w-80 shrink-0`}
      >
        {tabsList}
      </div>

      <div
        className={`${
          selectedTab ? "flex" : "hidden md:flex"
        } flex-1 flex-col h-full min-w-0`}
      >
        {tabDetail}
      </div>

      <div className="hidden md:flex w-96 border-l border-border h-full shrink-0">
        {menuPanel}
      </div>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent
          side="bottom"
          className="h-[88vh] p-0 flex flex-col md:hidden rounded-t-3xl"
        >
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-primary uppercase tracking-wider">
              Cardápio
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0">{menuPanel}</div>
        </SheetContent>
      </Sheet>
    </div>
      <Dialog
        open={paymentDialog !== null}
        onOpenChange={(open) => !open && setPaymentDialog(null)}
      >
        <DialogContent className="w-[92vw] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider">
              {paymentDialog === "close"
                ? "Fechar e Pagar"
                : "Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {selectedTab && (
              <div className="text-center mb-4 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">
                  Total
                </p>

                <p className="font-mono text-4xl font-black text-primary">
                  {formatCurrency(selectedTab.total)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="outline"
                  size="lg"
                  disabled={isAnyActionPending}
                  onClick={() =>
                    paymentDialog === "close"
                      ? handleClose(id)
                      : handlePay(id)
                  }
                  className="flex flex-col items-center justify-center h-24 rounded-2xl gap-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="w-7 h-7" />
                  <span className="font-black text-base">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}
