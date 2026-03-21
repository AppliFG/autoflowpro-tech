export interface ConnecteurConfig {
  id: string;
  name: string;
  description: string;
  category: "identification" | "pieces" | "lubrifiants" | "diffusion" | "garanties" | "atelier";
  authType: "token" | "login_password";
  color: string;
  siteUrl: string;
  docsUrl: string;
  features: string[];
  requiresSubscription: boolean;
  icon?: string;
}

export interface ConnecteurCredentials {
  id?: string;
  connecteur_id: string;
  enabled: boolean;
  token?: string;
  login?: string;
  password?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  identification: "Identification véhicule",
  pieces: "Pièces détachées",
  lubrifiants: "Lubrifiants",
  diffusion: "Diffusion annonces",
  garanties: "Garanties",
  atelier: "Gestion atelier",
};

export const CONNECTEURS: ConnecteurConfig[] = [
  {
    id: "api_plaque",
    name: "API Plaque Immatriculation",
    description: "Identification complète d'un véhicule à partir de sa plaque (VIN, marque, modèle, version, énergie, etc.)",
    category: "identification",
    authType: "token",
    color: "bg-blue-600",
    siteUrl: "https://www.apiplaqueimmatriculation.com",
    docsUrl: "https://www.apiplaqueimmatriculation.com/documentation",
    features: ["Recherche par plaque", "Décodage VIN", "Données techniques complètes", "K-Type TecDoc"],
    requiresSubscription: true,
  },
  {
    id: "siv_ants",
    name: "SIV / ANTS",
    description: "Système d'Immatriculation des Véhicules — interrogation officielle du fichier national.",
    category: "identification",
    authType: "login_password",
    color: "bg-indigo-600",
    siteUrl: "https://immatriculation.ants.gouv.fr",
    docsUrl: "https://immatriculation.ants.gouv.fr",
    features: ["Vérification immatriculation", "Historique véhicule", "Situation administrative"],
    requiresSubscription: true,
  },
  {
    id: "tecdoc",
    name: "TecDoc",
    description: "Catalogue international de pièces détachées automobiles (TecAlliance).",
    category: "pieces",
    authType: "token",
    color: "bg-orange-600",
    siteUrl: "https://www.tecalliance.net",
    docsUrl: "https://webservice.tecalliance.net/pegasus-3-0/info",
    features: ["Catalogue pièces", "Références croisées", "Recherche par K-Type", "Illustrations techniques"],
    requiresSubscription: true,
  },
  {
    id: "dasir",
    name: "DASIR / TecAlliance",
    description: "Base de données techniques et pièces détachées du marché français.",
    category: "pieces",
    authType: "login_password",
    color: "bg-amber-600",
    siteUrl: "https://www.tecalliance.net",
    docsUrl: "https://www.tecalliance.net",
    features: ["Données techniques FR", "Pièces de rechange", "Équivalences"],
    requiresSubscription: true,
  },
  {
    id: "partslink24",
    name: "Partslink24",
    description: "Catalogue de pièces d'origine constructeur (OEM) avec schémas éclatés.",
    category: "pieces",
    authType: "login_password",
    color: "bg-teal-600",
    siteUrl: "https://www.partslink24.com",
    docsUrl: "https://www.partslink24.com",
    features: ["Pièces OEM", "Schémas éclatés", "Références constructeur"],
    requiresSubscription: true,
  },
  {
    id: "pavi",
    name: "PAVI",
    description: "Plateforme d'aide à la vente et à l'identification de pièces auto.",
    category: "pieces",
    authType: "login_password",
    color: "bg-cyan-600",
    siteUrl: "https://www.pavi.fr",
    docsUrl: "https://www.pavi.fr",
    features: ["Identification pièces", "Tarification", "Commande en ligne"],
    requiresSubscription: true,
  },
  {
    id: "yacco",
    name: "Yacco",
    description: "Préconisations lubrifiants et huiles moteur par véhicule.",
    category: "lubrifiants",
    authType: "login_password",
    color: "bg-red-600",
    siteUrl: "https://www.yacco.com",
    docsUrl: "https://www.yacco.com/preconisations",
    features: ["Préconisations huile", "Catalogue produits", "Fiches techniques"],
    requiresSubscription: false,
  },
  {
    id: "vroomly",
    name: "Vroomly",
    description: "Plateforme de gestion atelier, devis et prise de rendez-vous en ligne.",
    category: "atelier",
    authType: "login_password",
    color: "bg-green-600",
    siteUrl: "https://www.vroomly.com",
    docsUrl: "https://www.vroomly.com",
    features: ["Gestion atelier", "Devis en ligne", "Rendez-vous", "Facturation"],
    requiresSubscription: true,
  },
  {
    id: "leboncoin",
    name: "Leboncoin",
    description: "Diffusion automatique de vos annonces véhicules sur Leboncoin.",
    category: "diffusion",
    authType: "login_password",
    color: "bg-orange-500",
    siteUrl: "https://www.leboncoin.fr",
    docsUrl: "https://www.leboncoin.fr",
    features: ["Publication annonces", "Synchronisation stock", "Gestion statuts"],
    requiresSubscription: true,
  },
  {
    id: "autoscout24",
    name: "AutoScout24",
    description: "Diffusion de vos annonces sur AutoScout24, leader européen.",
    category: "diffusion",
    authType: "login_password",
    color: "bg-yellow-500",
    siteUrl: "https://www.autoscout24.fr",
    docsUrl: "https://www.autoscout24.fr",
    features: ["Publication annonces", "Audience européenne", "Statistiques vues"],
    requiresSubscription: true,
  },
  {
    id: "lacentrale",
    name: "LaCentrale",
    description: "Diffusion sur LaCentrale, référence du marché VO en France.",
    category: "diffusion",
    authType: "login_password",
    color: "bg-blue-500",
    siteUrl: "https://www.lacentrale.fr",
    docsUrl: "https://www.lacentrale.fr",
    features: ["Publication annonces", "Côte véhicule", "Visibilité nationale"],
    requiresSubscription: true,
  },
  {
    id: "ams",
    name: "AMS Garantie",
    description: "Garanties mécaniques pour véhicules d'occasion (9 formules disponibles).",
    category: "garanties",
    authType: "login_password",
    color: "bg-purple-600",
    siteUrl: "https://www.ams-garantie.com",
    docsUrl: "https://www.ams-garantie.com",
    features: ["9 formules garantie", "Tarifs par véhicule", "PDF conditions", "Attestation en ligne"],
    requiresSubscription: true,
  },
];
