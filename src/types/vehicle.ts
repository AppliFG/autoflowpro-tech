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
  costHT: number;
  active: boolean;
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
    name: string;
    costHT: number;
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
