// ═══════════════════════════════════════════════════════
// Service Plaque → VIN → Infos véhicule complètes
// Utilise le connecteur configuré dans Paramètres
// ═══════════════════════════════════════════════════════

import { ConnecteurConfig, getConnecteurCredentials } from "@/types/connecteurs";

export interface PlaqueDecodedData {
  vin: string;
  immatriculation: string;
  marque: string;
  modele: string;
  version: string;
  annee: number | null;
  dateMiseCirculation: string;
  energie: string;
  couleur: string;
  puissanceFiscale: number | null;
  puissanceKW: number | null;
  puissanceCh: number | null;
  co2: number | null;
  cylindree: string;
  nombreCylindres: number | null;
  nombrePlaces: number | null;
  nombrePortes: number | null;
  boiteVitesse: string;
  poids: string;
  typeVehicule: string;
  carrosserie: string;
  typeMine: string;
  codeMoteur: string;
  sraId: string;
  kType: string;
  success: boolean;
  erreur: string;
}

const API_URL = "https://api.apiplaqueimmatriculation.com/plaque";
const DEMO_TOKEN = "TokenDemo2026B";

/**
 * Recherche par plaque. Le token est récupéré depuis les connecteurs configurés.
 * Si aucun token n'est configuré, utilise le token démo.
 */
export async function rechercherParPlaque(
  plaque: string,
  connecteurs?: ConnecteurConfig[],
  pays: string = "FR"
): Promise<PlaqueDecodedData> {
  const cleanPlaque = plaque.trim().toUpperCase().replace(/[\s-]/g, "");
  if (cleanPlaque.length < 5) throw new Error("Plaque trop courte.");

  // Chercher le token dans les connecteurs configurés
  let apiToken = DEMO_TOKEN;
  if (connecteurs) {
    const creds = getConnecteurCredentials(connecteurs, "api-plaque-immatriculation");
    if (creds?.apiToken) apiToken = creds.apiToken;
  }

  const url = `${API_URL}?immatriculation=${encodeURIComponent(cleanPlaque)}&token=${apiToken}&pays=${pays}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

  const json = await response.json();
  const d = json.data;
  if (!d) throw new Error("Aucune donnée retournée.");
  if (d.erreur && d.erreur.length > 0) throw new Error(d.erreur);

  let puissanceKW: number | null = parseInt(d.puisFiscReelKW) || null;
  let puissanceCh: number | null = parseInt(d.puisFiscReelCH) || null;
  if (puissanceKW && !puissanceCh) puissanceCh = Math.round(puissanceKW * 1.36);

  let energie = d.energieNGC || "";
  if (energie === "GAZOLE" || energie === "GASOIL") energie = "Diesel";
  else if (energie === "ESSENCE") energie = "Essence";
  else if (energie.includes("ELECTRI")) energie = "Électrique";
  else if (energie.includes("HYBRID")) energie = "Hybride";
  else if (energie === "GPL") energie = "GPL";

  let boiteVitesse = d.boite_vitesse || "";
  if (boiteVitesse === "M" || boiteVitesse === "MAN") boiteVitesse = "Manuelle";
  else if (boiteVitesse === "A" || boiteVitesse === "AUTO") boiteVitesse = "Automatique";

  let annee: number | null = null;
  const dateCir = d.date1erCir_us || d.date1erCir_fr || "";
  if (dateCir) { const m = dateCir.match(/(\d{4})/); if (m) annee = parseInt(m[1]); }

  return {
    vin: d.vin || "", immatriculation: d.immat || cleanPlaque,
    marque: d.marque || "", modele: d.modele || "", version: d.sra_commercial || "",
    annee, dateMiseCirculation: d.date1erCir_fr || "", energie, couleur: d.couleur || "",
    puissanceFiscale: parseInt(d.puisFisc) || null, puissanceKW, puissanceCh,
    co2: parseInt(d.co2) || null, cylindree: d.ccm || "",
    nombreCylindres: parseInt(d.cylindres) || null,
    nombrePlaces: parseInt(d.nr_passagers) || null,
    nombrePortes: parseInt(d.nb_portes) || null,
    boiteVitesse, poids: d.poids || d.ptac || "",
    typeVehicule: d.genreVCGNGC || "", carrosserie: d.carrosserieCG || "",
    typeMine: d.type_mine || d.cnit || "",
    codeMoteur: d.code_moteur || "", sraId: d.sra_id || "",
    kType: d.k_type || d.tecdoc_carid || "",
    success: true, erreur: "",
  };
}

export function formatPlaque(input: string): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 7) return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 7)}`;
  return input.toUpperCase();
}

export function isValidPlaque(plaque: string): boolean {
  const clean = plaque.toUpperCase().replace(/[\s-]/g, "");
  return /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(clean) || /^\d{1,4}[A-Z]{1,3}\d{2,3}$/.test(clean);
}
