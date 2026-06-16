import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, BookOpen, MessageSquare, PlayCircle, Sparkles, Youtube, Quote, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { YOUTUBE_VIDEOS } from '../data/videos';
import { ARTICLES } from '../data/articles';

export function DashboardView({ onNavigate }: { onNavigate: (tab: string, contextId?: string) => void }) {
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const tidbits = [
    "The world will be filled with the knowledge of God as the waters cover the sea.",
    "Every act of goodness and kindness is a crucial step towards the final redemption.",
    "Moshiach will bring an era of universal peace, where no nation will lift a sword against another.",
    "We are standing on the threshold of redemption, we just need to open our eyes.",
    "The true purpose of creation is to make a dwelling place for God in this physical world.",
    "A single deed, a single word, or even a single thought can tilt the cosmic scale.",
    "Redemption is not merely an event, but a process of transformation.",
    "The physical world is not meant to be escaped, but to be perfected."
  ];

  const allArticles = ARTICLES.filter(a => !a.isFolder);

  useEffect(() => {
    const generateFeed = () => {
      let items = [];
      const totalItems = page * 12;
      let quoteIdx = 0;
      let articleIdx = 0;
      let videoIdx = 0;

      items.push({ type: 'chatItem', key: 'chat-0' });

      for (let i = 1; i < totalItems; i++) {
         if (i === 3 && page === 1) {
           items.push({ type: 'notebookItem', key: 'notebook-0' });
         } else if (i % 5 === 0 && quoteIdx < tidbits.length) {
           items.push({ type: 'quote', data: tidbits[quoteIdx], key: `quote-${quoteIdx}` });
           quoteIdx++;
         } else if (i % 2 === 1 && allArticles.length > 0 && articleIdx < allArticles.length) {
           items.push({ type: 'article', data: allArticles[articleIdx], key: `article-${allArticles[articleIdx].id}` });
           articleIdx++;
         } else if (videoIdx < YOUTUBE_VIDEOS.length) {
           items.push({ type: 'video', data: YOUTUBE_VIDEOS[videoIdx], key: `video-${YOUTUBE_VIDEOS[videoIdx]}` });
           videoIdx++;
         } else if (allArticles.length > 0 && articleIdx < allArticles.length) {
           // Fallback to purely articles if videos run out
           items.push({ type: 'article', data: allArticles[articleIdx], key: `article-${allArticles[articleIdx].id}` });
           articleIdx++;
         } else {
           break;
         }
      }
      setFeed(items);
    };
    generateFeed();
  }, [page]);

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
         setPage(p => p + 1);
      }
    }, { threshold: 0.1 });
    
    observer.observe(currentLoader);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="h-auto lg:h-[400px]">
        {/* Hero Card - Solid Color (Inspired by Atacama green/lime) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#D9FF42] rounded-[2.5rem] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden group h-full"
        >
          <div className="relative z-10 w-full max-w-lg">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={20} className="text-black" />
              <span className="font-semibold text-black tracking-wide uppercase text-sm">Welcome to Moshiach.ai</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-black leading-[1.05] mb-10">
              Learn the <br />
              <span className="relative inline-block border-b-4 border-black pb-1">Wisdom</span> of <br /> Redemption.
            </h1>
            
            <button 
              onClick={() => onNavigate('articles')}
              className="bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center shadow-xl"
            >
              Access Library <ArrowRight size={18} />
            </button>
          </div>
          
          <div className="absolute top-0 right-0 p-8 flex items-center -space-x-4 opacity-50 mix-blend-multiply pointer-events-none">
             <div className="w-64 h-64 bg-[#E8FF7A] rounded-full blur-3xl" />
          </div>
        </motion.div>
      </div>

      {/* Infinite Scroll Grid (Masonry feel) */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 pt-4">
        
        {feed.map((item) => {
          if (item.type === 'chatItem') {
            return (
              <div 
                key={item.key}
                className="mb-6 break-inside-avoid bg-zinc-900 text-white rounded-3xl p-8 hover:bg-zinc-800 transition-colors cursor-pointer"
                onClick={() => onNavigate('chat')}
              >
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <MessageSquare size={24} className="text-[#D9FF42]" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Ask Moshiach.ai</h3>
                <p className="text-zinc-400 mb-6 font-medium">Interact with the material systematically via our AI assistant.</p>
                <span className="text-sm font-medium flex items-center gap-2 text-[#D9FF42]">Start Chat <ArrowRight size={14}/></span>
              </div>
            );
          }
          else if (item.type === 'notebookItem') {
            return (
              <a 
                key={item.key}
                href="https://notebooklm.google.com/notebook/d6b710cf-4bac-4f07-ba8a-556c6bc81286"
                target="_blank"
                rel="noreferrer"
                className="mb-6 break-inside-avoid bg-white border border-zinc-200 rounded-3xl p-8 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer block group"
              >
                <div className="w-12 h-12 bg-[#F8F9FA] rounded-2xl flex items-center justify-center mb-6 border border-zinc-100 group-hover:scale-105 transition-transform">
                   <BookOpen size={24} className="text-zinc-800" />
                </div>
                <h3 className="text-2xl font-semibold mb-2 text-zinc-900">Google NotebookLM</h3>
                <p className="text-zinc-500 mb-6 font-medium leading-relaxed">Listen to AI-generated discussions and deep dives based on our library material.</p>
                <span className="text-sm font-bold flex items-center gap-2 text-zinc-900">Open Notebook <ArrowRight size={14} className="text-zinc-400 group-hover:translate-x-1 transition-transform"/></span>
              </a>
            );
          }
          else if (item.type === 'article') {
            return (
              <div 
                key={item.key} 
                className="mb-6 break-inside-avoid bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm group cursor-pointer"
                onClick={() => onNavigate('articles', item.data.id)}
              >
                <div className="flex items-center justify-between mb-4">
                   <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">Article</span>
                   <FileText size={20} className="text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2 leading-tight">{item.data.title}</h3>
                <button className="font-semibold text-sm underline decoration-zinc-300 underline-offset-4 group-hover:decoration-black transition-colors mt-2 text-zinc-500">Read Full Text</button>
              </div>
            );
          }
          else if (item.type === 'video') {
            const isPlaying = playingVideo === item.data;
            return (
              <div key={item.key} className="mb-6 break-inside-avoid bg-black border border-zinc-800 rounded-[2rem] overflow-hidden relative group cursor-pointer" onClick={() => !isPlaying && setPlayingVideo(item.data)}>
                <div className="aspect-video relative flex items-center justify-center transition-colors bg-zinc-900">
                   {isPlaying ? (
                     <iframe 
                       width="100%" 
                       height="100%" 
                       src={`https://www.youtube.com/embed/${item.data}?autoplay=1`} 
                       title="YouTube video player" 
                       frameBorder="0" 
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                       referrerPolicy="strict-origin-when-cross-origin"
                       allowFullScreen
                       className="absolute inset-0 w-full h-full"
                     ></iframe>
                   ) : (
                     <>
                       <img 
                         src={`https://img.youtube.com/vi/${item.data}/hqdefault.jpg`} 
                         alt="Video thumbnail"
                         className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                       />
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                       <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 border border-white/20">
                         <Youtube size={24} fill="white" className="text-white" />
                       </div>
                     </>
                   )}
                </div>
              </div>
            );
           }
          else if (item.type === 'quote') {
            return (
              <div key={item.key} className="mb-6 break-inside-avoid bg-zinc-50 rounded-3xl p-8 shadow-inner border border-zinc-100">
                 <Quote className="text-zinc-300 mb-4" size={32} />
                 <p className="text-xl font-medium text-zinc-900 tracking-tight leading-snug">
                   "{item.data}"
                 </p>
                 <p className="text-zinc-400 text-sm mt-4 font-semibold">— Daily Spark</p>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Lazy Loading Trigger */}
      <div ref={loaderRef} className="py-12 flex justify-center w-full">
         <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    </div>
  );
}
