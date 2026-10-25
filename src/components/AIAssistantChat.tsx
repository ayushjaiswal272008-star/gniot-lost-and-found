import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  CornerDownLeft, 
  HelpCircle, 
  Compass, 
  Search, 
  ShieldAlert, 
  RotateCcw,
  Minimize2
} from 'lucide-react';
import { isBackendConfigured, getBackendBaseUrl } from '../services/apiConfig';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
}

interface AIAssistantChatProps {
  onOpenReport?: (type: 'lost' | 'found') => void;
  onSearchQuery?: (q: string) => void;
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  onOpenReport,
  onSearchQuery,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am **AURA**, the official GNIOT Campus Recovery AI.\n\nI can help you locate lost items across APJ Abdul Kalam Block, Central Library, CS Labs, and Hostels, track existing reports (e.g. \`GNIOT-L-1001\`), or guide you through filing a secure claim. (Aap Hindi / Hinglish me bhi pooch sakte hain!)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const generateOfflineReply = (queryText: string): string => {
      const q = queryText.toLowerCase();
      if (q.includes('report') || q.includes('lost') || q.includes('found')) {
        return 'To report an item on GNIOT campus:\n1. Click "+ Report Lost" or "+ Report Found" in the navigation bar.\n2. Fill in the item category, color, campus zone, and distinctive marks.\n3. Upload a photo or set secret verification clues.\nOur AI matching engine will automatically cross-check existing campus entries!';
      } else if (q.includes('desk') || q.includes('where') || q.includes('location') || q.includes('office') || q.includes('library')) {
        return 'Primary GNIOT Lost Property Desks:\n• Central Library: Circulation Counter 2\n• Main Academic Block (APJ Kalam Block): Ground Floor Reception\n• Security Gate 1: Main Campus Security Control Room (+91 120 232xxxx)\n• Tech Labs: Block B Lab Technician Office (Lab 204)';
      } else if (q.includes('vision') || q.includes('visual') || q.includes('photo') || q.includes('camera') || q.includes('image')) {
        return 'AI Vision Search allows you to upload any photo (e.g. water bottle, ID card, keys, laptop charger). It extracts item geometry, color tones, and brand markers to surface potential matching reports across GNIOT.';
      } else if (q.includes('claim') || q.includes('verify') || q.includes('proof')) {
        return 'Ownership verification protects sensitive items. To claim an item:\n1. Open the item details card and click "Claim This Item".\n2. Answer the secret distinctive mark question set by the finder or provide your Student Roll Number / ID card proof.\n3. Campus security will verify and issue an authorization code.';
      }
      return 'Hello! I am AURA, your GNIOT Campus Assistant. You can ask me how to report items, where campus lost-property counters are located (APJ Kalam Block, Library, Gate 1), or use our 3D Explorer to locate drop-off points.';
    };

    if (isBackendConfigured()) {
      try {
        const baseUrl = getBackendBaseUrl()!;
        const res = await fetch(`${baseUrl}/api/gemini/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
        });

        if (!res.ok) throw new Error(`API returned status ${res.status}`);
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: data.reply || 'I am ready to help you trace any item on GNIOT campus.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: data.source
        };
        setMessages(prev => [...prev, botMsg]);
      } catch (err) {
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: generateOfflineReply(query),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'fallback'
        };
        setMessages(prev => [...prev, fallbackMsg]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Static mode (GitHub Pages without backend proxy) - instant intelligent assistant without 404 network errors
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: generateOfflineReply(query),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'fallback'
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 350);
    }
  };

  const quickPrompts = [
    'How do I report a lost item on campus?',
    'Where is the main lost property desk at GNIOT?',
    'How does AI vision verification work?',
    'What should I do if I find an ID card or wallet?'
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-2xl bg-gradient-to-r from-[#30152F] via-[#481E46] to-[#D9A441] text-[#E8EDF2] shadow-2xl shadow-[#30152F]/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group border border-[#D9A441]/40"
          aria-label="Open AI Campus Assistant"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#D9A441]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D9A441] ring-2 ring-[#30152F] animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1 text-[#E8EDF2]">
              AURA AI <Sparkles className="w-3 h-3 text-[#D9A441]" />
            </span>
            <span className="text-[11px] text-[#E8EDF2]/80 font-normal">Campus Assistant</span>
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#E8EDF2] dark:bg-[#1E0B1D] rounded-3xl border border-slate-300 dark:border-[#D9A441]/30 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#30152F] via-[#481E46] to-[#250E24] text-[#E8EDF2] flex items-center justify-between border-b border-[#D9A441]/25">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D9A441]/20 border border-[#D9A441]/40 flex items-center justify-center backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-[#D9A441]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-wide font-display text-[#E8EDF2]">AURA Assistant</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30 font-semibold">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-[#E8EDF2]/70">GNIOT Campus Neural Recovery</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[#E8EDF2]/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-2.5 bg-white/70 dark:bg-[#271026]/70 border-b border-slate-200 dark:border-[#D9A441]/15 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-[#30152F] border border-slate-300 dark:border-[#D9A441]/25 text-[11px] text-[#30152F] dark:text-[#E8EDF2] hover:text-[#D9A441] dark:hover:text-[#D9A441] hover:border-[#D9A441] transition-all shrink-0 font-medium"
              >
                {qp.length > 28 ? qp.slice(0, 28) + '...' : qp}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#E8EDF2]/40 dark:bg-[#190918]/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#D9A441] to-[#C59132] text-[#190918] font-medium rounded-br-none shadow-md shadow-[#D9A441]/20'
                      : 'bg-white dark:bg-[#2B112A] text-[#30152F] dark:text-[#E8EDF2] border border-slate-200 dark:border-[#D9A441]/20 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>
                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-[#190918]/70' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#2B112A] border border-slate-200 dark:border-[#D9A441]/20 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-[#E4C56D] animate-pulse delay-100" />
                  <span className="w-2 h-2 rounded-full bg-[#BE8B2C] animate-pulse delay-200" />
                  <span className="text-xs text-[#30152F] dark:text-[#E8EDF2]/80 ml-1">AURA scanning database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Bar */}
          <div className="px-3 py-1.5 bg-white/80 dark:bg-[#240E23] border-t border-slate-200 dark:border-[#D9A441]/20 flex items-center justify-between text-[11px] text-slate-600 dark:text-[#E8EDF2]/70">
            <span>Knowledge Park II Campus Grounding</span>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenReport && onOpenReport('lost')}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                + Lost
              </button>
              <button
                onClick={() => onOpenReport && onOpenReport('found')}
                className="text-[#D9A441] hover:underline font-semibold"
              >
                + Found
              </button>
            </div>
          </div>

          {/* Input Box */}
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="p-3 bg-white dark:bg-[#200D1F] border-t border-slate-200 dark:border-[#D9A441]/20 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AURA about campus lost items, desks, or claim guidelines..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-[#D9A441]/25 bg-white dark:bg-[#2B112A] text-xs sm:text-sm text-[#30152F] dark:text-[#E8EDF2] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#C59132] hover:brightness-105 disabled:opacity-50 text-[#190918] shadow-md transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
