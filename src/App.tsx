import React, { useState, useEffect } from 'react';
import { BadgeSimulasi } from './components/BadgeSimulasi';
import { MapTab } from './tabs/MapTab';
import { BuilderTab } from './tabs/BuilderTab';
import { AssistantTab } from './tabs/AssistantTab';
import { AcademyTab } from './tabs/AcademyTab';
import { DataTab } from './tabs/DataTab';
import { Map, MessageSquare, Briefcase, GraduationCap, Info, Loader2 } from 'lucide-react';

type Tab = 'peta' | 'builder' | 'umkm' | 'kelas' | 'data';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('peta');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [datasets, setDatasets] = useState<{
    grid: any;
    roads: any;
    gathering: any;
    demand: any;
    desa: any;
    umkm: any[];
    packsIndex: any;
    packs: Record<string, any>;
  } | null>(null);

  useEffect(() => {
    async function loadAllData() {
      const baseUrl = import.meta.env.VITE_DATA_BASE_URL || 'https://storage.googleapis.com/semai-data-hrs/data/';
      try {
        setLoading(true);

        const [gridRes, roadsRes, gatheringRes, demandRes, desaRes, umkmRes, packsIdxRes] = await Promise.all([
          fetch(`${baseUrl}grid.geojson`),
          fetch(`${baseUrl}roads.geojson`),
          fetch(`${baseUrl}gathering.geojson?v=2`),
          fetch(`${baseUrl}demand_points.geojson`),
          fetch(`${baseUrl}desa.geojson`),
          fetch(`${baseUrl}umkm.json`),
          fetch(`${baseUrl}packs/index.json`)
        ]);

        if (!gridRes.ok) throw new Error('Failed to load grid.geojson');

        const [grid, roads, gathering, demand, desa, umkm, packsIndex] = await Promise.all([
          gridRes.json(),
          roadsRes.json(),
          gatheringRes.json(),
          demandRes.json(),
          desaRes.json(),
          umkmRes.json(),
          packsIdxRes.json()
        ]);

        const packs: Record<string, any> = {};
        for (const pId of packsIndex.active_packs || ['mangrove', 'seaweed']) {
          const res = await fetch(`${baseUrl}packs/${pId}.json`);
          if (res.ok) {
            packs[pId] = await res.json();
          }
        }

        setDatasets({ grid, roads, gathering, demand, desa, umkm, packsIndex, packs });
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error occurred while loading data');
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FBF5DD] text-[#0D530E]">
        <Loader2 className="w-14 h-14 text-[#306D29] animate-spin mb-4" />
        <h1 className="text-2xl font-black tracking-wider text-[#0D530E]">SEMAI</h1>
        <p className="text-[#306D29] text-base mt-1 font-medium">Calibrating spatial models & natural assets...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FBF5DD] text-[#0D530E] p-6">
        <div className="bg-[#E7E1B1] border-2 border-red-500/40 text-red-800 p-6 rounded-2xl max-w-md text-center shadow-lg">
          <h2 className="font-bold text-lg mb-2">Data Load Failed</h2>
          <p className="text-sm mb-4">{errorMsg}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl text-sm font-semibold transition-all shadow">
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FBF5DD]">
      {/* Top Navbar */}
      <header className="bg-[#E7E1B1] border-b-2 border-[#D5CC94] px-6 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <span className="text-2xl font-black tracking-tight text-[#0D530E]">SEMAI</span>
          <span className="text-xs text-[#306D29] font-medium border-l border-[#D5CC94] pl-3.5 hidden sm:inline">
            Teluk Jor, East Lombok
          </span>
          <BadgeSimulasi />
        </div>

        {/* Tab Selector */}
        <nav className="flex space-x-1 sm:space-x-2">
          {[
            { id: 'peta', label: 'Map Explorer', icon: Map },
            { id: 'builder', label: 'Ask SEMAI', icon: MessageSquare },
            { id: 'umkm', label: 'Business Assistant', icon: Briefcase },
            { id: 'kelas', label: 'Academy', icon: GraduationCap },
            { id: 'data', label: 'Data & Integrity', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#306D29] text-[#FBF5DD] shadow-md'
                    : 'text-[#0D530E] hover:bg-[#F2E8BF]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FBF5DD] overflow-hidden relative">
        {activeTab === 'peta' && datasets && (
          <MapTab
            gridData={datasets.grid}
            roadsData={datasets.roads}
            gatheringData={datasets.gathering}
            desaData={datasets.desa}
            umkmData={datasets.umkm}
            packsIndex={datasets.packsIndex}
            packs={datasets.packs}
          />
        )}

        {activeTab === 'builder' && <BuilderTab />}
        {activeTab === 'umkm' && <AssistantTab />}
        {activeTab === 'kelas' && <AcademyTab />}
        {activeTab === 'data' && <DataTab />}
      </main>
    </div>
  );
}
