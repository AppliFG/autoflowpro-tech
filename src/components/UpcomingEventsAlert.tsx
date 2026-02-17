import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  garage: { label: "Garage", color: "bg-red-500" },
  carrosserie: { label: "Carrosserie", color: "bg-orange-500" },
  preparateur: { label: "Préparateur", color: "bg-violet-500" },
  attente_reception: { label: "Réception", color: "bg-amber-500" },
  attente_livraison: { label: "Livraison", color: "bg-sky-500" },
  vendu_livraison: { label: "Livraison vendu", color: "bg-emerald-500" },
};

export default function UpcomingEventsAlert() {
  const today = format(new Date(), "yyyy-MM-dd");
  const in48h = format(addDays(new Date(), 2), "yyyy-MM-dd");

  const { data: events = [] } = useQuery({
    queryKey: ["upcoming_events_48h", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_events")
        .select("*, vehicles(brand, model, registration)")
        .gte("event_date", today)
        .lt("event_date", in48h)
        .order("event_date")
        .order("event_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  if (events.length === 0) return null;

  const todayEvents = events.filter((e: any) => isToday(new Date(e.event_date)));
  const tomorrowEvents = events.filter((e: any) => isTomorrow(new Date(e.event_date)));

  const cfg = (type: string) => EVENT_TYPES[type] || { label: type, color: "bg-muted" };

  return (
    <div className="lg:col-span-2 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-600" />
          Rappels — Événements à venir
        </h3>
        <Link to="/agenda" className="text-xs text-primary hover:underline">
          Voir l'agenda
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today */}
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Aujourd'hui — {format(new Date(), "d MMMM", { locale: fr })}
          </p>
          {todayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun événement</p>
          ) : (
            <div className="space-y-1.5">
              {todayEvents.map((ev: any) => {
                const c = cfg(ev.event_type);
                return (
                  <div key={ev.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${c.color}`} />
                    {ev.event_time && (
                      <span className="font-semibold text-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {ev.event_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="truncate text-card-foreground">
                      {ev.vehicles ? `${ev.vehicles.brand} ${ev.vehicles.model}` : c.label}
                      {ev.client_name && <span className="text-muted-foreground"> — {ev.client_name}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tomorrow */}
        <div>
          <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-2">
            Demain — {format(addDays(new Date(), 1), "d MMMM", { locale: fr })}
          </p>
          {tomorrowEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun événement</p>
          ) : (
            <div className="space-y-1.5">
              {tomorrowEvents.map((ev: any) => {
                const c = cfg(ev.event_type);
                return (
                  <div key={ev.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${c.color}`} />
                    {ev.event_time && (
                      <span className="font-semibold text-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {ev.event_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="truncate text-card-foreground">
                      {ev.vehicles ? `${ev.vehicles.brand} ${ev.vehicles.model}` : c.label}
                      {ev.client_name && <span className="text-muted-foreground"> — {ev.client_name}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
