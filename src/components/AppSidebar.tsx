import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import AppSidebarContent from "./AppSidebarContent";

export default function AppSidebar() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        desktopCollapsed ? "w-16" : "w-60"
      }`}
    >
      <AppSidebarContent collapsed={desktopCollapsed} />
      <div className="px-3 pb-3">
        <button
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="flex items-center justify-center w-full text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${desktopCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}
