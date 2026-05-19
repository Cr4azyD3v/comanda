import { useState, useMemo } from "react";
import { useListTabs, useCreateTab, useGetMenu, useAddTabItem, useRemoveTabItem, usePayTab, useCloseTab, getListTabsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Trash2, Check, Send, ListOrdered, ArrowLeft, ShoppingBag, Banknote, CreditCard, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "dinheiro" | "credito" | "debito" | "pix";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dinheiro", label: "Dinheiro", icon: Banknote },
  { id: "credito", label: "Crédito", icon: CreditCard },
  { id: "debito", label: "Débito", icon: CreditCard },
  { id: "pix", label: "Pix", icon: Smartphone },
];

function getEmployeeName() {
  return localStorage.getItem("employeeName") || "Desconhecido";
}

export default function OperatorPage() {
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isNewTabOpen, setIsNewTabOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<null | "pay" | "close">(null);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tabs = [] } = useListTabs({ query: { refetchInterval: 3000, queryKey: getListTabsQueryKey() } });
  const { data: menu = [] } = useGetMenu();

  const createTab = useCreateTab();
  const addTabItem = useAddTabItem();
  const removeTabItem = useRemoveTabItem();
  const payTab = usePayTab();
  const closeTab = useCloseTab();

  const selectedTab = useMemo(() => tabs.find(t => t.id === selectedTabId), [tabs, selectedTabId]);

  const handleCreateTab = () => {
    if (!newCustomerName.trim()) return;

    createTab.mutate({
      data: {
        customer: newCustomerName,
        openedBy: getEmployeeName(),
      }
    }, {
      onSuccess: (newTab) => {
        setSelectedTabId(newTab.id);
        setIsNewTabOpen(false);
        setNewCustomerName("");
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        toast({ title: "Comanda criada", description: `Comanda aberta para ${newTab.customer}` });
      }
    });
  };

  const handleAddItem = (name: string, price: number) => {
    if (!selectedTabId) return;

    addTabItem.mutate({
      id: selectedTabId,
      data: {
        name,
        price,
        addedBy: getEmployeeName(),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
      }
    });
  };

  const handleRemoveItem = (itemName: string) => {
    if (!selectedTabId) return;

    removeTabItem.mutate({ id: selectedTabId, itemName }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
      }
    });
  };

  const handlePay = (paymentMethod: PaymentMethod) => {
    if (!selectedTabId) return;

    payTab.mutate({
      id: selectedTabId,
      data: {
        paymentMethod,
        closedBy: getEmployeeName(),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        setSelectedTabId(null);
        setPaymentDialog(null);
        toast({ title: "Pago!", description: `Pagamento em ${paymentMethod} arquivado no histórico.` });
      }
    });
  };

  const handleClose = (paymentMethod: PaymentMethod) => {
    if (!selectedTabId) return;

    closeTab.mutate({
      id: selectedTabId,
      data: {
        paymentMethod,
        closedBy: getEmployeeName(),
      }
    }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListTabsQueryKey() });
        setSelectedTabId(null);
        setPaymentDialog(null);
        window.open(res.whatsappUrl, "_blank");
        toast({ title: "Comanda Fechada", description: "Recibo enviado para o WhatsApp." });
      }
    });
  };

  const isPaymentPending = payTab.isPending || closeTab.isPending;

  const filteredMenu = useMemo(() => {
    if (!searchTerm) return menu;
    const lowerSearch = searchTerm.toLowerCase();
    return menu.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.name.toLowerCase().includes(lowerSearch))
    })).filter(cat => cat.items.length > 0);
  }, [menu, searchTerm]);

  const newTabDialog = (
    <Dialog open={isNewTabOpen} onOpenChange={setIsNewTabOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="default" className="rounded-full shadow-[0_0_15px_rgba(0,255,0,0.3)]">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Comanda</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Input
            autoFocus
            placeholder="Nome do cliente"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateTab()}
            className="text-lg py-6"
          />
          <Button size="lg" onClick={handleCreateTab} disabled={!newCustomerName.trim() || createTab.isPending} className="text-lg font-bold">
            {createTab.isPending ? "Criando..." : "Abrir Comanda"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const menuPanel = (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar no cardápio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-lg py-6 bg-background border-border/50 focus-visible:ring-primary"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-6">
          {filteredMenu.map(category => (
            <div key={category.category}>
              <h4 className="px-2 mb-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">{category.category}</h4>
              <div className="grid grid-cols-2 gap-2">
                {category.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item.name, item.price)}
                    className="flex flex-col items-center justify-center p-3 h-24 bg-background border border-border rounded-lg active:scale-95 transition-transform hover:border-primary/50 text-center"
                  >
                    <span className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{item.name}</span>
                    <span className="font-mono text-primary font-bold mt-auto">{formatCurrency(item.price)}</span>
                  </button>
                ))}
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
    <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-xl uppercase tracking-wider text-primary">Comandas</h2>
        {newTabDialog}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTabId(tab.id)}
              className={`flex flex-col items-start w-full p-3 rounded-lg border transition-all text-left ${selectedTabId === tab.id ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(0,255,0,0.1)]" : "border-border/50 bg-background/50 hover:bg-card hover:border-border"}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-lg truncate pr-2">{tab.customer}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-muted-foreground font-mono">{tab.id.slice(0, 6)}</span>
                <span className="font-mono text-primary font-bold">{formatCurrency(tab.total)}</span>
              </div>
            </button>
          ))}
          {tabs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma comanda aberta.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const tabDetail = selectedTab ? (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-border bg-card flex justify-between items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedTabId(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl md:text-2xl truncate">{selectedTab.customer}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1 truncate">ID: {selectedTab.id}</p>
          {selectedTab.openedBy && (
            <p className="text-xs text-muted-foreground mt-1">Aberta por: {selectedTab.openedBy}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] md:text-sm text-muted-foreground uppercase tracking-widest">Total</p>
          <p className="font-mono text-2xl md:text-3xl font-black text-primary">{formatCurrency(selectedTab.total)}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background p-4">
        <div className="flex flex-col gap-3">
          {selectedTab.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-card border border-border/50 p-3 rounded-lg">
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-base md:text-lg truncate">{item.name}</span>
                <span className="font-mono text-sm text-primary">{formatCurrency(item.price)} x {item.qty}</span>
                {item.addedBy && (
                  <span className="text-xs text-muted-foreground">Adicionado por: {item.addedBy}</span>
                )}
              </div>
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <span className="font-mono font-bold text-base md:text-lg">{formatCurrency(item.price * item.qty)}</span>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.name)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
          {selectedTab.items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>A comanda está vazia.</p>
              <p className="text-sm mt-2">Adicione itens pelo cardápio.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 md:p-4 bg-card border-t border-border flex flex-col gap-2 md:grid md:grid-cols-3">
        <Button size="lg" variant="outline" onClick={() => setIsMenuOpen(true)} className="md:hidden font-bold text-base h-14 border-primary/50 hover:bg-primary/20">
          <ShoppingBag className="mr-2 h-5 w-5" /> Adicionar Itens
        </Button>
        <Button size="lg" variant="outline" onClick={() => setPaymentDialog("pay")} disabled={isPaymentPending || selectedTab.items.length === 0} className="font-bold text-base md:text-lg h-14 md:h-16 border-primary/50 hover:bg-primary/20">
          <Check className="mr-2 h-5 w-5" /> Pagar
        </Button>
        <Button size="lg" onClick={() => setPaymentDialog("close")} disabled={isPaymentPending || selectedTab.items.length === 0} className="font-bold text-base md:text-lg h-14 md:h-16 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(0,255,0,0.2)] md:col-span-1">
          <Send className="mr-2 h-5 w-5" /> Fechar + WhatsApp
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex-col items-center justify-center text-muted-foreground bg-background p-6 text-center hidden md:flex">
      <ListOrdered className="w-16 h-16 mb-4 opacity-20" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Nenhuma comanda selecionada</h2>
      <p>Selecione uma comanda na lista ou crie uma nova para começar a adicionar itens.</p>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className={`${selectedTab ? "hidden md:flex" : "flex"} md:flex h-full flex-col w-full md:w-80 shrink-0`}>
        {tabsList}
      </div>

      <div className={`${selectedTab ? "flex" : "hidden md:flex"} flex-1 flex-col h-full min-w-0`}>
        {tabDetail}
      </div>

      <div className="hidden md:flex w-96 border-l border-border h-full shrink-0">
        {menuPanel}
      </div>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col md:hidden">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-primary uppercase tracking-wider">Cardápio</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">{menuPanel}</div>
        </SheetContent>
      </Sheet>

      <Dialog open={paymentDialog !== null} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary uppercase tracking-wider">
              {paymentDialog === "close" ? "Fechar e Pagar" : "Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {selectedTab && (
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Total</p>
                <p className="font-mono text-3xl font-black text-primary">{formatCurrency(selectedTab.total)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_OPTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="outline"
                  size="lg"
                  disabled={isPaymentPending}
                  onClick={() => paymentDialog === "close" ? handleClose(id) : handlePay(id)}
                  className="flex flex-col items-center justify-center h-24 gap-2 border-border hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="w-7 h-7" />
                  <span className="font-bold text-base">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}