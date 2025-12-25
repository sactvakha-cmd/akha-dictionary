import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Book, Bookmark, Map, X, ChevronLeft, ChevronDown, 
  Volume2, Shuffle, Info, Loader2, Settings, Check, Copy, Share2
} from 'lucide-react';
import { DictionaryEntry, TabView, AppSettings } from './types';
import { ROADMAP_DATA, GOOGLE_SHEET_CSV_URL } from './constants';
import { fetchGoogleSheetData } from './services/sheetService';
import { AkhaPattern, SectionDivider } from './components/AkhaPattern';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.SEARCH);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    fontFamily: 'Sarabun',
    sizeScale: 'medium',
    themeColor: 'red'
  });

  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [dailyWord, setDailyWord] = useState<DictionaryEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  // Show a quick feedback toast
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`คัดลอก ${label} แล้ว`);
  };

  const shareEntry = async (entry: DictionaryEntry) => {
    const text = `มรดกภาษาอาข่า: "${entry.akha}" (อ่านว่า: ${entry.akhaPronunciation}) แปลว่า ${entry.thai} / ${entry.english} #AkhaDictionary #Heritage`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Akha Dictionary',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        copyToClipboard(text, "ข้อมูลสำหรับแชร์");
      }
    } else {
      copyToClipboard(text, "ข้อมูลสำหรับแชร์");
    }
  };

  const updateDailyWord = useCallback((data: DictionaryEntry[]) => {
    if (data.length === 0) return;
    const today = new Date().toDateString();
    const stored = localStorage.getItem('akha_daily_word');
    const storedDate = localStorage.getItem('akha_daily_word_date');

    if (stored && storedDate === today) {
      try {
        const parsed = JSON.parse(stored);
        const found = data.find(e => e.id === parsed.id);
        setDailyWord(found || parsed);
      } catch (e) {
        setDailyWord(data[0]);
      }
    } else {
      const random = data[Math.floor(Math.random() * data.length)];
      setDailyWord(random);
      localStorage.setItem('akha_daily_word', JSON.stringify(random));
      localStorage.setItem('akha_daily_word_date', today);
    }
  }, []);

  const syncWithSheet = useCallback(async (isSilent = false) => {
    if (!GOOGLE_SHEET_CSV_URL) {
      setIsLoadingData(false);
      return;
    }
    if (!isSilent) setIsLoadingData(true);
    else setIsBackgroundSyncing(true);

    try {
      const sheetData = await fetchGoogleSheetData(GOOGLE_SHEET_CSV_URL);
      if (sheetData && sheetData.length > 0) {
        setEntries(sheetData);
        updateDailyWord(sheetData);
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsLoadingData(false);
      setIsBackgroundSyncing(false);
    }
  }, [updateDailyWord]);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('akha_bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    const savedSettings = localStorage.getItem('akha_settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    syncWithSheet();
  }, [syncWithSheet]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('akha_settings', JSON.stringify(updated));
  };

  const shuffleDailyWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entries.length === 0) return;
    const random = entries[Math.floor(Math.random() * entries.length)];
    setDailyWord(random);
    localStorage.setItem('akha_daily_word', JSON.stringify(random));
    localStorage.setItem('akha_daily_word_date', new Date().toDateString());
    showToast("สุ่มคำศัพท์ใหม่แล้ว");
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isAdding = !bookmarks.includes(id);
    const newBookmarks = isAdding ? [...bookmarks, id] : bookmarks.filter(b => b !== id);
    setBookmarks(newBookmarks);
    localStorage.setItem('akha_bookmarks', JSON.stringify(newBookmarks));
    showToast(isAdding ? "บันทึกในรายการโปรดแล้ว" : "นำออกจากรายการโปรดแล้ว");
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(entries.map(e => e.category).filter(Boolean)));
    return ['All', ...cats.sort()];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return entries.filter(entry => {
      const matchesSearch = 
        (entry.akha?.toLowerCase().includes(lowerQuery)) ||
        (entry.thai?.toLowerCase().includes(lowerQuery)) ||
        (entry.english?.toLowerCase().includes(lowerQuery));
      const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, entries, selectedCategory]);

  const displayedEntries = activeTab === TabView.BOOKMARKS
    ? entries.filter(e => bookmarks.includes(e.id))
    : filteredEntries;

  const speak = (text: string, lang: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const themeClasses = {
    red: 'bg-red-800 text-white border-red-900 shadow-red-200',
    blue: 'bg-blue-800 text-white border-blue-900 shadow-blue-200',
    green: 'bg-emerald-800 text-white border-emerald-900 shadow-emerald-200',
    slate: 'bg-slate-800 text-white border-slate-900 shadow-slate-200'
  };

  return (
    <div 
      className="h-[100dvh] bg-zinc-50 flex flex-col w-full mx-auto overflow-hidden font-sans select-none"
      style={{ fontFamily: settings.fontFamily }}
    >
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
            <Check className="w-3 h-3 text-green-400" /> {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-zinc-900 text-white p-4 pt-8 pb-6 relative z-10 flex-shrink-0 shadow-xl">
        <AkhaPattern className={`opacity-15 absolute top-0 left-0 w-full color-${settings.themeColor}`} />
        <div className="relative z-20 flex justify-between items-center mb-5">
          <div onClick={() => {setActiveTab(TabView.SEARCH); setSelectedEntry(null);}} className="cursor-pointer">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Akha Dictionary</h1>
            <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.3em] mt-0.5">{activeTab} VIEW</p>
          </div>
          <div className="flex items-center gap-2">
            {isBackgroundSyncing && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"><Settings className="w-4 h-4" /></button>
          </div>
        </div>

        {activeTab === TabView.SEARCH && !selectedEntry && (
          <div className="flex gap-2 relative z-20 animate-fade-in">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาคำศัพท์ หรือความหมาย..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-white/20" 
              />
            </div>
            <div className="relative">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-white text-[10px] font-black px-4 py-3 pr-9 rounded-2xl focus:outline-none uppercase tracking-widest cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c} className="text-zinc-900">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 pointer-events-none" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-zinc-50">
        {activeTab === TabView.SEARCH && !selectedEntry && (
          <div className="p-4 space-y-5 pb-24">
            {/* Word of the Day Section */}
            {!searchQuery && selectedCategory === 'All' && dailyWord && (
              <div className="animate-fade-in">
                <SectionDivider title="Daily Insight" />
                <div 
                  onClick={() => setSelectedEntry(dailyWord)}
                  className={`p-6 rounded-[2rem] shadow-2xl relative overflow-hidden cursor-pointer transition-all active:scale-95 group mt-2 ${themeClasses[settings.themeColor]}`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Featured Word</span>
                      <button onClick={shuffleDailyWord} className="p-1 hover:bg-white/10 rounded-full transition-colors"><Shuffle className="w-4 h-4 opacity-50" /></button>
                    </div>
                    <h3 className="text-5xl font-black tracking-tight">{dailyWord.akha}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base font-bold opacity-70 italic">/{dailyWord.akhaPronunciation}/</p>
                      <p className="text-base font-bold opacity-90">{dailyWord.thai}</p>
                    </div>
                  </div>
                  <AkhaPattern className="absolute -right-12 -bottom-4 w-56 opacity-10 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            )}

            {/* List Header */}
            <SectionDivider title={activeTab === TabView.BOOKMARKS ? 'My Collection' : 'Archive'} />

            {/* List */}
            <div className="space-y-2.5 animate-fade-in">
              {displayedEntries.map(entry => (
                <div 
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="bg-white p-5 rounded-2xl border border-zinc-100 flex justify-between items-center active:bg-zinc-50 active:scale-[0.98] transition-all duration-200 shadow-sm"
                >
                  <div className="min-w-0">
                    <h4 className="font-black text-zinc-900 text-lg leading-none">{entry.akha}</h4>
                    <p className="text-xs text-zinc-400 font-bold mt-2 flex items-center gap-2">
                      <span className="text-zinc-300">/</span> {entry.thai} <span className="text-zinc-200">•</span> {entry.english}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bookmark 
                      className={`w-4.5 h-4.5 transition-all ${bookmarks.includes(entry.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-zinc-200'}`} 
                      onClick={(e) => toggleBookmark(entry.id, e)}
                    />
                  </div>
                </div>
              ))}
              {isLoadingData && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Updating heritage...</p>
                </div>
              )}
              {displayedEntries.length === 0 && !isLoadingData && (
                <div className="text-center py-24 px-10 opacity-30">
                  <Search className="w-12 h-12 mx-auto mb-6" />
                  <h3 className="text-sm font-black uppercase tracking-widest mb-2">
                    {activeTab === TabView.BOOKMARKS ? 'Collection Empty' : 'No Results'}
                  </h3>
                  <p className="text-[10px] font-bold">
                    {activeTab === TabView.BOOKMARKS 
                      ? 'บันทึกคำศัพท์ที่คุณสนใจไว้ที่นี่เพื่อดูภายหลัง' 
                      : 'ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่ที่ต้องการ'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Word Detail View */}
        {selectedEntry && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col animate-slide-up overflow-y-auto bg-zinc-50">
            <div className="p-4 flex items-center justify-between border-b border-zinc-100 sticky top-0 bg-white/90 backdrop-blur-md z-30">
              <button onClick={() => setSelectedEntry(null)} className="p-2.5 -ml-2 text-zinc-400 hover:text-zinc-900 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
              <div className="text-center">
                <span className="text-[8px] font-black uppercase text-zinc-300 tracking-[0.3em] block mb-0.5">Category</span>
                <h2 className="font-black text-[10px] uppercase tracking-widest text-zinc-900 px-3 py-1 bg-zinc-100 rounded-full">{selectedEntry.category}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => shareEntry(selectedEntry)} className="p-2.5 text-zinc-300 hover:text-zinc-900"><Share2 className="w-4 h-4" /></button>
                <Bookmark 
                  className={`w-5 h-5 transition-all ${bookmarks.includes(selectedEntry.id) ? 'fill-red-500 text-red-500' : 'text-zinc-200'}`} 
                  onClick={() => toggleBookmark(selectedEntry.id)}
                />
              </div>
            </div>

            <div className="p-6 md:p-12 max-w-2xl mx-auto w-full pb-32">
              <div className="mb-12 animate-fade-in">
                <div className="flex justify-between items-start">
                    <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-tight">{selectedEntry.akha}</h1>
                    <button onClick={(e) => speak(selectedEntry.akha, 'en-US', e)} className="p-4 bg-zinc-900 text-white rounded-3xl shadow-xl active:scale-90 transition-all"><Volume2 className="w-6 h-6" /></button>
                </div>
                <p className="text-2xl text-zinc-400 italic font-medium mt-2">/{selectedEntry.akhaPronunciation}/</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-zinc-100">
                  <span className="text-[9px] font-black uppercase text-zinc-300 mb-2 block tracking-widest">Thai Meaning</span>
                  <p className="text-2xl font-bold text-zinc-800">{selectedEntry.thai}</p>
                </div>
                <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-zinc-100">
                  <span className="text-[9px] font-black uppercase text-zinc-300 mb-2 block tracking-widest">English Meaning</span>
                  <p className="text-2xl font-bold text-zinc-800 italic">{selectedEntry.english}</p>
                </div>
              </div>

              {selectedEntry.exampleSentence && (
                <div className={`p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl mb-8 ${themeClasses[settings.themeColor]} animate-fade-in`}>
                  <AkhaPattern className="absolute top-0 right-0 w-64 opacity-20 rotate-12 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6 opacity-60">
                      <Info className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cultural context</span>
                    </div>
                    <p className="text-3xl font-black mb-10 leading-[1.3] italic">"{selectedEntry.exampleSentence.akha}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                      <div>
                        <p className="text-[8px] font-black uppercase opacity-40 mb-1 tracking-widest">Thai Context</p>
                        <p className="text-base font-bold leading-relaxed">{selectedEntry.exampleSentence.thai}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase opacity-40 mb-1 tracking-widest">English Context</p>
                        <p className="text-base font-bold italic leading-relaxed">{selectedEntry.english}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                 <button 
                  onClick={() => copyToClipboard(selectedEntry.akha, "คำศัพท์อาข่า")}
                  className="flex-1 flex items-center justify-center gap-3 p-5 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-colors shadow-lg active:scale-[0.98]"
                >
                  <Copy className="w-4 h-4 opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Copy Word</span>
                </button>
                <button 
                  onClick={() => shareEntry(selectedEntry)}
                  className="flex-1 flex items-center justify-center gap-3 p-5 bg-white border border-zinc-100 text-zinc-900 rounded-2xl hover:bg-zinc-50 transition-colors shadow-sm active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4 opacity-30" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Share Entry</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap View */}
        {activeTab === TabView.ROADMAP && (
          <div className="p-8 space-y-12 pb-32 max-w-3xl mx-auto animate-fade-in">
            <header className="text-center">
              <h2 className="text-5xl font-black text-zinc-900 tracking-tighter italic leading-none">The Path</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mt-3">Heritage Evolution</p>
            </header>
            <div className="space-y-16">
              {ROADMAP_DATA.map((step, i) => (
                <div key={i} className="relative pl-12 border-l-4 border-zinc-100 pb-2">
                  <div className={`absolute -left-[14px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-lg transition-colors ${step.status === 'completed' ? 'bg-green-500' : step.status === 'current' ? 'bg-zinc-900 animate-pulse' : 'bg-zinc-200'}`}></div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest ${step.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>{step.phase}</span>
                    {step.status === 'completed' && <Check className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                  <h4 className="text-2xl font-black mb-3 text-zinc-900 tracking-tight">{step.title}</h4>
                  <p className="text-base text-zinc-500 mb-6 leading-relaxed font-medium">{step.description}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {step.details.map((d, j) => <span key={j} className="text-[10px] font-bold bg-white px-4 py-2.5 rounded-2xl border border-zinc-50 shadow-sm text-zinc-700">{d}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-zinc-100 px-10 py-4 pb-10 flex justify-between items-center z-40 flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <button onClick={() => {setActiveTab(TabView.SEARCH); setSelectedEntry(null);}} className={`p-2.5 transition-all ${activeTab === TabView.SEARCH ? 'text-zinc-900 scale-125' : 'text-zinc-300'}`}><Book className="w-6 h-6" /></button>
        <button onClick={() => {setActiveTab(TabView.BOOKMARKS); setSelectedEntry(null);}} className={`p-2.5 transition-all ${activeTab === TabView.BOOKMARKS ? 'text-zinc-900 scale-125' : 'text-zinc-300'}`}><Bookmark className="w-6 h-6" /></button>
        <button onClick={() => {setActiveTab(TabView.ROADMAP); setSelectedEntry(null);}} className={`p-2.5 transition-all ${activeTab === TabView.ROADMAP ? 'text-zinc-900 scale-125' : 'text-zinc-300'}`}><Map className="w-6 h-6" /></button>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 text-zinc-300 hover:text-zinc-900 transition-all active:scale-125"><Settings className="w-6 h-6" /></button>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-900/50 backdrop-blur-md flex items-end justify-center animate-fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 pb-14 shadow-2xl relative animate-slide-up">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-8 right-8 p-3 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"><X className="w-4 h-4 text-zinc-900" /></button>
            <h3 className="text-3xl font-black mb-10 text-zinc-900 tracking-tight">App Configuration</h3>
            <div className="space-y-10">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-5 tracking-[0.3em]">Typography Preference</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['Sarabun', 'Inter', 'sans-serif'] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => updateSettings({ fontFamily: f })}
                      className={`py-4 rounded-2xl border-2 text-[10px] font-black transition-all ${settings.fontFamily === f ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-zinc-50 border-zinc-50 text-zinc-300 hover:border-zinc-200'}`}
                    >
                      {f === 'sans-serif' ? 'System' : f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-5 tracking-[0.3em]">Signature Theme</p>
                <div className="flex justify-between gap-4">
                  {(['red', 'blue', 'green', 'slate'] as const).map(c => (
                    <button 
                      key={c} 
                      onClick={() => updateSettings({ themeColor: c })}
                      className={`flex-1 h-14 rounded-2xl border-4 transition-all relative overflow-hidden ${settings.themeColor === c ? 'border-zinc-900 scale-110 shadow-2xl' : 'border-zinc-50 opacity-40 hover:opacity-100'}`}
                    >
                      <div className={`w-full h-full ${themeClasses[c].split(' ')[0]}`}></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-zinc-100 flex flex-col items-center gap-2">
                <button onClick={() => syncWithSheet()} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 flex items-center gap-2 py-2">
                  <Shuffle className="w-3 h-3" /> Check for updates
                </button>
                <p className="text-[8px] font-black uppercase text-zinc-300 tracking-widest mt-2">Akha Dictionary v1.0.0 (Stable)</p>
                <p className="text-[8px] font-bold text-zinc-300">© 2025 All Rights Reserved</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;