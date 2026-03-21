import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import OnboardingWizard from "@/components/OnboardingWizard";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import KpiCard from "@/components/KpiCard";
import WeekAgendaWidget from "@/components/WeekAgendaWidget";
import UpcomingEventsAlert from "@/components/UpcomingEventsAlert";
import { Car, Euro, TrendingUp, Users, Clock, AlertTriangle, Settings2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const SECTIONS_CONFIG = [
  { key: "agenda", label: "Agenda semaine" },
  { key: "kpis", label: "KPIs principaux" },
  { key: "kpis2", label: "KPIs secondaires" },
  { key: "alerts", label: "Rappels" },
] as const;

type SectionKey = (typeof SECTIONS_CONFIG)[number]["key"];

const DEFAULT_VISIBILITY: Record<SectionKey, boolean> = {
  kpis: true, kpis2: true, agenda: true, alerts: true,
};

const STORAGE_KEY = "dashboard_sections_visibility";

function loadVisibility(): Record<SectionKey, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_VISIBILITY };
}

export default function Dashboard() {
  const { needsOnboarding, checking, markComplete } = useOnboardingCheck();
  const [visibility, setVisibility] = useState<Record<SectionKey, boolean>>(loadVisibility);
  const [stats, setStats] = useState({
    vehiclesInStock: 0,
    totalSellingPrice: 0,
    totalPurchasePrice: 0,
    leadsCount: 0,
    deposCount: 0,
    avgDaysInStock: 0,
    oldStockCount: 0,
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  useEffect(() => {
    (async () => {
      const { data: vehicles } = await supabase.from("vehicles").select("*");
      if (!vehicles) return;

      const inStock = vehicles.filter(v => v.status === "En stock");
      const totalSelling = inStock.reduce((s, v) => s + (Number(v.selling_price) || 0), 0);
      const totalPurchase = inStock.reduce((s, v) => s + (Number(v.purchase_price) || 0), 0);

      const now = new Date();
      const daysInStock = inStock.map(v => {
        const created = new Date(v.created_at);
        return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });
      const avgDays = daysInStock.length > 0 ? Math.round(daysInStock.reduce((a, b) => a + b, 0) / daysInStock.length) : 0;
      const oldStock = daysInStock.filter(d => d > 60).length;
      const depos = vehicles.filter(v => v.status === "Dépôt-vente");

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: leadsCount } = await supabase
        .from("trade_ins")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth);

      setStats({
        vehiclesInStock: inStock.length,
        totalSellingPrice: totalSelling,
        totalPurchasePrice: totalPurchase,
        leadsCount: leadsCount || 0,
        deposCount: depos.length,
        avgDaysInStock: avgDays,
        oldStockCount: oldStock,
      });
    })();
  }, []);

  const toggle = (key: SectionKey) =>
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));

  const margin = stats.totalSellingPrice - stats.totalPurchasePrice;

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingWizard onComplete={markComplete} />;
  }

  return (
    <AppLayout title="Tableau de bord">
      {/* Section visibility toggle */}
      <div className="flex justify-end mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl shadow-sm">
              <Settings2 className="h-4 w-4" />
              Sections
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 rounded-xl">
            <p className="text-sm font-semibold mb-3">Afficher / Masquer</p>
            <div className="space-y-3">
              {SECTIONS_CONFIG.map((s) => (
                <div key={s.key} className="flex items-center justify-between">
                  <Label htmlFor={`toggle-${s.key}`} className="text-sm cursor-pointer">{s.label}</Label>
                  <Switch
                    id={`toggle-${s.key}`}
                    checked={visibility[s.key]}
                    onCheckedChange={() => toggle(s.key)}
                  />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Agenda de la semaine EN PREMIER */}
      {visibility.agenda && (
        <div className="mb-6">
          <WeekAgendaWidget />
        </div>
      )}

      {/* Rappels */}
      {visibility.alerts && (
        <div className="mb-6">
          <UpcomingEventsAlert />
        </div>
      )}

      {/* KPIs principaux - 4 cards */}
      {visibility.kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard title="Véhicules en stock" value={stats.vehiclesInStock} icon={<Car className="h-5 w-5" />} variant="default" />
          <KpiCard title="Valeur stock" value={`${stats.totalSellingPrice.toLocaleString("fr-FR")} €`} icon={<Euro className="h-5 w-5" />} variant="accent" />
          <KpiCard title="Marge prévisionnelle" value={`${margin.toLocaleString("fr-FR")} €`} icon={<TrendingUp className="h-5 w-5" />} variant={margin > 0 ? "success" : "destructive"} />
          <KpiCard title="Leads entrants" value={stats.leadsCount} icon={<Users className="h-5 w-5" />} subtitle="Ce mois" variant="violet" />
        </div>
      )}

      {/* KPIs secondaires - 3 cards */}
      {visibility.kpis2 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KpiCard title="Dépôt-vente" value={stats.deposCount} icon={<Handshake className="h-5 w-5" />} subtitle="Mandats actifs" variant="default" />
          <KpiCard title="Rotation moyenne" value={stats.avgDaysInStock > 0 ? `${stats.avgDaysInStock}j` : "—"} icon={<Clock className="h-5 w-5" />} subtitle="Temps en stock" variant="accent" />
          <KpiCard title="Stock > 60 jours" value={stats.oldStockCount} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Action requise" variant={stats.oldStockCount > 0 ? "destructive" : "default"} />
        </div>
      )}
    </AppLayout>
  );
}
