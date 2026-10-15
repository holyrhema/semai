export interface Transform {
  type: 'linear' | 'decay' | 'invert';
  min?: number;
  max?: number;
}

export interface Factor {
  field: string;
  transform: Transform;
  weight: number;
  group: 'bahan_baku' | 'produksi' | 'pasar' | 'risiko';
  label: string;
}

export interface ExcludeRule {
  field: string;
  op: '>' | '<' | '==' | '>=';
  value: number;
}

export interface ProductConfig {
  product_id: string;
  name: string;
  conservation_alignment: number;
  harvest_note: string;
  competition_radius_m: number;
  factors: Factor[];
  exclude_if: ExcludeRule[];
  learning_modules: string[];
}

export interface FactorBreakdown {
  label: string;
  group: string;
  raw_value: number;
  transformed_value: number;
  weight: number;
  contribution: number;
}

export interface CellScoreResult {
  score: number | null;
  excluded: boolean;
  exclude_reason?: string;
  factors: FactorBreakdown[];
  competition_count: number;
  penalty: number;
}

// 1. Math Transforms
export function applyTransform(val: number | null | undefined, transform: Transform): number {
  if (val === null || val === undefined) return 0.0;

  if (transform.type === 'linear') {
    const min = transform.min ?? 0;
    const max = transform.max ?? 1;
    if (max === min) return 0.0;
    return Math.max(0.0, Math.min(1.0, (val - min) / (max - min)));
  }

  if (transform.type === 'decay') {
    const max = transform.max ?? 1000;
    return Math.max(0.0, Math.min(1.0, 1.0 - val / max));
  }

  if (transform.type === 'invert') {
    return Math.max(0.0, Math.min(1.0, 1.0 - val));
  }

  return 0.0;
}

// 2. Score a single 100m grid cell against a product
export function scoreCell(cell: any, product: ProductConfig, umkms: any[] = []): CellScoreResult {
  // Check Exclusions
  for (const rule of product.exclude_if || []) {
    const rawVal = cell[rule.field] ?? 0;
    if (rule.op === '>' && rawVal > rule.value) {
      return { score: null, excluded: true, exclude_reason: `${rule.field} > ${rule.value}`, factors: [], competition_count: 0, penalty: 0 };
    }
    if (rule.op === '<' && rawVal < rule.value) {
      return { score: null, excluded: true, exclude_reason: `${rule.field} < ${rule.value}`, factors: [], competition_count: 0, penalty: 0 };
    }
  }

  // Calculate Weighted Factors
  let rawScore = 0.0;
  const breakdown: FactorBreakdown[] = [];

  for (const factor of product.factors) {
    const rawVal = cell[factor.field] ?? 0;
    const tVal = applyTransform(rawVal, factor.transform);
    const contribution = tVal * factor.weight;
    rawScore += contribution;

    breakdown.push({
      label: factor.label,
      group: factor.group,
      raw_value: rawVal,
      transformed_value: tVal,
      weight: factor.weight,
      contribution: Math.round(contribution * 1000) / 1000
    });
  }

  // Competition Penalty: count existing UMKM of same product within radius
  // (Approximate coordinate distance: 1 deg ~ 111,000m)
  const cellLat = cell.lat || -8.8475;
  const cellLng = cell.lng || 116.4883;
  const radiusM = product.competition_radius_m || 2000;

  const sameUmkm = umkms.filter((u) => {
    if (u.product_id !== product.product_id) return false;
    const dLat = (u.lat - cellLat) * 111000;
    const dLng = (u.lng - cellLng) * 111000 * Math.cos((cellLat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist <= radiusM;
  });

  const penaltyMultiplier = 1.0 - Math.min(0.5, 0.1 * sameUmkm.length);
  const finalScore = Math.max(0.0, Math.min(1.0, rawScore * penaltyMultiplier));

  return {
    score: Math.round(finalScore * 100) / 100,
    excluded: false,
    factors: breakdown,
    competition_count: sameUmkm.length,
    penalty: Math.round((1 - penaltyMultiplier) * 100) / 100
  };
}

// 3. Score all cells across active products
export function scoreAllCells(gridFeatures: any[], products: ProductConfig[], umkms: any[] = []) {
  const cellScores: Record<string, Record<string, number | null>> = {};

  gridFeatures.forEach((feat) => {
    const p = feat.properties;
    const cellId = p.cell_id;
    cellScores[cellId] = {};

    products.forEach((prod) => {
      const res = scoreCell(p, prod, umkms);
      cellScores[cellId][prod.product_id] = res.score;
    });
  });

  return cellScores;
}
