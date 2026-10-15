export interface CellProperty {
  cell_id: string;
  desa: string;
  mangrove_frac_2017: number;
  mangrove_frac_2021: number;
  mangrove_frac_2024: number;
  pond_frac_2017: number;
  pond_frac_2024: number;
  water_frac_2024: number;
  built_frac_2024: number;
  zone: 'seaward' | 'middle' | 'landward' | 'none';
  mangrove_500m_ha: number;
  mangrove_1km_ha: number;
  seaward_500m_ha: number;
  seaward_1km_ha: number;
  middle_1km_ha: number;
  pond_3km_ha: number;
  p_loss: number | null;
  p_loss_500m: number;
  p_gain: number | null;
  dist_mangrove_m: number;
  dist_coast_m: number;
  dist_road_m: number;
  footfall_idx: number;
  dist_tourism_m: number;
  dist_market_m: number;
  buildings_n: number;
  buildings_1km: number;
  elev_m: number;
}

export interface UMKM {
  umkm_id: string;
  name: string;
  pack_id: string;
  product_id: string;
  desa: string;
  lat: number;
  lng: number;
  status: 'aktif' | 'rintisan';
  members_n: number;
  monthly_revenue_idr: number;
  channels: string[];
  simulated: boolean;
}

export interface GraphNode {
  id: string;
  type: 'resource' | 'business' | 'market' | 'institution';
  name: string;
  desa: string;
  lat: number;
  lng: number;
  source: 'publik' | 'literatur' | 'simulasi';
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  sign: number;
  strength: 'kuat' | 'sedang' | 'lemah';
  evidence: 'publik' | 'literatur' | 'hipotesis';
  note: string;
}

export interface ResourcePack {
  pack_id: string;
  name: string;
  version: string;
  products: any[];
}
