import React, { useState } from 'react';
import { GraduationCap, Calculator } from 'lucide-react';

export const AcademyTab: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState('hpp');

  const [rawMaterials, setRawMaterials] = useState<number>(60000);
  const [labor, setLabor] = useState<number>(50000);
  const [otherCosts, setOtherCosts] = useState<number>(15000);
  const [batchUnits, setBatchUnits] = useState<number>(20);
  const [packagingPerUnit, setPackagingPerUnit] = useState<number>(3500);
  const [marginPct, setMarginPct] = useState<number>(40);

  const totalBatchCost = Number(rawMaterials) + Number(labor) + Number(otherCosts);
  const baseCostPerUnit = batchUnits > 0 ? totalBatchCost / batchUnits : 0;
  const cogsPerUnit = Math.round(baseCostPerUnit + Number(packagingPerUnit));
  const sellingPrice = Math.round(cogsPerUnit * (1 + Number(marginPct) / 100));
  const roundedPrice = Math.ceil(sellingPrice / 500) * 500;
  const profitPerUnit = roundedPrice - cogsPerUnit;

  const modules = [
    {
      id: 'hpp',
      title: '1. Cost of Goods Sold (COGS) & Selling Price',
      duration: '10 min',
      summary: 'Learn the exact mathematical formula to price your products with profit so your business never runs at a loss.'
    },
    {
      id: 'pisah_uang',
      title: '2. Separating Business Cash from Household Purse',
      duration: '5 min',
      summary: 'Simple methods to keep personal and business cash separate so daily kitchen expenses do not erode working capital.'
    },
    {
      id: 'kemasan_pirt',
      title: '3. Packaging Standards & P-IRT Health Permits',
      duration: '5 min',
      summary: 'Air-tight bottles, essential label requirements, and how to apply for P-IRT certification at the East Lombok Health Office.'
    },
    {
      id: 'jualan_online',
      title: '4. Selling via WhatsApp Business & Catalogs',
      duration: '5 min',
      summary: 'How to take appealing smartphone photos, structure a WhatsApp product catalog, and handle tourist orders.'
    },
    {
      id: 'kerja_sama_pembeli',
      title: '5. Negotiating with Souvenir Stores & Aggregators',
      duration: '5 min',
      summary: 'Securing consignment placement in Mandalika tourism gift shops and maintaining steady quality for seaweed collectors.'
    }
  ];

  return (
    <div className="h-full w-full bg-[#FBF5DD] flex flex-col md:flex-row overflow-hidden text-[#0D530E]">
      
      {/* LEFT: Modules Index (35%) */}
      <div className="w-full md:w-[35%] h-full border-r-2 border-[#D5CC94] bg-[#E7E1B1] p-4 overflow-y-auto space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#D5CC94]">
          <div className="p-2.5 bg-[#306D29] text-[#FBF5DD] rounded-xl shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#0D530E]">UMKM Enterprise Academy</h2>
            <p className="text-xs text-[#306D29] font-medium">Practical business curriculum for Teluk Jor</p>
          </div>
        </div>

        <div className="space-y-2">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                selectedModule === m.id
                  ? 'bg-[#FBF5DD] border-2 border-[#306D29] shadow-md'
                  : 'bg-[#FBF5DD]/60 border-[#D5CC94] hover:bg-[#FBF5DD]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#0D530E]">{m.title}</span>
                <span className="text-[10px] font-bold text-[#306D29] px-2 py-0.5 rounded-full bg-[#E7E1B1] border border-[#D5CC94]">
                  {m.duration}
                </span>
              </div>
              <p className="text-[11px] text-[#306D29] leading-snug font-medium">{m.summary}</p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Calculator & Module Content (65%) */}
      <div className="flex-1 h-full p-4 md:p-8 overflow-y-auto space-y-6 bg-[#FBF5DD]">
        
        {selectedModule === 'hpp' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="bg-[#E7E1B1] border-2 border-[#D5CC94] p-5 rounded-3xl space-y-3 shadow-sm">
              <span className="text-[11px] text-[#306D29] font-extrabold uppercase tracking-wider">Module 1 • Core Business Skill</span>
              <h2 className="text-lg font-black text-[#0D530E]">Calculating COGS (HPP) & Selling Price</h2>
              <p className="text-xs text-[#0D530E] leading-relaxed">
                **Cost of Goods Sold (COGS / HPP)** is the total direct cost required to produce one unit of your product. If you sell below your COGS, your business loses money on every sale—no matter how many units you sell!
              </p>

              <div className="bg-[#FBF5DD] p-3.5 rounded-2xl border border-[#D5CC94] space-y-1 font-mono text-xs text-[#0D530E] font-bold">
                <div>• Unit COGS = (Raw Materials + Labor + Operations) ÷ Batch Output + Packaging</div>
                <div>• Target Selling Price = Unit COGS × (1 + Margin %)</div>
              </div>
            </div>

            {/* Interactive Calculator */}
            <div className="bg-[#E7E1B1] border-2 border-[#306D29] rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#D5CC94] pb-3">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-[#306D29]" />
                  <h3 className="text-sm font-extrabold text-[#0D530E]">Interactive Production Cost Calculator</h3>
                </div>
                <span className="text-xs font-semibold text-[#306D29]">Sirup Pedada / Honey / Agar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">1. Raw Materials per Batch (Rp):</label>
                  <input
                    type="number"
                    value={rawMaterials}
                    onChange={(e) => setRawMaterials(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Fruit, sugar, water, ingredients</span>
                </div>

                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">2. Production Labor per Batch (Rp):</label>
                  <input
                    type="number"
                    value={labor}
                    onChange={(e) => setLabor(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Includes fair pay for your own time!</span>
                </div>

                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">3. Operating Overhead per Batch (Rp):</label>
                  <input
                    type="number"
                    value={otherCosts}
                    onChange={(e) => setOtherCosts(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Cooking gas, transport, electricity</span>
                </div>

                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">4. Batch Output Units (Total Bottles/Packs):</label>
                  <input
                    type="number"
                    value={batchUnits}
                    onChange={(e) => setBatchUnits(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Units produced per single run</span>
                </div>

                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">5. Packaging per Single Unit (Rp):</label>
                  <input
                    type="number"
                    value={packagingPerUnit}
                    onChange={(e) => setPackagingPerUnit(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Bottle/jar, printed label, cap</span>
                </div>

                <div>
                  <label className="text-[#0D530E] block mb-1 font-bold">6. Target Profit Margin (%):</label>
                  <input
                    type="number"
                    value={marginPct}
                    onChange={(e) => setMarginPct(Number(e.target.value))}
                    className="w-full bg-[#FBF5DD] border border-[#D5CC94] rounded-xl p-2.5 text-[#0D530E] font-mono font-bold"
                  />
                  <span className="text-[10px] text-[#306D29]">Standard retail margin: 30% to 50%</span>
                </div>
              </div>

              {/* Calculator Output Display */}
              <div className="mt-4 p-4 rounded-2xl bg-[#FBF5DD] border-2 border-[#D5CC94] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-[#E7E1B1] rounded-xl border border-[#D5CC94]">
                  <span className="text-[10px] text-[#306D29] uppercase font-extrabold block">Production Cost (COGS)</span>
                  <span className="text-base font-extrabold text-[#0D530E] font-mono">
                    Rp {cogsPerUnit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#306D29] block">per bottle</span>
                </div>

                <div className="p-2.5 bg-[#306D29] rounded-xl text-[#FBF5DD] shadow">
                  <span className="text-[10px] text-[#FBF5DD]/80 uppercase font-extrabold block">Recommended Price</span>
                  <span className="text-lg font-black text-[#FBF5DD] font-mono">
                    Rp {roundedPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#FBF5DD]/90 block font-bold">{marginPct}% profit margin</span>
                </div>

                <div className="p-2.5 bg-[#E7E1B1] rounded-xl border border-[#D5CC94]">
                  <span className="text-[10px] text-[#306D29] uppercase font-extrabold block">Net Profit per Unit</span>
                  <span className="text-base font-extrabold text-[#D97706] font-mono">
                    +Rp {profitPerUnit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#306D29] block">retained earnings</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedModule !== 'hpp' && (
          <div className="max-w-2xl mx-auto bg-[#E7E1B1] border-2 border-[#D5CC94] p-6 rounded-3xl space-y-4">
            <span className="text-[11px] text-[#306D29] font-extrabold uppercase tracking-wider">Business Module</span>
            <h2 className="text-base font-black text-[#0D530E]">
              {modules.find(m => m.id === selectedModule)?.title}
            </h2>
            <p className="text-xs text-[#0D530E] leading-relaxed">
              {modules.find(m => m.id === selectedModule)?.summary}
            </p>
            <div className="p-4 bg-[#FBF5DD] border border-[#D5CC94] rounded-2xl text-xs text-[#0D530E] space-y-2">
              <span className="font-bold text-[#306D29] block">• Key Learning Outcome:</span>
              <p>Practical steps tailored for Lombok Timur coastal village cooperatives, focusing on low initial capital requirements, group quality control, and direct supply relationships.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
