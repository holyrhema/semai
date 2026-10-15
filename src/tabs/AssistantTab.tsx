import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { BadgeSimulasi } from '../components/BadgeSimulasi';

export const AssistantTab: React.FC = () => {
  const [selectedVillage, setSelectedVillage] = useState('Pemongkong');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      text: "Hello! I am your **SEMAI Business Assistant**. I'm here to help you find the best sustainable enterprise for your village, calculate your production costs, and price your products for profit.\n\nSelect your village above and choose a question below to get started!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/umkm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, village: selectedVillage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reach advisor');

      setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `⚠️ Error: ${err.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    `I live in ${selectedVillage}. What 3 sustainable businesses fit my location best?`,
    "How do I calculate my production costs and set a fair selling price?",
    "What are the first steps to start dried Gracilaria seaweed farming?"
  ];

  return (
    <div className="h-full w-full bg-[#FBF5DD] flex justify-center p-3 sm:p-6 overflow-hidden">
      <div className="w-full max-w-2xl h-full flex flex-col bg-[#E7E1B1] border-2 border-[#D5CC94] rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#D5CC94] bg-[#E7E1B1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#306D29] text-[#FBF5DD] rounded-xl shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0D530E] flex items-center space-x-2">
                <span>UMKM Business Assistant</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF5DD] text-[#306D29] border border-[#D5CC94] font-mono">
                  Gemini 3.8 Flash
                </span>
              </h2>
              <p className="text-xs text-[#306D29] font-medium">Practical startup & pricing advisor</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-[#FBF5DD] px-3.5 py-1.5 rounded-xl border border-[#D5CC94]">
            <MapPin className="w-4 h-4 text-[#306D29]" />
            <span className="text-xs text-[#0D530E] font-bold">My Village:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-transparent text-xs font-black text-[#0D530E] focus:outline-none cursor-pointer"
            >
              <option value="Pemongkong">Desa Pemongkong</option>
              <option value="Jerowaru">Desa Jerowaru</option>
              <option value="Pare Mas">Desa Pare Mas</option>
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBF5DD]">
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
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#306D29] bg-[#E7E1B1] p-3 rounded-xl w-max border border-[#D5CC94]">
              <Loader2 className="w-4 h-4 text-[#306D29] animate-spin" />
              <span>Analyzing village suitability & enterprise opportunities...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-[#E7E1B1] border-t border-[#D5CC94] space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#306D29] block">Frequently Asked:</span>
          <div className="flex flex-col space-y-1.5">
            {starterPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left text-xs text-[#0D530E] hover:bg-[#FBF5DD] px-3.5 py-2 rounded-xl border border-[#D5CC94] transition-colors flex items-center justify-between"
              >
                <span className="truncate mr-2 font-medium">• {q}</span>
                <ChevronRight className="w-4 h-4 text-[#306D29] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-[#E7E1B1] border-t border-[#D5CC94] flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask about running a business in ${selectedVillage}...`}
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
    </div>
  );
};
