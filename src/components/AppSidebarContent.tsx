import { Link, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useAppMode } from "@/hooks/useHostname";
import {
  LayoutDashboard,
  Car,
  HandCoins,
  Megaphone,
  Users,
  ArrowLeftRight,
  Package,
  Settings,
  CreditCard,
  Puzzle,
  Receipt,
  Building2,
  FileText,
  Globe,
  LogOut,
  CalendarDays,
  FileDown,
  Download,
} from "lucide-react";

type AppRole = "admin" | "commercial" | "comptable" | "dev";

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles?: AppRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/" },
  { icon: CalendarDays, label: "Agenda", path: "/agenda" },
  { icon: Car, label: "Véhicules", path: "/vehicules" },
  { icon: HandCoins, label: "Dépôt-vente", path: "/depot-vente", roles: ["admin", "commercial"] },
  { icon: Globe, label: "Site vitrine", path: "/vitrine", roles: ["admin", "commercial"] },
  { icon: Users, label: "CRM", path: "/crm", roles: ["admin", "commercial"] },
  { icon: ArrowLeftRight, label: "Reprises", path: "/reprises", roles: ["admin", "commercial"] },
  { icon: Megaphone, label: "Diffusion", path: "/diffusion", roles: ["admin", "commercial"] },
  { icon: FileText, label: "Devis", path: "/devis", roles: ["admin", "commercial", "comptable"] },
  { icon: FileDown, label: "Importation", path: "/importation", roles: ["admin", "comptable"] },
  { icon: Receipt, label: "Finance", path: "/finance", roles: ["admin", "comptable"] },
  { icon: Package, label: "Stock", path: "/stock" },
  { icon: Building2, label: "Agences", path: "/agences", roles: ["admin"] },
  { icon: CreditCard, label: "Abonnement", path: "/abonnement", roles: ["admin"] },
  { icon: Puzzle, label: "Extensions", path: "/extensions", roles: ["admin"] },
  { icon: Settings, label: "Paramètres", path: "/parametres", roles: ["admin"] },
  { icon: Download, label: "Installer l'app", path: "/install" },
];

const crmNavItems: NavItem[] = [
  { icon: Users, label: "Prospects", path: "/" },
  { icon: CalendarDays, label: "Agenda", path: "/agenda", roles: ["admin", "commercial"] },
  { icon: ArrowLeftRight, label: "Reprises", path: "/reprises", roles: ["admin", "commercial"] },
];

interface AppSidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function AppSidebarContent({ collapsed = false, onNavigate }: AppSidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, role } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    commercial: "Commercial",
    comptable: "Comptable",
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const mode = useAppMode();
  const sourceItems = mode === 'crm' ? crmNavItems : navItems;

  const filteredNavItems = sourceItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
          AF
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold tracking-tight">{mode === 'crm' ? 'AutoFlow CRM' : 'AutoFlow Pro'}</h1>
            <p className="text-[10px] opacity-70">{mode === 'crm' ? 'Gestion des prospects' : 'Gestion VO & Dépôt-vente'}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
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

      {/* User & Logout */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-1 space-y-1">
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            {role && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {roleLabels[role] || role}
              </Badge>
            )}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );
}
