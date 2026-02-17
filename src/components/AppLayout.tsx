import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { Search, Bell } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:pl-60 transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6 py-3">
          <div className="flex items-center gap-4 pl-10 lg:pl-0">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
