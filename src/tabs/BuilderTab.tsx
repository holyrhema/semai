import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Send, Bot, Sparkles, CheckCircle2, Loader2, Compass } from 'lucide-react';
import { BadgeSimulasi } from '../components/BadgeSimulasi';

export const BuilderTab: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      text: "Hello! I am **SEMAI**, your spatial economic intelligence assistant for East Lombok. I analyze multi-year satellite data and ecosystem networks to help programme officers make data-driven decisions.\n\nAsk me where to deploy sustainable enterprises or simulate environmental trade-offs below."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const baseUrl = import.meta.env.VITE_DATA_BASE_URL || 'https://storage.googleapis.com/semai-data-hrs/data/';

  useEffect(() => {
    async function loadGraph() {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          fetch(`${baseUrl}graph_nodes.json`),
          fetch(`${baseUrl}graph_edges.json`)
        ]);
        const nodes = await nodesRes.json();
        const edges = await edgesRes.json();

        setGraphData({
          nodes: nodes.map((n: any) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            val: n.type === 'resource' ? 14 : n.type === 'business' ? 10 : 8
          })),
          links: edges.map((e: any) => ({
            source: e.from,
            target: e.to,
            sign: e.sign,
            strength: e.strength,
            evidence: e.evidence
          }))
        });
      } catch (err) {
        console.error("Could not load ecosystem graph:", err);
      }
    }
    loadGraph();
  }, [baseUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reach AI agent');

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.text,
          tools: data.toolsExecuted || []
        }
      ]);

      if (data.highlightedNodes && data.highlightedNodes.length > 0) {
        setHighlightedNodes(data.highlightedNodes);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `⚠️ Error: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Where is the best site to deploy a stingless bee (kelulut) honey enterprise?",
    "Summarize environmental and enterprise status for Desa Pemongkong.",
    "If mangroves are converted into new tambak ponds, who will be harmed?"
  ];

  return (
    <div className="flex h-full w-full bg-[#FBF5DD] overflow-hidden">
      {/* LEFT: CHAT PANEL (45%) */}
      <div className="w-[45%] h-full flex flex-col border-r-2 border-[#D5CC94] bg-[#FBF5DD]">
        <div className="p-4 border-b border-[#D5CC94] bg-[#E7E1B1] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#306D29] text-[#FBF5DD] rounded-xl shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0D530E] flex items-center space-x-2">
                <span>Ask SEMAI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF5DD] text-[#306D29] border border-[#D5CC94] font-mono">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-[#306D29] font-medium">Spatial economic advisor & scenario simulator</p>
            </div>
          </div>
          <BadgeSimulasi />
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#306D29] text-[#FBF5DD] font-semibold rounded-br-sm shadow'
                    : 'bg-[#E7E1B1] text-[#0D530E] border border-[#D5CC94] rounded-bl-sm shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.tools && m.tools.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#D5CC94] space-y-1.5">
                    <span className="text-[10px] text-[#306D29] font-extrabold uppercase tracking-wider block">
                      Grounding Tool Result:
                    </span>
                    {m.tools.map((t: any, i: number) => (
                      <div key={i} className="flex items-center space-x-1.5 text-[11px] text-[#0D530E] font-mono bg-[#FBF5DD] px-2.5 py-1 rounded-lg border border-[#D5CC94]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#306D29] shrink-0" />
                        <span>{t.name}({JSON.stringify(t.args)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#306D29] bg-[#E7E1B1] p-3 rounded-xl w-max border border-[#D5CC94]">
              <Loader2 className="w-4 h-4 text-[#306D29] animate-spin" />
              <span>Analyzing spatial cells & ecosystem network...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="p-3 bg-[#E7E1B1] border-t border-[#D5CC94] space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#306D29] block">Suggested Inquiries:</span>
          <div className="flex flex-col space-y-1.5">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left text-xs text-[#0D530E] hover:bg-[#FBF5DD] px-3 py-1.5 rounded-xl border border-[#D5CC94] transition-colors flex items-center justify-between"
              >
                <span className="truncate mr-2 font-medium">• {q}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#306D29] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#E7E1B1] border-t border-[#D5CC94] flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about optimal enterprise locations or what-if impacts..."
            className="flex-1 bg-[#FBF5DD] border border-[#D5CC94] rounded-xl px-4 py-2.5 text-xs text-[#0D530E] placeholder-[#306D29]/60 focus:outline-none focus:border-[#306D29]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-[#306D29] hover:bg-[#0D530E] disabled:opacity-50 text-[#FBF5DD] p-2.5 rounded-xl transition-all shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT: FORCE-DIRECTED ECOSYSTEM GRAPH (55%) */}
      <div className="w-[55%] h-full flex flex-col bg-[#FBF5DD] relative overflow-hidden">
        <div className="p-4 border-b border-[#D5CC94] bg-[#E7E1B1] flex items-center justify-between z-10">
          <div>
            <h3 className="text-sm font-bold text-[#0D530E] flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#306D29]" />
              <span>Teluk Jor Ecosystem Network</span>
            </h3>
            <p className="text-xs text-[#306D29]">Dependency model of resources, enterprises & markets</p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center text-[#0D530E]"><span className="w-3 h-3 rounded-full bg-[#0D530E] mr-1.5"></span> Resource</span>
            <span className="flex items-center text-[#306D29]"><span className="w-3 h-3 rounded-full bg-[#306D29] mr-1.5"></span> Enterprise</span>
            <span className="flex items-center text-[#D97706]"><span className="w-3 h-3 rounded-full bg-[#D97706] mr-1.5"></span> Market</span>
            <span className="flex items-center text-purple-700"><span className="w-3 h-3 rounded-full bg-purple-600 mr-1.5"></span> Institution</span>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
          {graphData.nodes.length > 0 && (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              cooldownTicks={100}
              onEngineStop={() => graphRef.current?.zoomToFit(400, 30)}
              nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                const isHit = highlightedNodes.includes(node.id);
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `600 ${fontSize}px Plus Jakarta Sans, sans-serif`;

                const r = isHit ? 10 : node.type === 'resource' ? 8 : 6;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                ctx.fillStyle = isHit ? '#DC2626' : node.type === 'resource' ? '#0D530E' : node.type === 'business' ? '#306D29' : node.type === 'market' ? '#D97706' : '#9333EA';
                ctx.fill();
                ctx.lineWidth = 2 / globalScale;
                ctx.strokeStyle = '#FBF5DD';
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = isHit ? '#991B1B' : '#0D530E';
                ctx.fillText(label, node.x, node.y + r + 3);
              }}
              linkColor={(l: any) => (l.sign < 0 ? '#DC2626' : '#D5CC94')}
              linkWidth={(l: any) => (l.strength === 'kuat' ? 2.5 : 1.5)}
              backgroundColor="#FBF5DD"
            />
          )}

          {highlightedNodes.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-[#E7E1B1] border-2 border-red-500/60 p-4 rounded-2xl max-w-sm text-xs text-[#0D530E] space-y-1.5 shadow-2xl z-20">
              <span className="font-extrabold text-red-700 block text-xs uppercase tracking-wider">
                Simulated Impact Cascade:
              </span>
              <p className="text-xs text-[#0D530E] leading-relaxed">
                {highlightedNodes.length} connected sectors affected. Red nodes highlight downstream economic or ecological damage.
              </p>
              <button
                onClick={() => setHighlightedNodes([])}
                className="text-xs text-red-700 font-bold underline hover:text-red-900 pt-1 block"
              >
                Clear Highlights
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
