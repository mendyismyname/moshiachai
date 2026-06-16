import React from 'react';
import { Youtube, Library, ExternalLink, Mail, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProfileView() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-zinc-50 rounded-3xl p-8 border border-zinc-100"
      >
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent)]"></div>
          <div className="w-full h-full flex items-center justify-center relative z-10 text-white text-5xl font-serif">SZ</div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">Rabbi Sholom Zirkind</h1>
            <p className="text-xl text-zinc-500 font-medium tracking-wide uppercase text-sm">MASHPIA & EDUCATOR</p>
          </div>
          
          <p className="text-zinc-600 leading-relaxed max-w-xl">
            A mashpia of the Crown Heights community, Rabbi Zirkind is well-known for his informative Torah-content videos, and expansive knowledge of Halacha, Chassidus, and the topic of Moshiach. Through his classes and digital resources, he aims to make the complex topics of Geulah and Moshiach accessible to a global audience, fostering a deeper connection to Torah study and anticipation for the final Redemption.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#" className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors">
              <Youtube size={16} /> Subscribe
            </a>
            <a href="#" className="flex items-center gap-2 bg-[#D9FF42] text-black px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#c9ef3b] transition-colors">
               Listen on Spotify <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Mission & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm col-span-2 md:col-span-2"
        >
          <h3 className="text-xl font-bold mb-4">The Mission</h3>
          <p className="text-zinc-600 leading-relaxed mb-6">
            Translating the profound, esoteric teachings of the ultimate redemption into accessible, practical lessons for the modern era. The goal is to bring the timeless wisdom of the Geulah to every corner of the world, fostering a mindset of peace, unity, and global consciousness.
          </p>
          <ul className="space-y-3">
             <li className="flex items-center gap-2 text-sm text-zinc-700 font-medium"><CheckCircle2 size={16} className="text-green-500" /> Over 160 translated articles</li>
             <li className="flex items-center gap-2 text-sm text-zinc-700 font-medium"><CheckCircle2 size={16} className="text-green-500" /> 12-part comprehensive Moshiach course</li>
             <li className="flex items-center gap-2 text-sm text-zinc-700 font-medium"><CheckCircle2 size={16} className="text-green-500" /> Growing community of thousands of students</li>
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-black text-white p-6 rounded-2xl flex flex-col justify-between"
        >
          <div>
            <Library className="text-[#D9FF42] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Want to Collaborate?</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Open to podcast interviews, guest articles, and speaking engagements on the topic of Geulah and modern spirituality.
            </p>
          </div>
          <button className="w-full bg-white text-black py-3 rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
            <Mail size={16} /> Contact Team
          </button>
        </motion.div>
      </div>
      
    </div>
  );
}
