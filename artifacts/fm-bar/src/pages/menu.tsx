import { useState } from "react";
import { useGetMenu, useCreateMenuItem, useDeleteMenuItem, getGetMenuQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MenuSquare, Plus, Trash2 } from "lucide-react";

export default function MenuPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: menu = [], isLoading } = useGetMenu();
  const createItem = useCreateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddItem = () => {
    if (!newName || !newPrice || !newCategory) return;
    
    createItem.mutate({
      data: {
        name: newName,
        price: parseFloat(newPrice.replace(',', '.')),
        category: newCategory
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMenuQueryKey() });
        setIsAddOpen(false);
        setNewName("");
        setNewPrice("");
        setNewCategory("");
        toast({ title: "Item adicionado" });
      }
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover "${name}" do cardápio?`)) {
      deleteItem.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMenuQueryKey() });
          toast({ title: "Item removido" });
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider text-primary flex items-center gap-3">
            <MenuSquare className="w-8 h-8" />
            Cardápio
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie os itens disponíveis no bar.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(0,255,0,0.2)] hover:bg-primary/90">
              <Plus className="w-5 h-5 mr-2" /> Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item do Cardápio</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input placeholder="Categoria (ex: Cervejas, Drinks)" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <Input placeholder="Nome do item (ex: Heineken Long Neck)" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Preço (ex: 15.00)" type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <Button size="lg" onClick={handleAddItem} disabled={!newName || !newPrice || !newCategory || createItem.isPending} className="font-bold mt-2">
                {createItem.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {isLoading ? (
             <div className="animate-pulse space-y-4">
                <div className="h-8 bg-card w-40 rounded"></div>
                <div className="h-24 bg-card rounded"></div>
             </div>
          ) : menu.length > 0 ? (
            menu.map((category) => (
              <div key={category.category} className="space-y-4">
                <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
                  {category.category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl hover:border-border transition-colors">
                      <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="font-mono text-primary mt-1 font-semibold">{formatCurrency(item.price)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, item.name)} className="text-destructive hover:bg-destructive/20 hover:text-destructive">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <MenuSquare className="w-16 h-16 mb-4 opacity-20 mx-auto" />
              <h2 className="text-xl font-bold text-foreground mb-2">Cardápio vazio</h2>
              <p>Adicione itens para começar a vender.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
