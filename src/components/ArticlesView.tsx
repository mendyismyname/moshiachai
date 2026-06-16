import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Folder, FileText, Loader2, Languages, ArrowRight, ArrowLeft, BookOpen, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ARTICLES } from '../data/articles';

export function ArticlesView({ onNavigate, initialArticleId }: { onNavigate?: (tab: string, contextId?: string) => void, initialArticleId?: string }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [translateTitles, setTranslateTitles] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [folderId, setFolderId] = useState<string>('');
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const fetchArticles = (targetFolderId?: string, isTranslate?: boolean) => {
    const idParam = targetFolderId !== undefined ? targetFolderId : folderId;
    
    setLoading(true);
    const transParam = isTranslate !== undefined ? isTranslate : translateTitles;
    let url = `/api/articles?translateToEnglish=${transParam}&folderId=${idParam}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setArticles([]);
        } else {
          setArticles(data.articles || []);
          setErrorMsg('');
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg('Failed to connect to backend.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialArticleId) {
      const found = ARTICLES.find(a => a.id === initialArticleId);
      if (found) {
        setSelectedArticle(found);
        setShowTranslation(false);
        setTranslatedText('');
        setOriginalText('');
        fetchOriginalText(found);
      }
    }
  }, [initialArticleId]);

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleToggleTranslateTitles = () => {
    const newTranslate = !translateTitles;
    setTranslateTitles(newTranslate);
    fetchArticles(folderId, newTranslate);
  };

  const handleSyncDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderId) {
      setFolderHistory([]);
      fetchArticles(folderId);
    }
  };

  const handleFolderClick = (id: string) => {
    setFolderHistory(prev => [...prev, folderId]);
    setFolderId(id);
    fetchArticles(id);
  };

  const handleGoBack = () => {
    if (folderHistory.length === 0) return;
    const newHistory = [...folderHistory];
    const prevFolder = newHistory.pop() || '';
    setFolderHistory(newHistory);
    setFolderId(prevFolder);
    fetchArticles(prevFolder);
  };

  const fetchOriginalText = async (article: any) => {
    setLoadingOriginal(true);
    setOriginalText('');
    try {
      const res = await fetch(`/api/articleContent?id=${article.id}&mimeType=${article.mimeType}`);
      const data = await res.json();
      setOriginalText(data.content || 'Failed to load content.');
    } catch (err) {
      console.error(err);
      setOriginalText('Failed to load content.');
    } finally {
      setLoadingOriginal(false);
    }
  };

  const handleTranslate = async (article: any) => {
    setLoadingTranslate(true);
    setTranslatedText('');
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: article.id,
          title: article.title,
          mimeType: article.mimeType
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translation || 'Translation failed.');
    } catch (e) {
      console.error(e);
      setTranslatedText('Error translating text.');
    }
    setLoadingTranslate(false);
  };

  const renderArticleBtn = (item: any) => (
    <button
      key={item.id}
      onClick={() => {
        if (item.isFolder) {
          handleFolderClick(item.id);
        } else {
          setSelectedArticle(item);
          setShowTranslation(false);
          setTranslatedText('');
          setOriginalText('');
          fetchOriginalText(item);
        }
      }}
      className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 ${
        selectedArticle?.id === item.id
          ? 'bg-black text-white shadow-lg shadow-black/10 scale-[1.01]'
          : 'hover:bg-zinc-50 bg-white border border-transparent hover:border-zinc-100 text-zinc-900 group'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] leading-tight mb-1 truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${selectedArticle?.id === item.id ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
            {item.isFolder ? 'Folder' : item.folder || 'Article'}
          </span>
        </div>
      </div>
      {item.isFolder && (
        <ArrowRight size={16} className="text-zinc-300 group-hover:text-black transition-colors" />
      )}
    </button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-[85vh] flex flex-col space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-black mb-2">
            Library
          </h2>
          <p className="text-xl text-zinc-500 font-medium max-w-lg mb-4">
            Access 165+ translated articles on Geulah pulled directly from our database.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Article Nav List (Left Column) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className={`lg:col-span-4 max-h-[80vh] overflow-y-auto bg-white rounded-[2rem] p-4 shadow-sm border border-zinc-100 flex-col ${selectedArticle ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="p-4 mb-2 flex flex-col gap-4 border-b border-zinc-50 pb-4">
             <div className="flex items-center gap-2 relative">
               {folderHistory.length > 0 && (
                 <button onClick={handleGoBack} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors shrink-0">
                    <ArrowLeft size={18} />
                 </button>
               )}
               <h3 className="font-semibold text-lg text-black flex items-center gap-2">
                 Subjects & Articles
               </h3>
             </div>
          </div>
          <div className="space-y-2 px-2 flex-1 relative min-h-[200px]">
             {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                   <Loader2 className="animate-spin text-zinc-400 w-8 h-8" />
                </div>
             ) : null}
            {articles.length === 0 && !loading ? (
              <div className="p-8 text-center text-zinc-400 font-medium">No items found.</div>
            ) : (
              articles.map(renderArticleBtn)
            )}
          </div>
        </motion.div>

        {/* Article Viewer (Right Column) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className={`lg:col-span-8 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 overflow-hidden min-h-[60vh] flex-col ${selectedArticle ? 'flex' : 'hidden lg:flex'}`}
        >
          {selectedArticle ? (
            <div className="flex-1 flex flex-col">
              {/* Rich Header Image based on Article subject */}
              <div className="pt-20 pb-8 px-6 md:px-8 w-full relative shrink-0">
                 <div 
                   className={`absolute inset-0 w-full h-full ${
                     selectedArticle.folder === 'Geulah Concepts' 
                       ? "bg-gradient-to-tr from-[#1A1A1A] to-[#434343]"
                       : "bg-gradient-to-tr from-[#2c3e50] to-[#3498db]"
                   }`}
                 />
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50 mix-blend-overlay"></div>
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                 
                 {/* Back Button */}
                 <button 
                   onClick={() => {
                     setSelectedArticle(null);
                     if (onNavigate) {
                       onNavigate('articles'); // Reset URL conceptually
                     }
                   }}
                   className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                 >
                   <ArrowLeft size={20} />
                 </button>

                 <div className="relative z-10 flex flex-col items-start w-full mt-2">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-3">
                      {selectedArticle.folder}
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold font-serif text-white max-w-4xl w-full text-left" dir={selectedArticle.language === 'he' ? 'rtl' : 'ltr'}>
                      {selectedArticle.title}
                    </h1>
                 </div>
              </div>

              <div className="p-4 md:p-8 flex-1 flex flex-col">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-100 pb-4 shrink-0">
                    <div className="flex bg-zinc-100 p-1 rounded-full items-center">
                       <button onClick={() => setShowTranslation(false)} className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${!showTranslation ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>Hebrew Original</button>
                       <button onClick={() => setShowTranslation(true)} className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 ${showTranslation ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black'}`}>
                         English Translation <Sparkles size={14} className={showTranslation ? 'text-[#8b9e11]' : ''} />
                       </button>
                    </div>
                    {showTranslation && !translatedText && (
                      <Button
                        onClick={() => handleTranslate(selectedArticle)}
                        disabled={loadingTranslate}
                        className="bg-[#D9FF42] text-black hover:bg-[#c4ea39] rounded-full px-5 py-2 h-auto font-semibold shadow-sm text-sm"
                      >
                        {loadingTranslate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Languages className="w-4 h-4 mr-2" />}
                        Generate Translation
                      </Button>
                    )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                   {showTranslation ? (
                      <div className="prose prose-zinc max-w-none prose-p:text-zinc-600 leading-relaxed font-serif pb-8">
                         {loadingTranslate ? (
                            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
                         ) : translatedText ? (
                            <div className="markdown-body text-zinc-700">
                              <ReactMarkdown>{translatedText}</ReactMarkdown>
                            </div>
                         ) : (
                           <div className="py-12 text-center text-zinc-400 font-medium font-sans">
                             <p>No translation loaded yet. Press Generate to analyze the original source text.</p>
                           </div>
                         )}
                      </div>
                   ) : (
                      <div className="prose prose-zinc max-w-none prose-p:text-zinc-600 font-serif leading-relaxed text-right md:px-8 pb-8" dir="rtl">
                         {loadingOriginal ? (
                           <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-300" /></div>
                         ) : originalText ? (
                           <div className="whitespace-pre-wrap text-lg md:text-xl leading-loose">
                              {originalText}
                           </div>
                         ) : (
                           <div className="py-12 text-center text-zinc-400 font-medium font-sans" dir="ltr">
                              <Loader2 className="w-8 h-8 animate-spin text-zinc-300 mx-auto" />
                           </div>
                         )}
                      </div>
                   )}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-32 bg-zinc-50/50">
              <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center mb-6">
                 <Folder className="w-10 h-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-medium text-zinc-900 mb-2">Select an Article</h3>
              <p className="max-w-md text-center text-zinc-500">Pick any Hebrew source document from the left to view and translate into English.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
