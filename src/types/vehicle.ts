export interface PhotoVehicule {
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface FraisVehicule {
  miseEnRoute: number;
  carteGrise: number;
  assurance: number;
  autres: number;
}

export interface GarantieOption {
  id: string;
  name: string;
  provider: string;
  category: string;
  vehicleType: string;
  durations: GarantieDuration[];
  pdfUrl?: string;
  active: boolean;
}

export interface GarantieDuration {
  months: number;
  costHT: number;
  priceHT: number;
  margin?: number;
}

export interface VehicleAnnonce {
  id?: string;
  vin?: string;
  registration: string;
  brand: string;
  model: string;
  version?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  color?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  photos: PhotoVehicule[];
  description?: string;
  equipments?: string[];
  frais?: FraisVehicule;
  garantie?: {
    optionId: string;
    durationMonths: number;
    mode: "inclus" | "ajout";
  };
  policeNumber?: number;
  status?: string;
  powerDIN?: number;
  cvFiscaux?: number;
  platform?: string;
}

export interface ParametresAgence {
  assujetti_tva: boolean;
  mention_legale_tva: string;
}

export interface PlaqueDecodedData {
  vin?: string;
  brand?: string;
  model?: string;
  version?: string;
  year?: number;
  fuelType?: string;
  color?: string;
  powerCV?: number;
  powerDIN?: number;
  co2?: number;
  cylindree?: number;
  places?: number;
  doors?: number;
  gearbox?: string;
  weight?: number;
  bodyType?: string;
  typeMine?: string;
  codeMoteur?: string;
  codeSRA?: string;
  kTypeTecDoc?: string;
}

// AMS default guarantees
export const AMS_GARANTIES: GarantieOption[] = [
  { id: "ams-essentielle-3", name: "Essentielle", provider: "AMS", category: "Mécanique", vehicleType: "VP", durations: [{ months: 3, costHT: 89, priceHT: 150, margin: 61 }, { months: 6, costHT: 149, priceHT: 250, margin: 101 }, { months: 12, costHT: 249, priceHT: 400, margin: 151 }], active: true },
  { id: "ams-confort-3", name: "Confort", provider: "AMS", category: "Mécanique", vehicleType: "VP", durations: [{ months: 3, costHT: 139, priceHT: 250, margin: 111 }, { months: 6, costHT: 219, priceHT: 380, margin: 161 }, { months: 12, costHT: 369, priceHT: 590, margin: 221 }], active: true },
  { id: "ams-premium-3", name: "Premium", provider: "AMS", category: "Mécanique", vehicleType: "VP", durations: [{ months: 3, costHT: 199, priceHT: 350, margin: 151 }, { months: 6, costHT: 319, priceHT: 530, margin: 211 }, { months: 12, costHT: 499, priceHT: 800, margin: 301 }], active: true },
  { id: "ams-integrale-3", name: "Intégrale", provider: "AMS", category: "Mécanique étendue", vehicleType: "VP", durations: [{ months: 3, costHT: 259, priceHT: 450, margin: 191 }, { months: 6, costHT: 419, priceHT: 680, margin: 261 }, { months: 12, costHT: 649, priceHT: 1050, margin: 401 }], active: true },
  { id: "ams-luxe-3", name: "Luxe", provider: "AMS", category: "Tous organes", vehicleType: "VP Premium", durations: [{ months: 3, costHT: 349, priceHT: 590, margin: 241 }, { months: 6, costHT: 549, priceHT: 890, margin: 341 }, { months: 12, costHT: 849, priceHT: 1350, margin: 501 }], active: true },
  { id: "ams-utilitaire-3", name: "Utilitaire", provider: "AMS", category: "Mécanique", vehicleType: "VUL", durations: [{ months: 3, costHT: 159, priceHT: 280, margin: 121 }, { months: 6, costHT: 259, priceHT: 430, margin: 171 }, { months: 12, costHT: 429, priceHT: 690, margin: 261 }], active: true },
  { id: "ams-camping-car-3", name: "Camping-Car", provider: "AMS", category: "Mécanique", vehicleType: "Camping-Car", durations: [{ months: 6, costHT: 349, priceHT: 590, margin: 241 }, { months: 12, costHT: 599, priceHT: 950, margin: 351 }], active: true },
  { id: "ams-2roues-3", name: "2 Roues", provider: "AMS", category: "Mécanique", vehicleType: "Moto/Scooter", durations: [{ months: 3, costHT: 79, priceHT: 140, margin: 61 }, { months: 6, costHT: 129, priceHT: 220, margin: 91 }], active: true },
  { id: "ams-electrique-3", name: "Électrique/Hybride", provider: "AMS", category: "Mécanique + Batterie", vehicleType: "VE/VH", durations: [{ months: 6, costHT: 399, priceHT: 650, margin: 251 }, { months: 12, costHT: 699, priceHT: 1100, margin: 401 }], active: true },
];

export function calculerCVFiscaux(co2: number, powerKW: number): number {
  const pa = powerKW * 1.34102;
  return Math.round((co2 / 45) + (pa / 40) ** 1.6);
}

export function calculerMarge(prixVente: number, prixAchat: number, frais?: FraisVehicule): number {
  const totalFrais = frais ? frais.miseEnRoute + frais.carteGrise + frais.assurance + frais.autres : 0;
  return prixVente - prixAchat - totalFrais;
}

export function calculerTotalFacture(prixVente: number, frais?: FraisVehicule, garantiePrix?: number): number {
  const totalFrais = frais ? frais.miseEnRoute + frais.carteGrise + frais.assurance + frais.autres : 0;
  return prixVente + totalFrais + (garantiePrix || 0);
}
