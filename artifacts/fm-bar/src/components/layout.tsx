import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListOrdered, MenuSquare, Receipt } from "lucide-react";
import logoUrl from "@assets/FM-removebg-preview_1776953754820.png";

const navItems = [
  { href: "/", label: "Comandas", icon: ListOrdered },
  { href: "/history", label: "Histórico", icon: Receipt },
  { href: "/menu", label: "Cardápio", icon: MenuSquare },
  { href: "/dashboard", label: "Painel", icon: LayoutDashboard },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-20 bg-card/95 border-r border-border flex-col items-center py-4 gap-4 z-50">
        <Link href="/" className="flex items-center justify-center w-14 h-14 mb-2">
          <img
            src={logoUrl}
            alt="FM Dance Bar"
            className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,255,136,0.45)]"
          />
        </Link>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;

          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="flex items-center justify-center w-14 h-14 group"
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(0,255,136,0.25)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                <Icon size={24} />
              </div>
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 h-full overflow-hidden md:pl-20 pb-[78px] md:pb-0">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="h-16 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-around px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location === href;

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 h-full items-center justify-center"
              >
                <div
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-w-[64px] transition-all duration-200 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground active:scale-95"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-bold tracking-wide">
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}