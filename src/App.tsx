import React, { useState } from 'react';
import { BookOpen, Mic, MessageSquare, GraduationCap, LayoutGrid, Video, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArticlesView } from './components/ArticlesView';
import { MediaView } from './components/MediaView';
import { ChatView } from './components/ChatView';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [chatContextId, setChatContextId] = useState<string | undefined>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleNavigate = (tab: string, contextId?: string) => {
    if (tab === 'chat') {
      setIsChatOpen(true);
      if (contextId) setChatContextId(contextId);
      return;
    }
    setActiveTab(tab);
    if (contextId) {
      setChatContextId(contextId);
    } else {
      setChatContextId(undefined); // Reset context if none provided (optional, depends on desired behavior)
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <LayoutGrid size={18} />, hideLabel: false },
    { id: 'articles', label: 'Articles', icon: <BookOpen size={18} />, hideLabel: false },
    { id: 'media', label: 'Videos', icon: <Video size={18} />, hideLabel: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-foreground font-sans">
      
      {/* Navigation */}
      <header className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:static sm:sticky sm:top-0 z-40 sm:pt-6 sm:px-4 sm:pb-2 w-full flex justify-center pointer-events-none">
        <nav className="bg-white/95 sm:bg-white/80 backdrop-blur-xl border-t sm:border border-zinc-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:shadow-sm sm:rounded-full px-4 sm:px-2 py-3 sm:py-2 flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto max-w-full pointer-events-auto overflow-x-auto pb-safe">
          <div className="pr-4 pl-3 py-2 items-center gap-2 border-r border-zinc-100 mr-2 hidden sm:flex shrink-0">
            <span className="w-7 h-7 rounded-full bg-[#D9FF42] flex items-center justify-center text-black font-bold text-sm">M</span>
            <span className="font-semibold tracking-tight text-zinc-900 hidden sm:block">Moshiach.ai</span>
          </div>
          
          <div className="flex items-center justify-around flex-1 sm:flex-none gap-1 sm:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[10px] sm:text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-zinc-100 sm:bg-black text-black sm:text-white shadow-none sm:shadow-md sm:shadow-black/10' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 sm:hover:bg-zinc-100'
                }`}
              >
                <span className={activeTab === item.id ? 'text-black sm:text-zinc-300' : 'text-zinc-400'}>
                  {item.icon}
                </span>
                {!item.hideLabel && (
                  <span className="inline">{item.label}</span>
                )}
              </button>
            ))}
            
            {/* Mobile Profile button */}
            <div className="flex sm:hidden border-l border-zinc-100 pl-2">
               <button 
                 onClick={() => handleNavigate('profile')}
                 className={`w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden transition-all hover:scale-105 relative shrink-0 ${activeTab === 'profile' ? 'ring-2 ring-black ring-offset-2' : ''}`}
               >
                 <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-black"></div>
                 <span className="relative z-10 text-[10px] text-white font-serif tracking-widest">SZ</span>
               </button>
            </div>
          </div>

          <div className="pl-4 pr-1 hidden sm:flex border-l border-zinc-100 ml-2">
             <button 
               onClick={() => handleNavigate('profile')}
               className={`w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden transition-all hover:scale-105 relative ${activeTab === 'profile' ? 'ring-2 ring-black ring-offset-2' : ''}`}
             >
               <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-black"></div>
               <span className="relative z-10 text-[10px] text-white font-serif tracking-widest">SZ</span>
             </button>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-12 pt-4">
         {activeTab === 'home' && <DashboardView onNavigate={handleNavigate} />}
         {activeTab === 'articles' && <ArticlesView onNavigate={handleNavigate} initialArticleId={chatContextId} />}
         {activeTab === 'media' && <MediaView />}
         {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50 pointer-events-auto border border-zinc-800"
      >
        {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-0 sm:bottom-24 inset-x-0 sm:inset-x-auto sm:right-6 sm:left-auto w-full sm:w-11/12 sm:max-w-[380px] h-[80dvh] sm:h-[36rem] sm:min-h-[400px] bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-2xl z-50 overflow-hidden border border-zinc-200 flex flex-col pointer-events-auto"
          >
            <ChatView documentContextId={chatContextId} onClose={() => setIsChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
