import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Send, 
  Sparkles, 
  Search, 
  MessageSquare, 
  Zap, 
  Cpu, 
  Database, 
  ShieldCheck, 
  AlertTriangle,
  Lightbulb,
  FileSearch,
  Code2,
  RefreshCw,
  Terminal,
  ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'delivered';
  metadata?: {
    type?: 'analysis' | 'suggestion' | 'error';
    sources?: string[];
  };
}

export const AIAuditAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Tally Audit Intelligence Assistant. I have indexed the current Tally dataset for 'Acme Technologies Pvt Ltd'. How can I help you today? You can ask me about anomalies, risk patterns, or specific ledger analysis.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input),
        timestamp: new Date(),
        metadata: {
          type: 'analysis',
          sources: ['Ledger: Cash', 'Ledger: Trade Payables', 'Voucher Type: Payment']
        }
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('cash')) {
      return "I've analysed the Cash ledger. I detected 12 instances where single-day cumulative cash payments exceeded ₹2,00,000, which might trigger Income Tax reporting requirements. Also, there's a recurring pattern of ₹9,500 payments which just stay below the statutory audit threshold. Would you like to see a detailed report?";
    }
    if (q.includes('risk') || q.includes('anomaly')) {
      return "Scanning current dataset for anomalies... Found a significant deviation in the 'Conveyance' ledger. Average monthly spend is ₹45k, but in May-24 it spiked to ₹1.2L without a corresponding increase in business activity. This matches a 'Potential Personal Expense' risk pattern.";
    }
    return "I understand you're interested in '" + query + "'. I can perform a deep dive into the transaction patterns for this query across all mapped Tally ledgers. Should I begin a structural analysis of the related voucher classes?";
  };

  const suggestions = [
    "Analyze Cash Limit Violations",
    "Find duplicate purchase bills",
    "Identify negative stock patterns",
    "Review high-value GST mismatches"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-6xl mx-auto overflow-hidden bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none">
         <Brain className="w-96 h-96 text-sky-400" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
           <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Brain className="w-6 h-6 text-indigo-400" />
           </div>
           <div>
              <h2 className="text-lg font-black text-slate-50 flex items-center gap-2">
                Audit Intelligence Assistant
                <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">System Online • Tally Context Loaded</span>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[10px] font-bold text-slate-300">12,540 Vouchers Analysed</span>
           </div>
           <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all">
              <RefreshCw className="w-4 h-4" />
           </button>
        </div>
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth z-10"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                 <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-lg ${
                   msg.role === 'user' 
                    ? 'bg-slate-800 border-slate-700 text-sky-400' 
                    : 'bg-indigo-600 border-indigo-500 text-white'
                 }`}>
                    {msg.role === 'user' ? <MessageSquare className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                 </div>
                 <div className="space-y-2">
                    <div className={`rounded-3xl px-6 py-4 text-sm leading-relaxed shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-sky-600 text-white rounded-tr-none'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-200 backdrop-blur-md rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    
                    {msg.metadata?.sources && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {msg.metadata.sources.map(source => (
                          <span key={source} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[9px] font-bold text-slate-400">
                             <FileSearch className="w-3 h-3 text-sky-500" />
                             {source}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-[10px] text-slate-600 font-mono flex items-center gap-2 px-2">
                       {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       {msg.role === 'assistant' && msg.metadata?.type === 'analysis' && (
                         <span className="flex items-center gap-1 text-emerald-500">
                           <ShieldCheck className="w-3 h-3" /> Verified Data
                         </span>
                       )}
                    </span>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 border border-indigo-500 text-white flex items-center justify-center">
                 <Brain className="w-5 h-5" />
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl rounded-tl-none px-6 py-4 flex gap-1 items-center shadow-lg">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <footer className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md z-10 space-y-4">
        {messages.length < 3 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button 
                key={s}
                onClick={() => setInput(s)}
                className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-400 hover:text-sky-400 transition-all flex items-center gap-2"
              >
                <Lightbulb className="w-3 h-3" />
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your Tally Assistant about anomalies, patterns or ledgers..."
            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-sky-500 rounded-2xl py-4 pl-6 pr-16 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
              input.trim() && !isTyping 
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:scale-110 active:scale-95' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> GPT-4o Optimized</span>
              <span className="flex items-center gap-1.5"><Code2 className="w-3 h-3" /> Tally Schema Grounded</span>
           </div>
           <div className="flex items-center gap-2">
              <span>Security Tier 1</span>
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
           </div>
        </div>
      </footer>
    </div>
  );
};
