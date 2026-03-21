import type { PlaqueDecodedData } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";

const DEMO_TOKEN = "TokenDemoAutoFlowPro";

async function getApiToken(): Promise<{ token: string; isDemo: boolean }> {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "connector_api_plaque_token")
      .single();
    if (data?.value) return { token: data.value, isDemo: false };
  } catch {}
  return { token: DEMO_TOKEN, isDemo: true };
}

export async function decodePlaque(plaque: string): Promise<{ data: PlaqueDecodedData | null; isDemo: boolean; error?: string }> {
  const cleaned = plaque.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned) && !/^\d{1,4}[A-Z]{1,3}\d{2,3}$/.test(cleaned)) {
    return { data: null, isDemo: true, error: "Format de plaque invalide" };
  }

  const { token, isDemo } = await getApiToken();

  try {
    const resp = await fetch(`https://api.apiplaqueimmatriculation.com/get-vehicule-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ immatriculation: cleaned, token }),
    });

    if (!resp.ok) {
      // Demo fallback with fake data
      if (isDemo) {
        return {
          data: getDemoData(cleaned),
          isDemo: true,
        };
      }
      return { data: null, isDemo, error: `Erreur API: ${resp.status}` };
    }

    const json = await resp.json();
    if (json.error) {
      if (isDemo) return { data: getDemoData(cleaned), isDemo: true };
      return { data: null, isDemo, error: json.error };
    }

    return {
      data: {
        vin: json.vin || json.VIN,
        brand: json.marque,
        model: json.modele,
        version: json.version,
        year: json.annee ? parseInt(json.annee) : undefined,
        fuelType: json.energie,
        color: json.couleur,
        powerCV: json.puissance_fiscale ? parseInt(json.puissance_fiscale) : undefined,
        powerDIN: json.puissance_ch ? parseInt(json.puissance_ch) : undefined,
        co2: json.co2 ? parseInt(json.co2) : undefined,
        cylindree: json.cylindree ? parseInt(json.cylindree) : undefined,
        places: json.nb_places ? parseInt(json.nb_places) : undefined,
        doors: json.nb_portes ? parseInt(json.nb_portes) : undefined,
        gearbox: json.boite_vitesse,
        weight: json.poids ? parseInt(json.poids) : undefined,
        bodyType: json.carrosserie,
        typeMine: json.type_mine,
        codeMoteur: json.code_moteur,
        codeSRA: json.sra,
        kTypeTecDoc: json.ktypnr,
      },
      isDemo: false,
    };
  } catch (err) {
    if (isDemo) return { data: getDemoData(cleaned), isDemo: true };
    return { data: null, isDemo, error: "Erreur réseau" };
  }
}

function getDemoData(plaque: string): PlaqueDecodedData {
  return {
    vin: "VF3LCBHZ6JS000000",
    brand: "PEUGEOT",
    model: "3008",
    version: "1.5 BlueHDi 130 S&S GT",
    year: 2022,
    fuelType: "Diesel",
    color: "Gris",
    powerCV: 7,
    powerDIN: 130,
    co2: 128,
    cylindree: 1499,
    places: 5,
    doors: 5,
    gearbox: "Automatique",
    weight: 1450,
    bodyType: "SUV",
    typeMine: "M10PGTVP000U000",
    codeMoteur: "DV5RCE",
    codeSRA: "PE30800A012",
    kTypeTecDoc: "48721",
  };
}
