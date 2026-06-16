import React, { useState } from 'react';
import { PlayCircle, Youtube, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YOUTUBE_VIDEOS } from '../data/videos';

export function MediaView() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const displayedVideos = showAllVideos ? YOUTUBE_VIDEOS : YOUTUBE_VIDEOS.slice(0, 7);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-24"
    >
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
             <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-black mb-2">
                Video & Audio <span className="text-zinc-500">Media</span>
             </h2>
             <p className="text-xl text-zinc-500 font-medium">Full masterclass playlist and curated teachings</p>
          </div>
       </div>

       <div className="space-y-8">
         {/* Extended YouTube Playlist */}
         <motion.div 
           initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
           className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-sm border border-zinc-100 flex flex-col"
         >
           <div className="p-2 md:p-4 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                    <Youtube size={32} fill="currentColor" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-bold text-black tracking-tight">Full YouTube Playlist</h3>
                    <p className="text-zinc-500 font-medium text-base">Watch the entire 30+ video masterclass series</p>
                 </div>
              </div>
              <a href="https://www.youtube.com/playlist?list=PLYTqRxW76j8DexSCaC7of4e0xsW42kXIR" target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 transition-colors">
                <ExternalLink size={24} className="text-zinc-600" />
              </a>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <AnimatePresence>
                {displayedVideos.map((videoId, idx) => {
                  const isPlaying = playingVideo === videoId;
                  const isHero = idx === 0;
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={videoId} 
                      className={`rounded-[2rem] overflow-hidden bg-black border border-zinc-100 group/video aspect-video relative flex items-center justify-center cursor-pointer ${isHero ? 'md:col-span-2 lg:col-span-2' : ''}`}
                      onClick={() => !isPlaying && setPlayingVideo(videoId)}
                    >
                      {isPlaying ? (
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
                          title={`YouTube video ${idx}`} 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        ></iframe>
                      ) : (
                        <>
                           <img 
                             src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                             alt="Video thumbnail"
                             className="absolute inset-0 w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-700"
                           />
                           <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/10 transition-colors"></div>
                           <div className={`w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 border border-white/20 ${isHero ? 'md:w-20 md:h-20' : ''}`}>
                             <Youtube size={isHero ? 40 : 24} fill="white" className="text-white" />
                           </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
           </div>
           
           {YOUTUBE_VIDEOS.length > 7 && (
             <div className="mt-8 flex justify-center">
               <button 
                 onClick={() => setShowAllVideos(prev => !prev)}
                 className="flex items-center gap-2 px-6 py-3 rounded-full border border-zinc-200 font-semibold hover:bg-zinc-50 transition-colors"
               >
                 {showAllVideos ? 'Show Less' : 'Show All Videos'}
                 {showAllVideos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </button>
             </div>
           )}
         </motion.div>

         {/* Spotify Podcast Bottom Section */}
         <motion.div 
           initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
           className="bg-zinc-900 text-white rounded-[2.5rem] p-6 md:p-10 shadow-xl flex flex-col md:flex-row items-center gap-8 justify-between"
         >
           <div className="flex-1 max-w-lg">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded-full bg-[#1db954]/20 flex items-center justify-center text-[#1db954]">
                    <PlayCircle size={36} fill="currentColor" className="text-[#1db954]" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-bold tracking-tight text-white mb-1">Spotify Podcast</h3>
                    <p className="text-zinc-400 font-medium text-lg">Listen on the go</p>
                 </div>
              </div>
              <p className="text-zinc-300 leading-relaxed text-lg mb-8">Access our full archive of audio lectures and weekly insights directly on Spotify.</p>
              <a href="https://open.spotify.com/show/1E9qdy0FgeMpGbqlaj8hRs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#1db954] text-black px-8 py-4 rounded-full font-bold hover:bg-[#1ed760] transition-colors">
                Open in Spotify <ExternalLink size={18} />
              </a>
           </div>

           <div className="flex-1 w-full max-w-md rounded-[2rem] overflow-hidden bg-black/50 border border-zinc-800 p-2">
               <iframe 
                 src="https://open.spotify.com/embed/show/1E9qdy0FgeMpGbqlaj8hRs?utm_source=generator&theme=0" 
                 width="100%" 
                 height="352" 
                 frameBorder="0" 
                 allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                 loading="lazy"
                 className="rounded-[1.5rem]"
               ></iframe>
           </div>
         </motion.div>
       </div>
    </motion.div>
  );
}
