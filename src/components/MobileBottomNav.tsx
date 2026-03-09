import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Car,
  Receipt,
  FileDown,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AppSidebarContent from "./AppSidebarContent";

const mainTabs = [
  { icon: LayoutDashboard, label: "Accueil", path: "/" },
  { icon: Car, label: "Véhicules", path: "/vehicules" },
  { icon: FileDown, label: "Import", path: "/importation" },
  { icon: Receipt, label: "Finance", path: "/finance" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  const filteredTabs = mainTabs.filter((tab) => {
    if (tab.path === "/importation" && role && !["admin", "comptable"].includes(role)) return false;
    if (tab.path === "/finance" && role && !["admin", "comptable"].includes(role)) return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {filteredTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg text-muted-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">Plus</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground">
            <AppSidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
