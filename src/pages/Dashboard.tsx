import AppLayout from "@/components/AppLayout";
import KpiCard from "@/components/KpiCard";
import TodayAgendaWidget from "@/components/TodayAgendaWidget";
import { Car, Euro, TrendingUp, Users, Clock, CalendarCheck, AlertTriangle, ArrowUpDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const caData = [
  { mois: "Sep", ca: 45000 }, { mois: "Oct", ca: 62000 }, { mois: "Nov", ca: 38000 },
  { mois: "Déc", ca: 71000 }, { mois: "Jan", ca: 55000 }, { mois: "Fév", ca: 68000 },
];

const margeData = [
  { mois: "Sep", marge: 12000 }, { mois: "Oct", marge: 18000 }, { mois: "Nov", marge: 9500 },
  { mois: "Déc", marge: 21000 }, { mois: "Jan", marge: 15000 }, { mois: "Fév", marge: 19500 },
];

const platformData = [
  { name: "Leboncoin", value: 45, color: "hsl(199, 89%, 48%)" },
  { name: "AutoScout24", value: 30, color: "hsl(152, 60%, 45%)" },
  { name: "LaCentrale", value: 25, color: "hsl(38, 92%, 55%)" },
];

export default function Dashboard() {
  return (
    <AppLayout title="Tableau de bord">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Véhicules en stock" value={24} icon={<Car className="h-5 w-5" />} trend={{ value: 8, positive: true }} />
        <KpiCard title="CA Mensuel" value="68 000 €" icon={<Euro className="h-5 w-5" />} trend={{ value: 12, positive: true }} />
        <KpiCard title="Marge réalisée" value="19 500 €" icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 5, positive: true }} variant="success" />
        <KpiCard title="Leads entrants" value={18} icon={<Users className="h-5 w-5" />} subtitle="Ce mois" trend={{ value: 3, positive: false }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Dépôt-vente" value={6} icon={<ArrowUpDown className="h-5 w-5" />} subtitle="Mandats actifs" />
        <KpiCard title="Marge prévisionnelle" value="32 400 €" icon={<TrendingUp className="h-5 w-5" />} subtitle="Stock total" />
        <KpiCard title="Rotation moyenne" value="34j" icon={<Clock className="h-5 w-5" />} subtitle="Temps en stock" />
        <KpiCard title="Stock > 60 jours" value={3} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Action requise" variant="destructive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Évolution CA mensuel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={caData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 90%)" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} €`} />
              <Bar dataKey="ca" fill="hsl(199, 89%, 48%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Évolution marge</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={margeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 90%)" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} €`} />
              <Line type="monotone" dataKey="marge" stroke="hsl(152, 60%, 45%)" strokeWidth={2.5} dot={{ fill: "hsl(152, 60%, 45%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Performance plateformes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={platformData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                {platformData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {platformData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Activité récente</h3>
          <div className="space-y-3">
            {[
              { text: "Peugeot 3008 GT vendu — 24 800 €", time: "Il y a 2h", type: "success" },
              { text: "Nouveau lead : Martin D. — Budget 15 000 €", time: "Il y a 3h", type: "info" },
              { text: "Mandat dépôt-vente expiré — Renault Captur", time: "Il y a 5h", type: "warning" },
              { text: "BMW Série 3 publiée sur Leboncoin", time: "Il y a 6h", type: "info" },
              { text: "RDV fixé : Sophie L. — Demain 14h", time: "Il y a 8h", type: "default" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${
                    item.type === "success" ? "bg-success" : item.type === "warning" ? "bg-warning" : item.type === "info" ? "bg-info" : "bg-muted-foreground"
                  }`} />
                  <span className="text-sm text-card-foreground">{item.text}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agenda du jour */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TodayAgendaWidget />
      </div>
    </AppLayout>
  );
}
