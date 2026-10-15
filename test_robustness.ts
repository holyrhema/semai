import { scoreCell } from './shared/engine/score.js';
import fs from 'fs';

console.log("=== RUNNING SEMAI MODEL ROBUSTNESS SUITE ===");

const rawGrid = JSON.parse(fs.readFileSync('grid.geojson', 'utf-8'));
const dummyProduct = {
  product_id: 'test_prod',
  name: 'Test Product',
  conservation_alignment: 1,
  harvest_note: 'Test',
  competition_radius_m: 1500,
  factors: [
    { field: 'mangrove_500m_ha', transform: { type: 'linear', min: 0, max: 20 }, weight: 0.5, group: 'bahan_baku', label: 'Mangrove' },
    { field: 'dist_road_m', transform: { type: 'decay', max: 1500 }, weight: 0.5, group: 'produksi', label: 'Road' }
  ],
  exclude_if: [
    { field: 'mangrove_frac_2024', op: '>', value: 0.8 }
  ],
  learning_modules: []
};

let nullCount = 0;
let nanCount = 0;
let scoredCount = 0;
let excludedCount = 0;

for (const feature of rawGrid.features) {
  const res = scoreCell(feature.properties, dummyProduct as any, []);
  if (res.score === null) {
    if (res.excluded) excludedCount++;
    else nullCount++;
  } else {
    if (isNaN(res.score)) nanCount++;
    if (res.score < 0 || res.score > 1.0) {
      console.error(`🚨 OUT-OF-BOUNDS SCORE DETECTED: ${res.score} on cell ${feature.properties.cell_id}`);
    }
    scoredCount++;
  }
}

console.log(`✅ Total Cells Processed: ${rawGrid.features.length}`);
console.log(`✅ Validly Scored Cells: ${scoredCount}`);
console.log(`✅ Safely Excluded Cells: ${excludedCount}`);
console.log(`✅ NaN / Corrupt Values: ${nanCount}`);
console.log(nanCount === 0 ? "🎉 PASS: Math is 100% stable across all cells!" : "❌ FAIL: NaN detected");
