import { useState, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "garage", label: "Au garage", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50 border-red-200" },
  { value: "carrosserie", label: "Carrosserie", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50 border-orange-200" },
  { value: "preparateur", label: "Préparateur / Nettoyage", color: "bg-violet-500", textColor: "text-violet-700", bgLight: "bg-violet-50 border-violet-200" },
  { value: "attente_reception", label: "Attente de réception", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50 border-amber-200" },
  { value: "attente_livraison", label: "Attente de livraison", color: "bg-sky-500", textColor: "text-sky-700", bgLight: "bg-sky-50 border-sky-200" },
  { value: "vendu_livraison", label: "Vendu — livraison prévue", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50 border-emerald-200" },
];

const getEventConfig = (type: string) => EVENT_TYPES.find((e) => e.value === type) || EVENT_TYPES[0];

export default function Agenda() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({ vehicle_id: "", event_type: "garage", event_date: "", event_time: "", client_name: "", notes: "" });
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: events = [] } = useQuery({
    queryKey: ["vehicle_events", format(monthStart, "yyyy-MM")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_events")
        .select("*, vehicles(brand, model, registration)")
        .gte("event_date", format(monthStart, "yyyy-MM-dd"))
        .lte("event_date", format(monthEnd, "yyyy-MM-dd"))
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, brand, model, registration").order("brand");
      if (error) throw error;
      return data;
    },
  });

  const addEvent = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("vehicle_events").insert({
        vehicle_id: payload.vehicle_id || null,
        event_type: payload.event_type,
        event_date: payload.event_date,
        event_time: payload.event_time || null,
        client_name: payload.client_name || null,
        notes: payload.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_events"] });
      queryClient.invalidateQueries({ queryKey: ["today_events"] });
      setDialogOpen(false);
      setForm({ vehicle_id: "", event_type: "garage", event_date: "", event_time: "", client_name: "", notes: "" });
      toast.success("Événement ajouté");
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_events"] });
      queryClient.invalidateQueries({ queryKey: ["today_events"] });
      toast.success("Événement supprimé");
    },
  });

  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [currentMonth]);
  const startDay = getDay(monthStart); // 0=Sun
  const paddingDays = startDay === 0 ? 6 : startDay - 1; // Mon=0

  const openAdd = (date?: Date) => {
    const d = date || new Date();
    setForm({ ...form, event_date: format(d, "yyyy-MM-dd") });
    setSelectedDate(d);
    setDialogOpen(true);
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <AppLayout title="Agenda">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => openAdd()}>
          <Plus className="h-4 w-4 mr-1" /> Ajouter
        </Button>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-3 mb-4">
        {EVENT_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5 text-xs">
            <span className={`h-3 w-3 rounded-sm ${t.color}`} />
            <span className="text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-7">
          {dayNames.map((d) => (
            <div key={d} className="border-b border-border px-2 py-2 text-center text-xs font-semibold text-muted-foreground bg-muted/30">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] border-b border-r border-border bg-muted/10" />
          ))}
          {days.map((day) => {
            const dayEvents = events.filter((e: any) => isSameDay(new Date(e.event_date), day));
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1 cursor-pointer hover:bg-muted/20 transition-colors",
                  today && "bg-primary/5"
                )}
                onClick={() => openAdd(day)}
              >
                <div className={cn(
                  "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  today && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev: any) => {
                    const cfg = getEventConfig(ev.event_type);
                    return (
                      <div
                        key={ev.id}
                        className={cn("text-[10px] leading-tight px-1 py-0.5 rounded border truncate", cfg.bgLight, cfg.textColor)}
                        onClick={(e) => e.stopPropagation()}
                        title={`${cfg.label} — ${ev.vehicles?.brand} ${ev.vehicles?.model} ${ev.client_name ? `— ${ev.client_name}` : ""}`}
                      >
                        <div className="flex items-center justify-between gap-0.5">
                          <span className="truncate font-medium">
                            {ev.event_time ? `${ev.event_time.slice(0, 5)} ` : ""}
                            {ev.vehicles ? `${ev.vehicles.brand} ${ev.vehicles.model}` : cfg.label}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteEvent.mutate(ev.id); }}
                            className="shrink-0 opacity-50 hover:opacity-100"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} autre(s)</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add event dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.event_date) return;
              addEvent.mutate(form);
            }}
            className="space-y-4"
          >
            <div>
              <Label>Type</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-sm ${t.color}`} />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Véhicule</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} — {v.registration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.event_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.event_date ? format(new Date(form.event_date), "dd/MM/yyyy") : "Choisir"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.event_date ? new Date(form.event_date) : undefined}
                      onSelect={(d) => d && setForm({ ...form, event_date: format(d, "yyyy-MM-dd") })}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Heure (optionnel)</Label>
                <Input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Client (optionnel)</Label>
              <Input placeholder="Mr / Mme..." value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Détails..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={addEvent.isPending}>Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
