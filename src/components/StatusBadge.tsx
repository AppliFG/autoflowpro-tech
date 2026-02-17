import { Badge } from "@/components/ui/badge";

export type VehicleStatus = "attente_reception" | "preparation" | "en_ligne" | "reserve" | "vendu" | "depose";

const statusConfig: Record<VehicleStatus, { label: string; className: string }> = {
  attente_reception: { label: "Attente réception", className: "bg-accent/15 text-accent-foreground border-accent/30" },
  preparation: { label: "Préparation", className: "bg-warning/15 text-warning border-warning/30" },
  en_ligne: { label: "En ligne", className: "bg-success/15 text-success border-success/30" },
  reserve: { label: "Réservé", className: "bg-info/15 text-info border-info/30" },
  vendu: { label: "Vendu", className: "bg-muted text-muted-foreground border-border" },
  depose: { label: "Déposé", className: "bg-primary/10 text-primary border-primary/30" },
};

export default function StatusBadge({ status }: { status: VehicleStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}
