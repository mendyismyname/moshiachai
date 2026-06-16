import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const loadingSteps = [
  "Checking 160+ sources...",
  "Finding relevant articles...",
  "Synthesizing information...",
  "Processing answer..."
];

export function ChatView({ documentContextId, onClose }: { documentContextId?: string, onClose?: () => void }) {
  const defaultFolderId = '1pa7VGwBLaOMOzVnqdxqxrUFXinv5FId7';
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'model', content: "Shalom! I am Moshiach.ai's virtual assistant. Ask me any question based on the course material, YouTube lectures, or the 165+ Drive articles." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => Math.min(prev + 1, loadingSteps.length - 1));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (documentContextId && documentContextId !== defaultFolderId) {
       setMessages(prev => [
         ...prev, 
         { role: 'model', content: "I've loaded the selected article as context. What would you like to know about it or discuss?" }
       ]);
    }
  }, [documentContextId]);

  const premadePrompts = [
    "What are the main concepts of Geulah discussed in these texts?",
    "Explain the Third Temple architecture according to the articles.",
    "What acts of kindness are recommended to hasten redemption?"
  ];

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newContext = [...messages, { role: 'user', content: userMsg }];
    setMessages(newContext);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          history: messages, 
          folderContextId: documentContextId || defaultFolderId,
          specificDocumentId: documentContextId 
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "An error occurred on the server.");
      }
      
      setMessages([...newContext, { role: 'model', content: data.response || "Sorry, I couldn't process that right now." }]);
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || "An error occurred fetching the response.";
      if (errMsg.includes("high demand") || errMsg.includes("503")) {
        errMsg = "The model is currently experiencing high demand. Please try again later.";
      }
      setMessages([...newContext, { role: 'model', content: errMsg }]);
    }
    setLoading(false);
  };

  return (
    <motion.div 
       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
       className="w-full h-full flex flex-col bg-white"
    >
       <div className="flex items-center justify-between gap-2 px-6 py-4 bg-black text-white shrink-0">
          <div>
             <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-1.5">
                <Sparkles className="text-[#D9FF42]" size={16} /> Moshiach.ai
             </h2>
             <p className="text-[10px] text-zinc-400 font-medium">
               Trained on the author's library • <a href="https://notebooklm.google.com/notebook/d6b710cf-4bac-4f07-ba8a-556c6bc81286" target="_blank" rel="noreferrer" className="text-[#D9FF42] hover:underline">Open in Google NotebookLM</a>
             </p>
          </div>
          {onClose && (
             <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X size={16} />
             </button>
          )}
       </div>

       <div className="flex-1 flex flex-col bg-zinc-50/50 overflow-hidden relative">
          
          <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
             <div className="space-y-6 pb-2">
                {messages.map((msg, i) => (
                  <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     key={i} 
                     className={`flex gap-3 max-w-[95%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                     <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center mt-1 ${msg.role === 'user' ? 'bg-black' : 'bg-[#D9FF42]'}`}>
                        {msg.role === 'user' ? <span className="text-white font-medium text-xs">Me</span> : <Sparkles className="text-black w-4 h-4" />}
                     </div>
                     <div className={`p-4 ${msg.role === 'user' ? 'bg-black text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-zinc-200 text-zinc-800 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                        <div className="markdown-body prose-xs prose-zinc text-current text-sm">
                           <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                     </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[90%]">
                     <div className="w-8 h-8 rounded-full bg-[#D9FF42] flex shrink-0 items-center justify-center mt-1">
                        <Sparkles className="text-black w-4 h-4" />
                     </div>
                     <div className="p-4 bg-white border border-zinc-200 text-zinc-500 flex items-center gap-3 rounded-2xl rounded-tl-sm font-medium text-sm shadow-sm min-w-[200px]">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" /> 
                        <div className="relative flex-1 h-5 overflow-hidden">
                           <AnimatePresence mode="popLayout">
                              <motion.span
                                 key={loadingMsgIdx}
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: -10 }}
                                 transition={{ duration: 0.3 }}
                                 className="absolute inset-0 truncate text-zinc-600"
                              >
                                 {loadingSteps[loadingMsgIdx]}
                              </motion.span>
                           </AnimatePresence>
                        </div>
                     </div>
                  </motion.div>
                )}
             </div>
          </div>

          <div className="p-3 bg-white border-t border-zinc-100 pb-4">
             <div className="flex overflow-x-auto items-center gap-2 mb-3 no-scrollbar pb-1">
               {premadePrompts.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handlePromptClick(prompt)}
                    className="bg-zinc-50 border border-zinc-200 text-zinc-600 px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap font-medium hover:bg-zinc-100 hover:text-black transition-colors shrink-0"
                  >
                    {prompt}
                  </button>
               ))}
             </div>
             <form onSubmit={sendMessage} className="flex items-center gap-2 relative">
                <input 
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   type="text" 
                   placeholder="Ask about Geulah..." 
                   className="flex-1 rounded-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 transition-all text-sm"
                />
                <button 
                   type="submit" 
                   disabled={!input.trim() || loading}
                   className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black hover:bg-zinc-800 disabled:bg-zinc-300 transition-colors flex shrink-0 items-center justify-center"
                >
                   <Send className="w-4 h-4 text-white ml-0.5" />
                </button>
             </form>
          </div>
       </div>
    </motion.div>
  );
}
