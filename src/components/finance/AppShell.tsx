import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Receipt, PlusCircle, HardHat, Users, Package, Store, MapPinned, PiggyBank, CalendarClock, BarChart3, Settings, Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/nova-despesa", label: "Nova despesa", icon: PlusCircle },
  { to: "/mao-de-obra", label: "Mão de obra", icon: HardHat },
  { to: "/profissionais", label: "Profissionais", icon: Users },
  { to: "/materiais", label: "Materiais", icon: Package },
  { to: "/fornecedores", label: "Fornecedores", icon: Store },
  { to: "/areas", label: "Áreas da reforma", icon: MapPinned },
  { to: "/orcamento", label: "Orçamento", icon: PiggyBank },
  { to: "/pagamentos", label: "Pagamentos", icon: CalendarClock },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const MOBILE = ["/", "/gastos", "/nova-despesa", "/mao-de-obra"] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to} to={to} onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground" }}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="px-3 pb-6">
      <div className="font-display text-2xl font-semibold leading-none text-sidebar-foreground">Nossa Reforma</div>
      <div className="mt-1 text-xs text-muted-foreground">Controle financeiro da obra</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 py-6 lg:block">
        <Brand />
        <NavList />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="font-display text-xl font-semibold">Nossa Reforma</div>
        <button aria-label="Abrir menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-accent"><Menu className="size-5" /></button>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar pt-8">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Brand />
          <NavList onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 backdrop-blur lg:hidden">
        {NAV.filter((n) => (MOBILE as readonly string[]).includes(n.to)).map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground", path === to && "text-primary")}>
            <Icon className={cn("size-5", to === "/nova-despesa" && "text-primary")} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
