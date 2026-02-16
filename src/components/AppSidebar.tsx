import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  HandCoins,
  Megaphone,
  Users,
  ArrowLeftRight,
  BarChart3,
  Package,
  Settings,
  CreditCard,
  Puzzle,
  ChevronLeft,
  Menu,
  Receipt,
  Building2,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/" },
  { icon: Car, label: "Véhicules", path: "/vehicules" },
  { icon: HandCoins, label: "Dépôt-vente", path: "/depot-vente" },
  { icon: Users, label: "CRM", path: "/crm" },
  { icon: ArrowLeftRight, label: "Reprises", path: "/reprises" },
  { icon: Megaphone, label: "Diffusion", path: "/diffusion" },
  { icon: Receipt, label: "Finance", path: "/finance" },
  { icon: Package, label: "Stock", path: "/stock" },
  { icon: Building2, label: "Agences", path: "/agences" },
  { icon: CreditCard, label: "Abonnement", path: "/abonnement" },
  { icon: Puzzle, label: "Extensions", path: "/extensions" },
  { icon: Settings, label: "Paramètres", path: "/parametres" },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-primary p-2 text-primary-foreground shadow-lg"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          collapsed ? "w-16 -translate-x-full lg:translate-x-0" : "w-60"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
            AF
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold tracking-tight">AutoFlow Pro</h1>
              <p className="text-[10px] opacity-70">Gestion VO & Dépôt-vente</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center border-t border-sidebar-border p-3 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
