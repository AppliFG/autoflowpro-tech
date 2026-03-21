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

/** Détecte le type de plaque et normalise */
export type PlaqueType = "SIV" | "FNI" | "EU" | "unknown";

export function detectPlaqueType(raw: string): { type: PlaqueType; cleaned: string } {
  const cleaned = raw.replace(/[\s\-\.]/g, "").toUpperCase();

  // Format SIV (depuis 2009) : AA-123-BB
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned)) {
    return { type: "SIV", cleaned };
  }

  // Format FNI ancien : 1234 AB 75 ou 123 ABC 75 (1-4 chiffres, 1-3 lettres, 2-3 chiffres département)
  if (/^\d{1,4}[A-Z]{1,3}\d{2,3}$/.test(cleaned)) {
    return { type: "FNI", cleaned };
  }

  // Variantes FNI avec espaces reconstitués
  const fniMatch = cleaned.match(/^(\d{1,4})([A-Z]{1,3})(\d{2,3})$/);
  if (fniMatch) {
    return { type: "FNI", cleaned };
  }

  // Plaques EU courantes (Allemagne, Belgique, Espagne, Italie, Pays-Bas, Portugal)
  // Allemagne : 1-3 lettres ville + 1-2 lettres + 1-4 chiffres (ex: B MW 1234)
  if (/^[A-Z]{1,3}[A-Z]{1,2}\d{1,4}[EH]?$/.test(cleaned)) {
    return { type: "EU", cleaned };
  }
  // Belgique : 1-ABC-123 (depuis 2010)
  if (/^\d[A-Z]{3}\d{3}$/.test(cleaned)) {
    return { type: "EU", cleaned };
  }
  // Espagne : 1234 BCD
  if (/^\d{4}[A-Z]{3}$/.test(cleaned)) {
    return { type: "EU", cleaned };
  }
  // Italie : AA 123 BB
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned)) {
    return { type: "SIV", cleaned }; // same format as SIV, handled above
  }
  // Pays-Bas : XX-99-XX or 99-XX-XX or XX-XX-99 (several formats)
  if (/^[A-Z0-9]{2}[A-Z0-9]{2}[A-Z0-9]{2}$/.test(cleaned) && /\d/.test(cleaned) && /[A-Z]/.test(cleaned)) {
    return { type: "EU", cleaned };
  }
  // Portugal : AA-12-BB
  if (/^[A-Z]{2}\d{2}[A-Z]{2}$/.test(cleaned)) {
    return { type: "EU", cleaned };
  }

  // Format générique : au moins 4 caractères alphanumériques
  if (/^[A-Z0-9]{4,10}$/.test(cleaned)) {
    return { type: "unknown", cleaned };
  }

  return { type: "unknown", cleaned };
}

/** Formate la plaque pour affichage */
export function formatPlaque(raw: string): string {
  const { type, cleaned } = detectPlaqueType(raw);
  switch (type) {
    case "SIV":
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 7)}`;
    case "FNI": {
      const m = cleaned.match(/^(\d{1,4})([A-Z]{1,3})(\d{2,3})$/);
      return m ? `${m[1]} ${m[2]} ${m[3]}` : cleaned;
    }
    default:
      return cleaned;
  }
}

export async function decodePlaque(plaque: string): Promise<{ data: PlaqueDecodedData | null; isDemo: boolean; plaqueType: PlaqueType; error?: string }> {
  const { type, cleaned } = detectPlaqueType(plaque);

  if (type === "unknown" && cleaned.length < 4) {
    return { data: null, isDemo: true, plaqueType: type, error: "Format de plaque non reconnu. Formats acceptés : SIV (AA-123-BB), FNI (1234 AB 75), plaques EU." };
  }

  const { token, isDemo } = await getApiToken();

  try {
    const resp = await fetch(`https://api.apiplaqueimmatriculation.com/get-vehicule-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ immatriculation: cleaned, token }),
    });

    if (!resp.ok) {
      if (isDemo) {
        return {
          data: getDemoData(cleaned, type),
          isDemo: true,
          plaqueType: type,
        };
      }
      return { data: null, isDemo, plaqueType: type, error: `Erreur API: ${resp.status}` };
    }

    const json = await resp.json();
    if (json.error) {
      if (isDemo) return { data: getDemoData(cleaned, type), isDemo: true, plaqueType: type };
      return { data: null, isDemo, plaqueType: type, error: json.error };
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
      plaqueType: type,
    };
  } catch (err) {
    if (isDemo) return { data: getDemoData(cleaned, type), isDemo: true, plaqueType: type };
    return { data: null, isDemo, plaqueType: type, error: "Erreur réseau" };
  }
}

function getDemoData(plaque: string, type: PlaqueType): PlaqueDecodedData {
  if (type === "FNI") {
    return {
      vin: "VF1LM1B0H36000000",
      brand: "RENAULT",
      model: "CLIO III",
      version: "1.5 dCi 85 Dynamique",
      year: 2007,
      fuelType: "Diesel",
      color: "Bleu",
      powerCV: 5,
      powerDIN: 85,
      co2: 120,
      cylindree: 1461,
      places: 5,
      doors: 5,
      gearbox: "Manuelle",
      weight: 1150,
      bodyType: "Berline",
      typeMine: "MRE1105E5092",
      codeMoteur: "K9K766",
      codeSRA: "RE01050G107",
      kTypeTecDoc: "25870",
    };
  }

  if (type === "EU") {
    return {
      vin: "WVWZZZ3CZWE000000",
      brand: "VOLKSWAGEN",
      model: "GOLF VII",
      version: "2.0 TDI 150 R-Line",
      year: 2020,
      fuelType: "Diesel",
      color: "Noir",
      powerCV: 8,
      powerDIN: 150,
      co2: 118,
      cylindree: 1968,
      places: 5,
      doors: 5,
      gearbox: "Automatique DSG",
      weight: 1395,
      bodyType: "Berline compacte",
      typeMine: "",
      codeMoteur: "DFGA",
      codeSRA: "",
      kTypeTecDoc: "45123",
    };
  }

  // Default SIV
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
