import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarCheck, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  garage: { label: "Garage", color: "bg-red-500" },
  carrosserie: { label: "Carrosserie", color: "bg-orange-500" },
  preparateur: { label: "Préparateur", color: "bg-violet-500" },
  attente_reception: { label: "Réception", color: "bg-amber-500" },
  attente_livraison: { label: "Livraison", color: "bg-sky-500" },
  vendu_livraison: { label: "Livraison vendu", color: "bg-emerald-500" },
};

export default function TodayAgendaWidget() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: events = [] } = useQuery({
    queryKey: ["today_events", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_events")
        .select("*, vehicles(brand, model, registration)")
        .eq("event_date", today)
        .order("event_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const cfg = (type: string) => EVENT_TYPES[type] || { label: type, color: "bg-muted" };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Agenda du jour
        </h3>
        <Link to="/agenda" className="text-xs text-primary hover:underline">
          Voir tout
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mb-3 capitalize">
        {format(new Date(), "EEEE d MMMM", { locale: fr })}
      </p>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Aucun événement prévu aujourd'hui</p>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto">
          {events.map((ev: any) => {
            const c = cfg(ev.event_type);
            return (
              <div key={ev.id} className="flex items-start gap-2.5 py-2 border-b border-border last:border-0">
                <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${c.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {ev.event_time && (
                      <span className="text-xs font-semibold text-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {ev.event_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {ev.vehicles ? `${ev.vehicles.brand} ${ev.vehicles.model}` : "—"}
                    {ev.client_name && <span className="text-muted-foreground font-normal"> — {ev.client_name}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
