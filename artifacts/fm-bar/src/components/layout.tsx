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
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0 md:pl-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 md:top-0 md:bottom-0 md:right-auto md:w-20 md:flex-col md:h-full md:border-t-0 md:border-r md:px-0 md:py-4 md:justify-start md:gap-4 z-50">
        <Link href="/" className="hidden md:flex items-center justify-center w-14 h-14 mb-2">
          <img src={logoUrl} alt="FM Dance Bar" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(0,255,136,0.45)]" />
        </Link>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center justify-center flex-1 h-full w-full md:flex-none md:h-16 group">
              <div className={`flex flex-col items-center justify-center w-full h-full gap-1 rounded-xl transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                <Icon size={24} className={isActive ? "animate-pulse" : ""} />
                <span className="text-[10px] font-medium tracking-wide md:hidden">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
