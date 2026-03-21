import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, isToday, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const EVENT_TYPES: Record<string, { label: string; dotClass: string }> = {
  garage: { label: "Garage", dotClass: "bg-destructive" },
  carrosserie: { label: "Carrosserie", dotClass: "bg-accent" },
  preparateur: { label: "Préparateur", dotClass: "bg-violet" },
  attente_reception: { label: "Réception", dotClass: "bg-warning" },
  attente_livraison: { label: "Livraison", dotClass: "bg-primary" },
  vendu_livraison: { label: "Livraison vendu", dotClass: "bg-success" },
};

export default function WeekAgendaWidget() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  const { data: events = [] } = useQuery({
    queryKey: ["week_events", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_events")
        .select("*, vehicles(brand, model, registration)")
        .gte("event_date", format(weekStart, "yyyy-MM-dd"))
        .lt("event_date", format(weekEnd, "yyyy-MM-dd"))
        .order("event_date")
        .order("event_time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return { date: day, dateStr, events: events.filter((e: any) => e.event_date === dateStr) };
  });

  const cfg = (type: string) => EVENT_TYPES[type] || { label: type, dotClass: "bg-muted-foreground" };

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {/* Header with orange accent bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
          <div className="w-1 h-6 rounded-full bg-accent" />
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          Agenda de la semaine
        </h3>
        <Link
          to="/agenda"
          className="text-xs font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5"
        >
          Voir tout
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 divide-x divide-border/30">
        {eventsByDay.map(({ date, dateStr, events: dayEvents }) => {
          const today = isToday(date);
          const past = isBefore(date, startOfDay(now)) && !today;

          return (
            <div
              key={dateStr}
              className={`min-h-[140px] p-2.5 transition-colors ${
                today ? "bg-primary/5" : past ? "bg-muted/30 opacity-60" : "hover:bg-muted/20"
              }`}
            >
              {/* Day header */}
              <div className="text-center mb-2">
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${today ? "text-accent" : "text-muted-foreground"}`}>
                  {format(date, "EEE", { locale: fr })}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${
                  today
                    ? "text-white bg-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    : "text-card-foreground"
                }`}>
                  {format(date, "d")}
                </p>
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((ev: any) => {
                  const c = cfg(ev.event_type);
                  return (
                    <div key={ev.id} className="flex items-start gap-1 rounded-md bg-background/80 p-1.5 text-[10px] leading-tight">
                      <span className={`h-1.5 w-1.5 rounded-full mt-0.5 shrink-0 ${c.dotClass}`} />
                      <div className="min-w-0 flex-1">
                        {ev.event_time && (
                          <span className="font-semibold text-foreground flex items-center gap-0.5 mb-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {ev.event_time.slice(0, 5)}
                          </span>
                        )}
                        <p className="truncate text-muted-foreground font-medium">
                          {ev.vehicles ? `${ev.vehicles.brand} ${ev.vehicles.model}` : c.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-primary font-semibold text-center">
                    +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? "s" : ""}
                  </p>
                )}
                {dayEvents.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 text-center pt-2">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
