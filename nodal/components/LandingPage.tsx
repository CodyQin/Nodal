import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, ArrowRight, Github, Loader2, Sparkles, BrainCircuit, XCircle, FileJson, Video, Youtube, Sun, Moon, PlayCircle, BookOpen } from 'lucide-react';
import { analyzeContentStream } from '../services/api';
import { AnalysisResult } from '../types';

interface LandingPageProps {
  onAnalysisComplete: (data: AnalysisResult) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const VIDEO_EXAMPLES = [
  {
    title: "Cinderella (1950)",
    lang: "English",
    url: "https://www.youtube.com/watch?v=DgwZebuIiXc",
    type: "video"
  },
  {
    title: "Parasite Review",
    lang: "Korean",
    url: "https://www.youtube.com/watch?v=hMDyOxuXEiE",
    type: "video"
  },
  {
    title: "City of God",
    lang: "Portuguese",
    url: "https://www.youtube.com/watch?v=6rCIlRdqXB8",
    type: "video"
  }
];

const TEXT_EXAMPLES = [
  {
    title: "Alice in Wonderland",
    lang: "English",
    type: "text",
    filename: "alice_in_wonderland.txt",
    path: "/examples/Alice's Adventures in Wonderland.txt"
  },
  {
    title: "Les Misérables",
    lang: "French",
    type: "text",
    filename: "les_miserables.txt",
    path: "/examples/Les Misérables.txt"
  },
  {
    title: "Jane Eyre",
    lang: "English",
    type: "text",
    filename: "jane_eyre.txt",
    path: "/examples/Jane Eyre.txt"
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ onAnalysisComplete, theme, toggleTheme }) => {
  // Tabs: 'story' (Text/File), 'video' (URL/MP4), 'json' (Restore)
  const [activeTab, setActiveTab] = useState<'story' | 'video' | 'json'>('story');
  
  // Story State (Text/File)
  const [textMode, setTextMode] = useState<'paste' | 'upload'>('paste');
  const [textInput, setTextInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Video State (URL/Upload)
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // JSON State
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Real-time Gemini Thoughts
  const [thoughts, setThoughts] = useState<string>('');
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Auto-scroll thoughts
  useEffect(() => {
    if (thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughts]);

  const handleSubmit = async () => {
    setError(null);
    setThoughts('');

    // Handle JSON Load separately
    if (activeTab === 'json') {
      if (!jsonFile) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          
          // Basic validation for either Timeline or legacy format
          const isTimeline = parsed.timeline && Array.isArray(parsed.timeline);
          const isGraph = parsed.nodes && Array.isArray(parsed.nodes);

          if (!isTimeline && !isGraph) {
             throw new Error("Invalid JSON format. File must contain 'timeline' or 'nodes'/'edges'.");
          }

          // Ensure types match
          onAnalysisComplete(parsed as AnalysisResult);
        } catch (err: any) {
          setError("Failed to parse JSON: " + err.message);
        }
      };
      reader.readAsText(jsonFile);
      return;
    }

    // Validation
    if (activeTab === 'story') {
       if (textMode === 'paste' && !textInput.trim()) return;
       if (textMode === 'upload' && !file) return;
    }
    if (activeTab === 'video') {
       if (videoMode === 'url' && !videoUrl.trim()) return;
       if (videoMode === 'upload' && !videoFile) return;
    }

    setLoading(true);
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      // Determine what to send based on tab
      let sendFile: File | null = null;
      let sendText: string | null = null;
      let sendVideoUrl: string | null = null;

      if (activeTab === 'story') {
        if (textMode === 'upload') sendFile = file;
        if (textMode === 'paste') sendText = textInput;
      }
      
      if (activeTab === 'video') {
        if (videoMode === 'upload') sendFile = videoFile;
        if (videoMode === 'url') sendVideoUrl = videoUrl;
      }

      await analyzeContentStream(
        sendFile,
        sendText,
        sendVideoUrl,
        (type, data) => {
          if (type === 'thought') {
            setThoughts(prev => prev + data);
          } else if (type === 'result') {
            onAnalysisComplete(data);
          } else if (type === 'error') {
            setError(data.message || 'An error occurred');
          }
        },
        abortControllerRef.current.signal
      );

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request canceled by user');
      } else {
        setError(err.response?.data?.detail || err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setThoughts('');
    }
  };

  const loadExample = async (example: any) => {
    setError(null);
    
    if (example.type === 'video') {
      setActiveTab('video');
      setVideoMode('url');
      setVideoUrl(example.url);
    } else {
      // Switch to Story tab and Upload mode
      setActiveTab('story');
      setTextMode('upload');
      setFile(null); // Reset current file while loading

      try {
        // Fetch the file from the public folder
        const response = await fetch(example.path);
        if (!response.ok) {
           throw new Error(`Failed to fetch ${example.filename}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], example.filename, { type: 'text/plain' });
        
        setFile(file);
      } catch (err: any) {
        console.error("Error loading example file:", err);
        setError(`Failed to load example: ${err.message}`);
      }
    }
  };

  // Styles
  const cardClass = isDark ? "bg-slate-800/60 border-white/10" : "bg-white/80 border-white/40";
  const textClass = isDark ? "text-white" : "text-slate-900";
  const subTextClass = isDark ? "text-blue-200" : "text-slate-600";
  const tabActive = isDark ? "bg-white/10 text-white" : "bg-white text-blue-600 shadow-sm";
  const tabInactive = isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50";
  const inputBg = isDark ? "bg-slate-900/50" : "bg-slate-50/50";
  const fieldBg = isDark ? "bg-gray-800/50 border-gray-600 text-gray-200" : "bg-white border-slate-300 text-slate-800 shadow-sm";
  const exampleCardBg = isDark ? "bg-slate-800/80 border-gray-700 hover:bg-slate-700 hover:border-blue-500/50" : "bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-300";

  return (
    <div className={`min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center relative transition-colors duration-500`}
         style={{ backgroundImage: isDark ? "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')" : "url('https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop')" }}>
      
      {/* Overlay */}
      <div className={`absolute inset-0 backdrop-blur-sm transition-colors duration-1000 ${isDark ? 'bg-slate-900/90' : 'bg-slate-50/80'}`}></div>

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
         <button onClick={toggleTheme} className={`p-3 rounded-full backdrop-blur-md border shadow-lg transition-all ${isDark ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white/60 border-slate-200 text-slate-800 hover:bg-white'}`}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
         </button>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col items-center text-center">
        
        {/* Branding */}
        <div className={`mb-8 transition-all duration-700 ${loading ? 'opacity-0 h-0 overflow-hidden' : 'animate-in fade-in zoom-in'}`}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
            <div className="relative group">
              <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <svg className="w-24 h-24 md:w-28 md:h-28 drop-shadow-sm" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="blueGradient" x1="20" y1="100" x2="100" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e40af" /> 
                    <stop offset="1" stopColor="#3b82f6" /> 
                  </linearGradient>
                </defs>
                <path d="M30 90 C 30 90, 60 60, 60 60 C 60 60, 90 30, 90 30" stroke="url(#blueGradient)" strokeWidth="8" strokeLinecap="round" className="opacity-80"/>
                <path d="M30 30 L 30 90" stroke="url(#blueGradient)" strokeWidth="8" strokeLinecap="round"/>
                <path d="M90 30 L 90 90" stroke="url(#blueGradient)" strokeWidth="8" strokeLinecap="round" className="opacity-50"/>
                <circle cx="30" cy="30" r="10" className="fill-blue-600" />
                <circle cx="30" cy="90" r="10" className="fill-blue-800" />
                <circle cx="90" cy="30" r="10" className="fill-blue-500" />
                <circle cx="90" cy="90" r="8" className="fill-blue-400/50" />
                <circle cx="60" cy="60" r="16" className="fill-white dark:fill-gray-900 stroke-blue-600 stroke-[6px]" />
                <circle cx="60" cy="60" r="5" className="fill-orange-500 animate-pulse" />
              </svg>
            </div>
            <h1 className={`text-6xl md:text-7xl font-black tracking-tighter ${textClass}`}>
              Nodal
            </h1>
          </div>
          <p className={`text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed ${subTextClass}`}>
            Unraveling the threads of your story with AI.
          </p>
        </div>

        {/* Main Card */}
        <div className={`w-full max-w-2xl backdrop-blur-md rounded-2xl p-1 shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-150 transition-all ${cardClass}`}>
          
          {loading ? (
            /* Loading View */
            <div className={`h-[550px] flex flex-col p-8 text-left relative overflow-hidden ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}`}>
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <BrainCircuit className="w-48 h-48 text-blue-500 animate-pulse" />
               </div>

               <div className="flex items-center justify-between mb-6 relative z-10">
                 <h3 className={`text-2xl font-bold flex items-center gap-3 ${textClass}`}>
                   <Loader2 className="animate-spin text-blue-500" />
                   Gemini is Thinking...
                 </h3>
                 <button 
                   onClick={handleCancel}
                   className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm border border-gray-600 rounded-full px-3 py-1 hover:border-red-400 hover:bg-red-500/10"
                 >
                   <XCircle size={16} /> Cancel
                 </button>
               </div>
               
               <div className={`flex-1 rounded-lg p-4 font-mono text-sm overflow-y-auto custom-scrollbar border relative z-10 shadow-inner ${isDark ? 'bg-black/40 text-blue-200 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                 {!thoughts ? (
                   <div className="flex items-center gap-2 text-gray-500 italic">
                     <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                     Initializing thought process...
                   </div>
                 ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {thoughts}
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                    </div>
                 )}
                 <div ref={thoughtsEndRef} />
               </div>

               <div className="mt-4 pt-4 border-t border-gray-200/20 relative z-10 flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <Sparkles size={12} className="text-purple-400" />
                    Powered by Gemini 3.0 Pro Thinking
                  </span>
                  <span className="animate-pulse">Analyzing relationships & timeline...</span>
               </div>
            </div>
          ) : (
            /* Input View */
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-200/10">
                <button
                  onClick={() => setActiveTab('story')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'story' ? tabActive : tabInactive}`}
                >
                  <FileText size={18} /> Story Content
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'video' ? tabActive : tabInactive}`}
                >
                  <Video size={18} /> Video
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'json' ? tabActive : tabInactive}`}
                >
                  <FileJson size={18} /> Load JSON
                </button>
              </div>

              {/* Input Area */}
              <div className={`p-6 ${inputBg}`}>
                {activeTab === 'story' && (
                  <div className="h-48 flex flex-col gap-4">
                     <div className="flex justify-center gap-4 mb-2">
                       <button 
                         onClick={() => setTextMode('paste')}
                         className={`px-4 py-2 rounded-lg text-sm transition-colors ${textMode === 'paste' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                       >
                         Paste Text
                       </button>
                       <button 
                         onClick={() => setTextMode('upload')}
                         className={`px-4 py-2 rounded-lg text-sm transition-colors ${textMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                       >
                         Upload File
                       </button>
                     </div>

                     {textMode === 'paste' ? (
                        <textarea
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Paste your story text here (chapters, summaries, or full text)..."
                          className={`flex-1 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-500 transition-all ${fieldBg}`}
                        />
                     ) : (
                        <div className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors relative ${isDark ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-800/50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
                          <input 
                            type="file" 
                            accept=".txt,.pdf,.docx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {file ? (
                            <div className="text-center">
                              <FileText className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                              <p className={textClass}>{file.name}</p>
                              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 pointer-events-none">
                              <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p>Click or drag file to upload</p>
                              <p className="text-xs mt-1 opacity-50">PDF, DOCX, TXT supported</p>
                            </div>
                          )}
                        </div>
                     )}
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="h-48 flex flex-col gap-4">
                    <div className="flex justify-center gap-4 mb-2">
                       <button 
                         onClick={() => setVideoMode('url')}
                         className={`px-4 py-2 rounded-lg text-sm transition-colors ${videoMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                       >
                         Video URL
                       </button>
                       <button 
                         onClick={() => setVideoMode('upload')}
                         className={`px-4 py-2 rounded-lg text-sm transition-colors ${videoMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                       >
                         Upload MP4
                       </button>
                    </div>

                    {videoMode === 'url' ? (
                       <div className="flex-1 flex flex-col justify-center">
                         <div className="relative">
                            <input
                              type="text"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="Paste YouTube or Direct MP4 URL here..."
                              className={`w-full rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-500 transition-all ${fieldBg}`}
                            />
                            <Youtube className="absolute left-3 top-3 text-red-500" size={20} />
                         </div>
                         <p className="text-xs text-gray-500 mt-2 text-center">Supports YouTube URLs or direct video links.</p>
                       </div>
                    ) : (
                      <div className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors relative ${isDark ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-800/50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
                        <input 
                          type="file" 
                          accept="video/mp4,video/quicktime,video/mpeg"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {videoFile ? (
                          <div className="text-center">
                            <Video className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                            <p className={textClass}>{videoFile.name}</p>
                            <p className="text-sm text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 pointer-events-none">
                            <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>Upload Video File</p>
                            <p className="text-xs mt-1 opacity-50">MP4, MOV supported (Max 2GB)</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* JSON Upload Block */}
                {activeTab === 'json' && (
                   <div className="h-48 flex flex-col">
                     <div className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors relative ${isDark ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-800/50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
                        <input 
                          type="file" 
                          accept=".json"
                          onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {jsonFile ? (
                          <div className="text-center">
                            <FileJson className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                            <p className={textClass}>{jsonFile.name}</p>
                            <p className="text-sm text-gray-500">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 pointer-events-none">
                            <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>Upload Analysis JSON</p>
                            <p className="text-xs mt-1 opacity-50">.json files supported</p>
                          </div>
                        )}
                     </div>
                   </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-900/50 border border-red-700/50 rounded text-red-200 text-sm">
                    Error: {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={
                    loading || 
                    (activeTab === 'story' && textMode === 'paste' && !textInput.trim()) || 
                    (activeTab === 'story' && textMode === 'upload' && !file) ||
                    (activeTab === 'json' && !jsonFile) ||
                    (activeTab === 'video' && videoMode === 'url' && !videoUrl.trim()) ||
                    (activeTab === 'video' && videoMode === 'upload' && !videoFile)
                  }
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
                >
                   {activeTab === 'json' ? (
                     <>Load Graph <ArrowRight size={18} /></>
                   ) : (
                     <>Generate Graph Timeline <ArrowRight size={18} /></>
                   )}
                </button>

                {/* Example Examples Section */}
                {(activeTab === 'story' || activeTab === 'video') && (
                  <div className="mt-8 border-t border-gray-200/10 pt-6">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center justify-center gap-2 ${subTextClass}`}>
                      <Sparkles size={12} className="text-yellow-500" />
                      Try an Example
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(activeTab === 'story' ? TEXT_EXAMPLES : VIDEO_EXAMPLES).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => loadExample(example)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group ${exampleCardBg}`}
                        >
                           {example.type === 'video' ? (
                             <PlayCircle size={24} className="mb-2 text-red-500 group-hover:scale-110 transition-transform" />
                           ) : (
                             <BookOpen size={24} className="mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                           )}
                           <span className={`text-sm font-semibold truncate w-full ${textClass}`}>{example.title}</span>
                           <span className="text-[10px] text-gray-500">{example.lang} • {example.type === 'video' ? 'Video' : 'Text'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`mt-12 text-center text-sm transition-all duration-500 ${loading ? 'opacity-0' : 'animate-in fade-in duration-1000 delay-300'} ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          <p className="mb-2">Built for the <span className="text-blue-500 font-semibold">Gemini 3 Hackathon</span></p>
          <p className="flex items-center justify-center gap-2">
            By <span className={textClass}>U Still Coding</span> (USC CS Students)
            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
            <a href="https://github.com/CodyQin/Nodal" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-500 transition-colors">
              <Github size={14} /> GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;