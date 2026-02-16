import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Globe, CheckCircle, XCircle, RefreshCw, Send } from "lucide-react";
import { useState } from "react";

const platforms = [
  { id: "leboncoin", name: "Leboncoin", connected: true, annonces: 18, vues: 2340, contacts: 45, color: "bg-info" },
  { id: "autoscout", name: "AutoScout24", connected: true, annonces: 15, vues: 1820, contacts: 32, color: "bg-success" },
  { id: "lacentrale", name: "LaCentrale", connected: false, annonces: 0, vues: 0, contacts: 0, color: "bg-warning" },
];

const vehiclesForDiffusion = [
  { id: 1, immat: "FG-123-AB", label: "Peugeot 3008 GT", prix: 24800, status: "en_ligne", published: ["leboncoin", "autoscout"] },
  { id: 2, immat: "EH-456-CD", label: "BMW Série 3 320d", prix: 27500, status: "en_ligne", published: ["leboncoin", "autoscout"] },
  { id: 3, immat: "DJ-789-EF", label: "Renault Captur", prix: 18900, status: "depose", published: [] },
  { id: 4, immat: "CK-012-GH", label: "Mercedes Classe A 200", prix: 29900, status: "reserve", published: ["leboncoin"] },
  { id: 5, immat: "BL-345-IJ", label: "Volkswagen Golf 8", prix: 24500, status: "preparation", published: [] },
  { id: 6, immat: "AM-678-KL", label: "Audi A3 Sportback", prix: 20500, status: "en_ligne", published: ["leboncoin", "autoscout"] },
];

export default function Diffusion() {
  const [vehicles, setVehicles] = useState(vehiclesForDiffusion);

  const togglePlatform = (vehicleId: number, platformId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const has = v.published.includes(platformId);
        return { ...v, published: has ? v.published.filter((p) => p !== platformId) : [...v.published, platformId] };
      })
    );
  };

  const connectedPlatforms = platforms.filter((p) => p.connected);

  return (
    <AppLayout title="Multi-diffusion">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Gérez vos plateformes et sélectionnez où publier chaque véhicule</p>
        <Button size="sm"><RefreshCw className="h-4 w-4 mr-1.5" /> Synchroniser tout</Button>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {platforms.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${p.color} flex items-center justify-center`}>
                  <Globe className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-card-foreground">{p.name}</h3>
              </div>
              {p.connected ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {p.connected ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.annonces}</p>
                  <p className="text-[10px] text-muted-foreground">Annonces</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.vues.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Vues</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded-lg">
                  <p className="text-lg font-bold text-card-foreground">{p.contacts}</p>
                  <p className="text-[10px] text-muted-foreground">Contacts</p>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" size="sm">Connecter</Button>
            )}
          </div>
        ))}
      </div>

      {/* Vehicle diffusion table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Sélection des plateformes par véhicule</h3>
          <Button size="sm">
            <Send className="h-4 w-4 mr-1.5" /> Publier la sélection
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Immat.</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Véhicule</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Prix</th>
              {connectedPlatforms.map((p) => (
                <th key={p.id} className="text-center px-4 py-3 font-medium text-muted-foreground">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-card-foreground">{v.immat}</td>
                <td className="px-4 py-3 font-medium text-card-foreground">{v.label}</td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{v.prix.toLocaleString()} €</td>
                {connectedPlatforms.map((p) => {
                  const isPublished = v.published.includes(p.id);
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePlatform(v.id, p.id)}
                        className={`h-6 w-6 rounded-md border-2 inline-flex items-center justify-center transition-colors ${
                          isPublished
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-card hover:border-primary/50"
                        }`}
                      >
                        {isPublished && <CheckCircle className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
