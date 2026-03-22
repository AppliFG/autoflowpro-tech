// ═══════════════════════════════════════════════════════
// Connecteurs Fournisseurs — Système modulaire SaaS
// Chaque société configure ses propres accès dans Paramètres
// ═══════════════════════════════════════════════════════

export type ConnecteurAuthType = "api_token" | "login_password" | "oauth" | "api_key_secret";

export interface ConnecteurConfig {
  id: string;
  nom: string;
  description: string;
  categorie: ConnecteurCategorie;
  logo: string; // URL ou emoji/icône
  couleur: string;
  siteUrl: string; // URL du site officiel
  authType: ConnecteurAuthType;
  // Champs d'auth (remplis par l'utilisateur dans Paramètres)
  credentials: ConnecteurCredentials;
  // État
  actif: boolean;
  connecte: boolean; // true si les credentials sont renseignés
  // Abonnement requis
  abonnementRequis: boolean;
  abonnementLabel: string; // Ex: "Inclus", "Premium", "Accès fournisseur requis"
  // Docs
  docsUrl: string;
  // Fonctionnalités fournies par ce connecteur
  fonctionnalites: string[];
}

export interface ConnecteurCredentials {
  login?: string;
  password?: string;
  apiToken?: string;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  accountId?: string;
  customFields?: Record<string, string>;
}

export type ConnecteurCategorie =
  | "identification_vehicule"
  | "pieces_detachees"
  | "lubrifiants_produits"
  | "diffusion_annonces"
  | "garanties"
  | "gestion_atelier"
  | "facturation"
  | "autre";

export const CATEGORIE_LABELS: Record<ConnecteurCategorie, string> = {
  identification_vehicule: "Identification véhicule",
  pieces_detachees: "Pièces détachées",
  lubrifiants_produits: "Lubrifiants & Produits",
  diffusion_annonces: "Diffusion annonces",
  garanties: "Garanties",
  gestion_atelier: "Gestion atelier",
  facturation: "Facturation & Comptabilité",
  autre: "Autre",
};

export const CATEGORIE_ICONS: Record<ConnecteurCategorie, string> = {
  identification_vehicule: "🔍",
  pieces_detachees: "🔧",
  lubrifiants_produits: "🛢️",
  diffusion_annonces: "📢",
  garanties: "🛡️",
  gestion_atelier: "🏭",
  facturation: "📄",
  autre: "⚙️",
};

// ─── CONNECTEURS PRÉ-CONFIGURÉS ───
// L'utilisateur n'a qu'à renseigner ses credentials

export const CONNECTEURS_DISPONIBLES: ConnecteurConfig[] = [
  // ── IDENTIFICATION VÉHICULE ──
  {
    id: "siv-ants",
    nom: "SIV / ANTS",
    description: "Accès direct au Système d'Immatriculation des Véhicules (base officielle de l'État). Identification par plaque → VIN + toutes les données techniques.",
    categorie: "identification_vehicule",
    logo: "🇫🇷",
    couleur: "#000091",
    siteUrl: "https://ants.gouv.fr/nos-missions/les-solutions-numeriques/siv",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Accès professionnel ANTS requis",
    docsUrl: "https://ants.gouv.fr",
    fonctionnalites: ["Plaque → VIN", "Données SIV officielles", "Historique véhicule"],
  },
  {
    id: "api-plaque-immatriculation",
    nom: "API Plaque Immatriculation",
    description: "Service tiers d'identification véhicule par plaque. Alternative au SIV direct. Retourne VIN, marque, modèle, puissance, CO2, couleur et 40+ champs.",
    categorie: "identification_vehicule",
    logo: "🔑",
    couleur: "#3B82F6",
    siteUrl: "https://apiplaqueimmatriculation.com",
    authType: "api_token",
    credentials: {},
    actif: true,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "À partir de 39€/mois — Token démo disponible pour test",
    docsUrl: "https://apiplaqueimmatriculation.com/tester-lapi-plaque-immatriculation-siv/",
    fonctionnalites: ["Plaque → VIN + infos complètes", "France, Espagne, UK, Italie", "TecDoc K-Type", "Code SRA"],
  },

  // ── PIÈCES DÉTACHÉES ──
  {
    id: "dasir-tecalliance",
    nom: "DASIR / TecAlliance",
    description: "Portail B2B DASIR avec accès au catalogue TecDoc via TecAlliance. Recherche de pièces par VIN/K-Type, tarifs, disponibilité.",
    categorie: "pieces_detachees",
    logo: "🔴",
    couleur: "#E53E3E",
    siteUrl: "https://b2b.dasirweb.fr",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte client DASIR requis",
    docsUrl: "https://b2b.dasirweb.fr",
    fonctionnalites: ["Catalogue TecDoc", "Recherche par VIN/K-Type", "Commande en ligne", "Tarifs pro"],
  },
  {
    id: "tecdoc-tecalliance",
    nom: "TecDoc / TecAlliance",
    description: "Accès direct au catalogue TecAlliance TecDoc. Identification pièces, compatibilité véhicule, références croisées.",
    categorie: "pieces_detachees",
    logo: "🟦",
    couleur: "#2563EB",
    siteUrl: "https://web.tecalliance.net/dasir/fr/login",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte TecAlliance requis (via distributeur)",
    docsUrl: "https://web.tecalliance.net",
    fonctionnalites: ["Catalogue pièces", "Compatibilité véhicule", "Références croisées OE/aftermarket"],
  },
  {
    id: "partslink24",
    nom: "Partslink24",
    description: "Plateforme de pièces d'origine constructeur (OEM). Accès aux catalogues officiels des marques.",
    categorie: "pieces_detachees",
    logo: "🟠",
    couleur: "#F97316",
    siteUrl: "https://partslink24.com/partslink24/user/login.do",
    authType: "login_password",
    credentials: { customFields: { accountId: "" } },
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Abonnement Partslink24 requis",
    docsUrl: "https://partslink24.com",
    fonctionnalites: ["Pièces OEM constructeur", "Catalogues officiels", "Schémas éclatés"],
  },
  {
    id: "pavi",
    nom: "PAVI Pièces Auto",
    description: "Plateforme de pièces automobiles de marque d'origine. Matériel, outillage, peinture et carrosserie.",
    categorie: "pieces_detachees",
    logo: "🔵",
    couleur: "#1D4ED8",
    siteUrl: "https://pieces-auto.plateformepavi.com",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte client PAVI requis",
    docsUrl: "https://pieces-auto.plateformepavi.com",
    fonctionnalites: ["Pièces de marque", "Outillage", "Peinture & carrosserie"],
  },

  // ── LUBRIFIANTS ──
  {
    id: "yacco",
    nom: "Yacco",
    description: "Espace client Yacco — Préconisation huiles et lubrifiants, commandes, documentation technique.",
    categorie: "lubrifiants_produits",
    logo: "🟢",
    couleur: "#166534",
    siteUrl: "https://yacco.com/fr/connexion",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte client Yacco requis",
    docsUrl: "https://yacco.com",
    fonctionnalites: ["Préconisation lubrifiants", "Commande en ligne", "Documentation technique"],
  },

  // ── GESTION ATELIER ──
  {
    id: "vroomly",
    nom: "Vroomly",
    description: "Réseau de garagistes certifiés. Gestion des rendez-vous, devis en ligne, visibilité web.",
    categorie: "gestion_atelier",
    logo: "🔴",
    couleur: "#EF4444",
    siteUrl: "https://vroomly.com/professional/login/",
    authType: "login_password",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Certification Vroomly requise",
    docsUrl: "https://vroomly.com",
    fonctionnalites: ["Gestion rendez-vous", "Devis en ligne", "Avis clients", "Visibilité web"],
  },

  // ── DIFFUSION ANNONCES ──
  {
    id: "leboncoin-api",
    nom: "Leboncoin",
    description: "Diffusion d'annonces véhicules sur Leboncoin. Publication automatique depuis votre stock.",
    categorie: "diffusion_annonces",
    logo: "🟠",
    couleur: "#F97316",
    siteUrl: "https://www.leboncoin.fr",
    authType: "api_token",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "API Leboncoin Pro requise",
    docsUrl: "https://www.leboncoin.fr",
    fonctionnalites: ["Publication annonces", "Mise à jour automatique", "Gestion des contacts"],
  },
  {
    id: "autoscout24-api",
    nom: "AutoScout24",
    description: "Diffusion d'annonces sur AutoScout24 Europe.",
    categorie: "diffusion_annonces",
    logo: "🟡",
    couleur: "#F59E0B",
    siteUrl: "https://www.autoscout24.fr",
    authType: "api_token",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte pro AutoScout24 requis",
    docsUrl: "https://www.autoscout24.fr",
    fonctionnalites: ["Publication annonces", "Diffusion européenne"],
  },
  {
    id: "lacentrale-api",
    nom: "LaCentrale",
    description: "Diffusion d'annonces sur LaCentrale.fr.",
    categorie: "diffusion_annonces",
    logo: "🔵",
    couleur: "#2563EB",
    siteUrl: "https://www.lacentrale.fr",
    authType: "api_token",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Compte pro LaCentrale requis",
    docsUrl: "https://www.lacentrale.fr",
    fonctionnalites: ["Publication annonces", "Mise à jour automatique"],
  },

  // ── GARANTIES ──
  {
    id: "ams-garanties",
    nom: "AMS Garanties",
    description: "Société de garantie panne mécanique. Gestion des contrats, conditions, PDF à joindre aux factures.",
    categorie: "garanties",
    logo: "🛡️",
    couleur: "#7C3AED",
    siteUrl: "https://www.amsassistance.com/game_ams",
    authType: "login_password",
    credentials: {},
    actif: true,
    connecte: false,
    abonnementRequis: true,
    abonnementLabel: "Partenariat AMS requis",
    docsUrl: "https://ams.sng.pt/garanties/conditions-particulieres/",
    fonctionnalites: ["Garantie panne mécanique", "9 niveaux de couverture", "PDF conditions particulières"],
  },

  // ── AUTRE ──
  {
    id: "telegram-bot",
    nom: "Telegram Bot",
    description: "Bot Telegram pour envoyer des factures, consulter le stock, demander des devis pièces et recevoir des notifications — directement depuis votre téléphone.",
    categorie: "autre",
    logo: "✈️",
    couleur: "#0088CC",
    siteUrl: "https://t.me/",
    authType: "api_token",
    credentials: {},
    actif: false,
    connecte: false,
    abonnementRequis: false,
    abonnementLabel: "Gratuit — Créez votre bot via @BotFather sur Telegram",
    docsUrl: "https://core.telegram.org/bots",
    fonctionnalites: ["Envoi de factures PDF", "Demande de devis pièces", "Consultation du stock", "Notifications temps réel"],
  },
];

// ─── UTILITAIRE ───

/** Récupère le token/credentials d'un connecteur par son ID */
export function getConnecteurCredentials(
  connecteurs: ConnecteurConfig[],
  connecteurId: string
): ConnecteurCredentials | null {
  const c = connecteurs.find(x => x.id === connecteurId);
  if (!c || !c.actif || !c.connecte) return null;
  return c.credentials;
}

/** Vérifie si un connecteur est configuré et actif */
export function isConnecteurReady(
  connecteurs: ConnecteurConfig[],
  connecteurId: string
): boolean {
  const c = connecteurs.find(x => x.id === connecteurId);
  return !!c && c.actif && c.connecte;
}
