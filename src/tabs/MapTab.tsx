import React, { useState, useEffect, useRef, useMemo } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Layers, Calendar, AlertTriangle, TrendingUp, Navigation, Store, X, Briefcase, Sparkles, Compass } from 'lucide-react';
import { scoreCell, ProductConfig } from '../../shared/engine/score';

interface MapTabProps {
  gridData: any;
  roadsData: any;
  gatheringData: any;
  desaData: any;
  umkmData: any[];
  packsIndex: any;
  packs: Record<string, any>;
}

function MapEngine({
  gridData,
  roadsData,
  gatheringData,
  umkmData,
  activeMode,
  selectedYear,
  showMangrove,
  showPond,
  showRisk,
  showGain,
  selectedProduct,
  selectedQuadrant,
  showRoads,
  showGathering,
  showUMKM,
  onCellClick,
  onUMKMClick,
  onHubClick
}: any) {
  const map = useMap();
  const gridLayerRef = useRef<google.maps.Data | null>(null);
  const roadsLayerRef = useRef<google.maps.Data | null>(null);
  const pointsLayerRef = useRef<google.maps.Data | null>(null);

  // 1. Grid Layer Init
  useEffect(() => {
    if (!map || !gridData) return;
    if (gridLayerRef.current) gridLayerRef.current.setMap(null);

    const layer = new google.maps.Data({ map });
    layer.addGeoJson(gridData);

    layer.addListener('click', (event: any) => {
      const p: any = {};
      event.feature.forEachProperty((val, key) => { p[key] = val; });
      onCellClick(p);
    });

    gridLayerRef.current = layer;
    return () => { layer.setMap(null); };
  }, [map, gridData]);

  // 2. Dynamic Styling (Strict Coastal Guardrails)
  useEffect(() => {
    const layer = gridLayerRef.current;
    if (!layer) return;

    layer.setStyle((feat: google.maps.Data.Feature) => {
      const p: any = {};
      feat.forEachProperty((val, key) => { p[key] = val; });

      // MODE A: BUSINESS OPPORTUNITY
      if (activeMode === 'opportunity' && selectedProduct) {
        const res = scoreCell(p, selectedProduct, umkmData);
        if (res.excluded || res.score === null || res.score < 0.25) {
          return { fillOpacity: 0, strokeWeight: 0, clickable: false };
        }
        const s = res.score;
        const color = s > 0.75 ? '#0D530E' : s > 0.55 ? '#306D29' : '#85A65A';
        return {
          fillColor: color,
          fillOpacity: Math.min(0.9, Math.max(0.4, s)),
          strokeColor: '#FBF5DD',
          strokeWeight: 0.8,
          strokeOpacity: 0.8,
          clickable: true
        };
      }

      // MODE B: STRATEGIC QUADRANTS
      if (activeMode === 'quadrant') {
        let oppScore = 0.0;
        if (selectedProduct) {
          oppScore = scoreCell(p, selectedProduct, umkmData).score || 0;
        } else {
          oppScore = Math.max(p.mangrove_frac_2024 || 0, p.pond_frac_2024 || 0);
        }

        const risk = p.p_loss_500m || p.p_loss || 0.2;
        const isHighOpp = oppScore >= 0.5;
        const isHighRisk = risk >= 0.5;

        let quadLabel = 'monitor';
        let quadColor = '#94A3B8';

        if (isHighOpp && isHighRisk) {
          quadLabel = 'accompany';
          quadColor = '#C2410C';
        } else if (isHighOpp && !isHighRisk) {
          quadLabel = 'expand';
          quadColor = '#306D29';
        } else if (!isHighOpp && isHighRisk) {
          quadLabel = 'patrol';
          quadColor = '#D97706';
        }

        if (selectedQuadrant && selectedQuadrant !== 'all' && selectedQuadrant !== quadLabel) {
          return { fillOpacity: 0, strokeWeight: 0, clickable: false };
        }

        // Only show quadrant colors where there is actual coastal activity
        if ((p.mangrove_frac_2024 || 0) < 0.1 && (p.pond_frac_2024 || 0) < 0.1) {
          return { fillOpacity: 0, strokeWeight: 0, clickable: false };
        }

        return {
          fillColor: quadColor,
          fillOpacity: 0.8,
          strokeColor: '#FBF5DD',
          strokeWeight: 0.8,
          clickable: true
        };
      }

      // MODE C: BASELINE ECOSYSTEM
      const m17 = p.mangrove_frac_2017 || 0;
      const m21 = p.mangrove_frac_2021 || 0;
      const m24 = p.mangrove_frac_2024 || 0;
      const p17 = p.pond_frac_2017 || 0;
      const p24 = p.pond_frac_2024 || 0;

      // CONVERSION PRESSURE: STRICT GUARDRAIL!
      // Must be a coastal cell with standing mangrove (dist_coast <= 200m and mangrove > 0.1)
      if (showRisk && (m24 > 0.1 || m17 > 0.1) && (p.dist_coast_m || 999) <= 200) {
        return {
          fillColor: '#DC2626',
          fillOpacity: 0.85,
          strokeColor: '#B91C1C',
          strokeWeight: 1,
          clickable: true
        };
      }

      // NATURAL GROWTH ZONE: Coastal intertidal fringe only
      if (showGain && (p.p_gain || 0) > 0.3 && (p.dist_coast_m || 999) <= 150) {
        return {
          fillColor: '#306D29',
          fillOpacity: 0.85,
          strokeColor: '#0D530E',
          strokeWeight: 1,
          clickable: true
        };
      }

      const mang = selectedYear === 2017 ? m17 : selectedYear === 2021 ? m21 : m24;
      const pond = selectedYear === 2017 ? p17 : p24;

      if (showMangrove && mang > 0.1 && (p.dist_coast_m || 999) <= 250) {
        return {
          fillColor: '#0D530E',
          fillOpacity: Math.min(0.9, mang + 0.15),
          strokeColor: '#306D29',
          strokeWeight: 0.6,
          clickable: true
        };
      }

      if (showPond && pond > 0.1 && (p.dist_coast_m || 999) <= 650) {
        return {
          fillColor: '#D97706',
          fillOpacity: Math.min(0.85, pond + 0.15),
          strokeColor: '#F59E0B',
          strokeWeight: 0.6,
          clickable: true
        };
      }

      return { fillOpacity: 0, strokeWeight: 0, clickable: false };
    });
  }, [activeMode, selectedProduct, selectedQuadrant, selectedYear, showMangrove, showPond, showRisk, showGain]);

  // 3. Roads
  useEffect(() => {
    if (!map || !roadsData) return;
    if (roadsLayerRef.current) roadsLayerRef.current.setMap(null);

    const layer = new google.maps.Data({ map: showRoads ? map : null });
    layer.addGeoJson(roadsData);
    layer.setStyle((feat: any) => ({
      strokeColor: feat.getProperty('is_main') ? '#D97706' : '#94A3B8',
      strokeWeight: feat.getProperty('is_main') ? 3 : 1.2,
      strokeOpacity: 0.85,
      clickable: false
    }));

    roadsLayerRef.current = layer;
    return () => { layer.setMap(null); };
  }, [map, roadsData, showRoads]);

  // 4. Points Layer (Both Gathering Hubs & UMKM)
  useEffect(() => {
    if (!map) return;
    if (pointsLayerRef.current) pointsLayerRef.current.setMap(null);

    const pointFeatures: any[] = [];

    // Add Village Gathering Hubs (Mosques & Markets)
    if (showGathering) {
      const hubsList = gatheringData?.features || [
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4883, -8.8475] }, properties: { name: "Bale Mangrove Visitor Center", cat: "ecotourism_center", weight: 1.5 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4678, -8.8350] }, properties: { name: "Pasar Umum Jerowaru", cat: "market", weight: 1.8 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4820, -8.8820] }, properties: { name: "Kantor & Pasar Pemongkong", cat: "community_center", weight: 1.4 } },
        { type: "Feature", geometry: { type: "Point", coordinates: [116.4950, -8.8350] }, properties: { name: "Masjid Jami Pare Mas", cat: "mosque", weight: 1.5 } }
      ];

      hubsList.forEach((f: any) => {
        pointFeatures.push({
          type: 'Feature',
          geometry: f.geometry,
          properties: { ...f.properties, _pointType: 'hub' }
        });
      });
    }

    // Add UMKM Enterprises
    if (showUMKM && umkmData) {
      umkmData.forEach((u: any) => {
        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [u.lng, u.lat] },
          properties: { ...u, _pointType: 'umkm' }
        });
      });
    }

    const layer = new google.maps.Data({ map });
    layer.addGeoJson({ type: 'FeatureCollection', features: pointFeatures });

    layer.setStyle((feat: google.maps.Data.Feature) => {
      const type = feat.getProperty('_pointType');
      if (type === 'hub') {
        return {
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#0284C7', // Bright Sky Blue
            fillOpacity: 1.0,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          },
          title: feat.getProperty('name')
        };
      }
      if (type === 'umkm') {
        return {
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: '#306D29', // Forest Green
            fillOpacity: 1.0,
            strokeColor: '#FFFFFF',
            strokeWeight: 1.5
          },
          title: feat.getProperty('name')
        };
      }
      return { visible: false };
    });

    layer.addListener('click', (event: any) => {
      const p: any = {};
      event.feature.forEachProperty((val, key) => { p[key] = val; });
      if (p._pointType === 'hub') onHubClick(p);
      if (p._pointType === 'umkm') onUMKMClick(p);
    });

    pointsLayerRef.current = layer;
    return () => { layer.setMap(null); };
  }, [map, gatheringData, umkmData, showGathering, showUMKM]);

  return null;
}

export const MapTab: React.FC<MapTabProps> = ({
  gridData,
  roadsData,
  gatheringData,
  desaData,
  umkmData,
  packsIndex,
  packs
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [activeMode, setActiveMode] = useState<'baseline' | 'opportunity' | 'quadrant'>('baseline');
  const [showMangrove, setShowMangrove] = useState(true);
  const [showPond, setShowPond] = useState(true);
  const [selectedYear, setSelectedYear] = useState<2017 | 2021 | 2024>(2024);
  const [showRisk, setShowRisk] = useState(false);
  const [showGain, setShowGain] = useState(false);

  const [selectedPackId, setSelectedPackId] = useState<string>('mangrove');
  const [selectedProductId, setSelectedProductId] = useState<string>('madu_mangrove');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');

  const [showRoads, setShowRoads] = useState(true);
  const [showGathering, setShowGathering] = useState(true);
  const [showUMKM, setShowUMKM] = useState(true);

  const [selectedCell, setSelectedCell] = useState<any | null>(null);
  const [selectedUMKM, setSelectedUMKM] = useState<any | null>(null);
  const [selectedHub, setSelectedHub] = useState<any | null>(null);

  const activeProduct: ProductConfig | null = useMemo(() => {
    const pack = packs[selectedPackId];
    if (!pack) return null;
    return pack.products.find((p: any) => p.product_id === selectedProductId) || pack.products[0];
  }, [packs, selectedPackId, selectedProductId]);

  const topSites = useMemo(() => {
    if (!activeProduct || !gridData?.features) return [];
    return gridData.features
      .map((f: any) => ({
        props: f.properties,
        scoreRes: scoreCell(f.properties, activeProduct, umkmData)
      }))
      .filter((item: any) => !item.scoreRes.excluded && item.scoreRes.score !== null)
      .sort((a: any, b: any) => (b.scoreRes.score || 0) - (a.scoreRes.score || 0))
      .slice(0, 5);
  }, [gridData, activeProduct, umkmData]);

  return (
    <div className="relative w-full h-full bg-[#FBF5DD]">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: -8.8475, lng: 116.4883 }}
          defaultZoom={13}
          mapTypeId="hybrid"
          className="w-full h-full"
          options={{ clickableIcons: false }}
        >
          <MapEngine
            gridData={gridData}
            roadsData={roadsData}
            gatheringData={gatheringData}
            umkmData={umkmData}
            activeMode={activeMode}
            selectedYear={selectedYear}
            showMangrove={showMangrove}
            showPond={showPond}
            showRisk={showRisk}
            showGain={showGain}
            selectedProduct={activeProduct}
            selectedQuadrant={selectedQuadrant}
            showRoads={showRoads}
            showGathering={showGathering}
            showUMKM={showUMKM}
            onCellClick={(props: any) => {
              setSelectedUMKM(null);
              setSelectedHub(null);
              setSelectedCell(props);
            }}
            onUMKMClick={(u: any) => {
              setSelectedCell(null);
              setSelectedHub(null);
              setSelectedUMKM(u);
            }}
            onHubClick={(h: any) => {
              setSelectedCell(null);
              setSelectedUMKM(null);
              setSelectedHub(h);
            }}
          />
        </Map>
      </APIProvider>

      {/* TOP NAVIGATION / MODE SWITCHER */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#E7E1B1] border-2 border-[#D5CC94] rounded-2xl p-1.5 shadow-2xl flex space-x-1.5">
        {[
          { id: 'baseline', label: 'Land Cover & Satellite', icon: Layers },
          { id: 'opportunity', label: 'Business Opportunity Heatmap', icon: Sparkles },
          { id: 'quadrant', label: 'Strategic Quadrants', icon: Compass },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#306D29] text-[#FBF5DD] shadow-md'
                  : 'text-[#0D530E] hover:bg-[#F2E8BF]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* LEFT CONTROL PANEL */}
      <div className="absolute top-20 left-4 z-30 w-88 bg-[#E7E1B1] border-2 border-[#D5CC94] rounded-3xl shadow-2xl p-4 text-[#0D530E] space-y-4 max-h-[82vh] overflow-y-auto">
        
        {/* MODE 1: BASELINE */}
        {activeMode === 'baseline' && (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-500/50 p-3 rounded-2xl space-y-2 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-red-800 uppercase tracking-wider flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-red-600" /> Community Threat Alert
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-mono font-bold">Pub/Sub</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("/api/alert", { method: "POST" });
                    const d = await r.json();
                    if (d.alert) {
                      alert(`🚨 SEMAI THREAT ALERT (PUB/SUB REPLAY)\n\nEvent: Mangrove Conversion Detected\nLocation: Cell ${d.alert.cell_id} (${d.alert.village})\nLoss Footprint: ~${d.alert.loss_area_ha} ha\nRisk Level: ${d.alert.conversion_risk}\nStatus: Dispatched to Pokmaswas Patrol Group via Pub/Sub.`);
                    }
                  } catch (e) { console.error(e); }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-[#FBF5DD] font-black py-2 px-3 rounded-xl text-xs transition-all shadow flex items-center justify-center space-x-1.5"
              >
                <span>Simulate Threat Detection</span>
              </button>
            </div>

            <div className="border-b border-[#D5CC94] pb-2">
              <span className="font-extrabold text-sm tracking-wide text-[#0D530E]">Satellite Observation</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#306D29] font-bold flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-[#306D29]" /> Select Year:
                </span>
                <span className="font-extrabold text-[#0D530E] font-mono text-sm">{selectedYear}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[2017, 2021, 2024].map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year as any)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedYear === year
                        ? 'bg-[#306D29] text-[#FBF5DD] shadow'
                        : 'bg-[#FBF5DD] text-[#0D530E] hover:bg-[#F2E8BF] border border-[#D5CC94]'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#D5CC94]">
              <label className="flex items-center justify-between text-xs text-[#0D530E] font-semibold cursor-pointer">
                <span className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-[#0D530E] mr-2"></span> Coastal Mangrove
                </span>
                <input
                  type="checkbox"
                  checked={showMangrove}
                  onChange={(e) => setShowMangrove(e.target.checked)}
                  className="accent-[#306D29] rounded"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-[#0D530E] font-semibold cursor-pointer">
                <span className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-[#D97706] mr-2"></span> Aquaculture Pond
                </span>
                <input
                  type="checkbox"
                  checked={showPond}
                  onChange={(e) => setShowPond(e.target.checked)}
                  className="accent-[#D97706] rounded"
                />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#D5CC94]">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#306D29]">Coastal Overlays</span>
              <label className="flex items-center justify-between text-xs text-[#0D530E] font-semibold cursor-pointer">
                <span className="flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" /> Conversion Pressure</span>
                <input
                  type="checkbox"
                  checked={showRisk}
                  onChange={(e) => { setShowRisk(e.target.checked); if (e.target.checked) setShowGain(false); }}
                  className="accent-red-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-[#0D530E] font-semibold cursor-pointer">
                <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1.5 text-[#306D29]" /> Natural Growth Zone</span>
                <input
                  type="checkbox"
                  checked={showGain}
                  onChange={(e) => { setShowGain(e.target.checked); if (e.target.checked) setShowRisk(false); }}
                  className="accent-[#306D29] rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* MODE 2: OPPORTUNITY */}
        {activeMode === 'opportunity' && (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-500/50 p-3 rounded-2xl space-y-2 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-red-800 uppercase tracking-wider flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-red-600" /> Community Threat Alert
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-mono font-bold">Pub/Sub</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("/api/alert", { method: "POST" });
                    const d = await r.json();
                    if (d.alert) {
                      alert(`🚨 SEMAI THREAT ALERT (PUB/SUB REPLAY)\n\nEvent: Mangrove Conversion Detected\nLocation: Cell ${d.alert.cell_id} (${d.alert.village})\nLoss Footprint: ~${d.alert.loss_area_ha} ha\nRisk Level: ${d.alert.conversion_risk}\nStatus: Dispatched to Pokmaswas Patrol Group via Pub/Sub.`);
                    }
                  } catch (e) { console.error(e); }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-[#FBF5DD] font-black py-2 px-3 rounded-xl text-xs transition-all shadow flex items-center justify-center space-x-1.5"
              >
                <span>Simulate Threat Detection</span>
              </button>
            </div>

            <div className="border-b border-[#D5CC94] pb-2">
              <span className="font-extrabold text-sm tracking-wide text-[#0D530E]">Product Suitability Model</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#306D29] font-bold">1. Resource Pack:</label>
              <select
                value={selectedPackId}
                onChange={(e) => {
                  setSelectedPackId(e.target.value);
                  const firstProd = packs[e.target.value]?.products[0]?.product_id || '';
                  setSelectedProductId(firstProd);
                }}
                className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-xs font-bold text-[#0D530E] focus:outline-none focus:border-[#306D29]"
              >
                {Object.keys(packs).map((pId) => (
                  <option key={pId} value={pId}>
                    {packs[pId].name} ({packs[pId].products.length} products)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#306D29] font-bold">2. Target Enterprise:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-xs font-bold text-[#0D530E] focus:outline-none focus:border-[#306D29]"
              >
                {packs[selectedPackId]?.products.map((p: any) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {activeProduct && (
              <div className="bg-[#FBF5DD] p-3 rounded-xl border border-[#D5CC94] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#306D29] font-semibold">Ecological Impact:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeProduct.conservation_alignment === 1
                      ? 'bg-[#E7E1B1] text-[#0D530E] border border-[#306D29]'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {activeProduct.conservation_alignment === 1 ? 'Protects Mangrove' : 'Neutral (Harvest Rules)'}
                  </span>
                </div>
                <p className="text-[11px] text-[#0D530E] italic">"{activeProduct.harvest_note}"</p>
              </div>
            )}

            <div className="pt-2 border-t border-[#D5CC94] space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#306D29]">Top 5 Optimal Sites</span>
              <div className="space-y-1.5">
                {topSites.map((item: any, idx: number) => (
                  <div
                    key={item.props.cell_id}
                    onClick={() => { setSelectedCell(item.props); }}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#FBF5DD] hover:bg-[#F2E8BF] border border-[#D5CC94] cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-[#306D29] text-[#FBF5DD] text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-[#0D530E]">{item.props.cell_id}</span>
                      <span className="text-[11px] text-[#306D29]">({item.props.desa})</span>
                    </div>
                    <span className="font-extrabold text-[#0D530E] font-mono">
                      {Math.round((item.scoreRes.score || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: QUADRANT */}
        {activeMode === 'quadrant' && (
          <div className="space-y-4">
            <div className="bg-red-100 border-2 border-red-500/50 p-3 rounded-2xl space-y-2 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-red-800 uppercase tracking-wider flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1 text-red-600" /> Community Threat Alert
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-mono font-bold">Pub/Sub</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("/api/alert", { method: "POST" });
                    const d = await r.json();
                    if (d.alert) {
                      alert(`🚨 SEMAI THREAT ALERT (PUB/SUB REPLAY)\n\nEvent: Mangrove Conversion Detected\nLocation: Cell ${d.alert.cell_id} (${d.alert.village})\nLoss Footprint: ~${d.alert.loss_area_ha} ha\nRisk Level: ${d.alert.conversion_risk}\nStatus: Dispatched to Pokmaswas Patrol Group via Pub/Sub.`);
                    }
                  } catch (e) { console.error(e); }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-[#FBF5DD] font-black py-2 px-3 rounded-xl text-xs transition-all shadow flex items-center justify-center space-x-1.5"
              >
                <span>Simulate Threat Detection</span>
              </button>
            </div>

            <div className="border-b border-[#D5CC94] pb-2">
              <span className="font-extrabold text-sm tracking-wide text-[#0D530E]">Decision Matrix</span>
              <p className="text-[11px] text-[#306D29] mt-0.5">Opportunity (≥50%) vs. Conversion Risk (≥50%)</p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { id: 'all', label: 'All Quadrants', color: 'bg-slate-400', desc: 'Display all scored cells' },
                { id: 'accompany', label: 'Accompany Business First', color: 'bg-[#C2410C]', desc: 'High Opportunity + High Risk' },
                { id: 'expand', label: 'Expand & Connect Buyers', color: 'bg-[#306D29]', desc: 'High Opportunity + Low Risk' },
                { id: 'patrol', label: 'Patrol & Restore', color: 'bg-[#D97706]', desc: 'Low Opportunity + High Risk' },
                { id: 'monitor', label: 'Monitor Baseline', color: 'bg-slate-400', desc: 'Low Opportunity + Low Risk' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuadrant(q.id)}
                  className={`w-full flex flex-col p-2.5 rounded-xl text-left transition-all ${
                    selectedQuadrant === q.id
                      ? 'bg-[#FBF5DD] border-2 border-[#306D29] shadow-sm'
                      : 'hover:bg-[#F2E8BF] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${q.color} shrink-0`}></span>
                    <span className="text-xs font-bold text-[#0D530E]">{q.label}</span>
                  </div>
                  <span className="text-[11px] text-[#306D29] mt-0.5 pl-5.5 font-medium">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTEXT TOGGLES */}
        <div className="space-y-2 pt-3 border-t border-[#D5CC94] text-xs">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#306D29]">Context Layers</span>
          <label className="flex items-center justify-between text-[#0D530E] font-medium cursor-pointer">
            <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1.5 text-[#306D29]" /> UMKM Enterprises</span>
            <input type="checkbox" checked={showUMKM} onChange={(e) => setShowUMKM(e.target.checked)} className="accent-[#306D29] rounded" />
          </label>
          <label className="flex items-center justify-between text-[#0D530E] font-medium cursor-pointer">
            <span className="flex items-center"><Store className="w-4 h-4 mr-1.5 text-[#0284C7]" /> Village Hubs (Mosques & Markets)</span>
            <input type="checkbox" checked={showGathering} onChange={(e) => setShowGathering(e.target.checked)} className="accent-[#0284C7] rounded" />
          </label>
          <label className="flex items-center justify-between text-[#0D530E] font-medium cursor-pointer">
            <span className="flex items-center"><Navigation className="w-4 h-4 mr-1.5 text-[#D97706]" /> Road Network (Overture)</span>
            <input type="checkbox" checked={showRoads} onChange={(e) => setShowRoads(e.target.checked)} className="accent-[#D97706] rounded" />
          </label>
        </div>
      </div>

      {/* RIGHT PANEL: Cell Inspector */}
      {selectedCell && (
        <div className="absolute top-20 right-4 z-30 w-88 bg-[#E7E1B1] border-2 border-[#D5CC94] rounded-3xl shadow-2xl p-4 text-[#0D530E] space-y-3 max-h-[82vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#D5CC94] pb-2">
            <div>
              <span className="text-xs text-[#306D29] font-medium block">Inspected 100m Cell</span>
              <span className="font-extrabold text-[#0D530E] text-base font-mono">{selectedCell.cell_id}</span>
              <span className="text-xs text-[#306D29] ml-2">({selectedCell.desa})</span>
            </div>
            <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-[#F2E8BF] rounded-lg text-[#0D530E]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeMode === 'opportunity' && activeProduct && (
            <div className="space-y-2.5">
              {(() => {
                const scoreResult = scoreCell(selectedCell, activeProduct, umkmData);
                return (
                  <>
                    <div className="flex items-center justify-between bg-[#FBF5DD] p-2.5 rounded-xl border border-[#D5CC94]">
                      <span className="text-xs text-[#0D530E] font-bold">{activeProduct.name}:</span>
                      <span className="text-base font-black text-[#0D530E] font-mono">
                        {scoreResult.score !== null ? `${Math.round(scoreResult.score * 100)}%` : 'Excluded'}
                      </span>
                    </div>

                    {!scoreResult.excluded && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-[#306D29] uppercase tracking-wider block">Factor Contribution:</span>
                        {scoreResult.factors.map((f: any) => (
                          <div key={f.label} className="space-y-0.5 text-xs">
                            <div className="flex justify-between text-[#0D530E] font-medium">
                              <span>{f.label}</span>
                              <span className="font-mono font-bold text-[#306D29]">+{Math.round(f.contribution * 100)}%</span>
                            </div>
                            <div className="w-full bg-[#FBF5DD] h-2 rounded-full overflow-hidden border border-[#D5CC94]">
                              <div className="bg-[#306D29] h-full rounded-full" style={{ width: `${Math.round(f.transformed_value * 100)}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="space-y-2 text-xs pt-2 border-t border-[#D5CC94]">
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Mangrove Cover:</span>
              <span className="font-bold text-[#0D530E]">{Math.round((selectedCell.mangrove_frac_2024 || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Pond Basin:</span>
              <span className="font-bold text-[#D97706]">{Math.round((selectedCell.pond_frac_2024 || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Conversion Threat:</span>
              <span className="font-bold text-red-700">{Math.round((selectedCell.p_loss_500m || 0.2) * 100)}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#306D29]">Straight-line to Coast:</span>
              <span className="font-bold">{Math.round(selectedCell.dist_coast_m || 0)} m</span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT PANEL: Village Hub Inspector */}
      {selectedHub && (
        <div className="absolute top-20 right-4 z-30 w-88 bg-[#E7E1B1] border-2 border-[#0284C7] rounded-3xl shadow-2xl p-4 text-[#0D530E] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D5CC94] pb-2">
            <div>
              <span className="text-[11px] text-[#0284C7] uppercase font-extrabold tracking-wider">Village Gathering Anchor</span>
              <span className="font-extrabold text-[#0D530E] text-base block">{selectedHub.name}</span>
            </div>
            <button onClick={() => setSelectedHub(null)} className="p-1 hover:bg-[#F2E8BF] rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Category:</span>
              <span className="font-bold text-[#0284C7] capitalize">{selectedHub.cat?.replace('_', ' ') || 'Community Hub'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#306D29]">Footfall Multiplier:</span>
              <span className="font-bold text-[#D97706]">{selectedHub.weight}x</span>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT PANEL: UMKM Inspector */}
      {selectedUMKM && (
        <div className="absolute top-20 right-4 z-30 w-88 bg-[#E7E1B1] border-2 border-[#306D29] rounded-3xl shadow-2xl p-4 text-[#0D530E] space-y-3">
          <div className="flex items-center justify-between border-b border-[#D5CC94] pb-2">
            <div>
              <span className="text-[11px] text-[#306D29] uppercase font-extrabold tracking-wider">Simulated Enterprise</span>
              <span className="font-extrabold text-[#0D530E] text-base block">{selectedUMKM.name}</span>
            </div>
            <button onClick={() => setSelectedUMKM(null)} className="p-1 hover:bg-[#F2E8BF] rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Product:</span>
              <span className="font-bold text-[#0D530E] capitalize">{selectedUMKM.product_id.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Resource Pack:</span>
              <span className="font-bold text-[#306D29] capitalize">{selectedUMKM.pack_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#D5CC94]/60">
              <span className="text-[#306D29]">Village:</span>
              <span className="font-bold text-[#0D530E]">{selectedUMKM.desa}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#306D29]">Monthly Revenue:</span>
              <span className="font-bold text-[#D97706]">Rp {selectedUMKM.monthly_revenue_idr?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
