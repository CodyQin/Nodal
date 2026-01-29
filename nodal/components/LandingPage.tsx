import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText, ArrowRight, Github, Loader2, Sparkles, BrainCircuit, CheckCircle, Circle, XCircle, FileJson, Video, Youtube } from 'lucide-react';
import { analyzeContent } from '../services/api';
import { AnalysisResult } from '../types';
import axios from 'axios';

interface LandingPageProps {
  onAnalysisComplete: (data: AnalysisResult) => void;
}

const THINKING_STEPS = [
  "Connecting to Gemini 3.0 Flash...",
  "Ingesting story content...",
  "Detecting language...",
  "Analyzing timeline phases...",
  "Extracting character entities...",
  "Identifying social interactions...",
  "Calculating emotional weight...",
  "Building graph topology...",
  "Finalizing visualization data..."
];

const LandingPage: React.FC<LandingPageProps> = ({ onAnalysisComplete }) => {
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
  
  // Thinking state
  const [thinkingIndex, setThinkingIndex] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      setThinkingIndex(0);
      
      interval = setInterval(() => {
        setThinkingIndex((prev) => {
          // Stop incrementing if we reach the end, wait for actual API response
          if (prev >= THINKING_STEPS.length - 1) return prev;
          return prev + 1;
        });
      }, 1500); // Progress every 1.5 seconds
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async () => {
    setError(null);

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

      const data = await analyzeContent(
        sendFile, 
        sendText,
        sendVideoUrl,
        abortControllerRef.current.signal
      );
      onAnalysisComplete(data);
    } catch (err: any) {
      if (axios.isCancel(err)) {
        console.log('Request canceled by user');
      } else {
        setError(err.response?.data?.detail || "An unexpected error occurred. Please try again.");
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
      setThinkingIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-nodal-dark/90 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col items-center text-center">
        
        {/* Branding */}
        <div className={`mb-8 transition-all duration-700 ${loading ? 'opacity-0 h-0 overflow-hidden' : 'animate-in fade-in zoom-in'}`}>
           <div className="flex items-center justify-center gap-3 mb-4">
             <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
               <Sparkles className="text-white w-8 h-8" />
             </div>
             <h1 className="text-6xl font-black tracking-tight text-white">Nodal</h1>
           </div>
           <p className="text-xl text-blue-200 font-light">Unraveling the threads of your story with AI.</p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-2xl glass rounded-2xl p-1 shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-150 transition-all">
          
          {loading ? (
            /* Loading View - "Thinking Process" */
            <div className="h-[500px] flex flex-col p-8 bg-nodal-dark/95 text-left relative overflow-hidden">
               {/* Background Pulse */}
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <BrainCircuit className="w-48 h-48 text-blue-500 animate-pulse" />
               </div>

               <div className="flex items-center justify-between mb-6 relative z-10">
                 <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                   <Loader2 className="animate-spin text-blue-500" />
                   Analyzing Story Timeline...
                 </h3>
                 <button 
                   onClick={handleCancel}
                   className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm border border-gray-600 rounded-full px-3 py-1 hover:border-red-400 hover:bg-red-500/10"
                 >
                   <XCircle size={16} /> Cancel
                 </button>
               </div>
               
               <div className="flex-1 space-y-3 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                 {THINKING_STEPS.map((step, idx) => {
                   const isActive = idx === thinkingIndex;
                   const isCompleted = idx < thinkingIndex;
                   const isPending = idx > thinkingIndex;
                   
                   return (
                     <div 
                       key={idx} 
                       className={`flex items-center gap-3 transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}
                     >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : isActive ? (
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                             <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-700 flex-shrink-0" />
                        )}
                        
                        <span className={`text-sm ${isActive ? 'text-blue-200 font-medium scale-105 origin-left' : isCompleted ? 'text-gray-400' : 'text-gray-600'} transition-all duration-300`}>
                          {step}
                        </span>
                     </div>
                   );
                 })}
               </div>

               <div className="mt-6 pt-4 border-t border-white/10 relative z-10">
                  <p className="text-xs text-gray-500 text-center animate-pulse">
                    This may take up to 60 seconds for detailed timeline analysis...
                  </p>
               </div>
            </div>
          ) : (
            /* Input View */
            <>
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('story')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'story' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <FileText size={18} /> Text
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'video' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Video size={18} /> Video
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'json' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <FileJson size={18} /> Load JSON
                </button>
              </div>

              {/* Input Area */}
              <div className="p-6 bg-nodal-dark/50">
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
                          className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-500 transition-all"
                        />
                     ) : (
                        <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 transition-colors relative">
                          <input 
                            type="file" 
                            accept=".txt,.pdf,.docx"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {file ? (
                            <div className="text-center">
                              <FileText className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                              <p className="text-white font-medium">{file.name}</p>
                              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
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
                              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-500 transition-all"
                            />
                            <Youtube className="absolute left-3 top-3 text-red-500" size={20} />
                         </div>
                         <p className="text-xs text-gray-500 mt-2 text-center">Supports YouTube URLs or direct video links.</p>
                       </div>
                    ) : (
                      <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 transition-colors relative">
                        <input 
                          type="file" 
                          accept="video/mp4,video/quicktime,video/mpeg"
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {videoFile ? (
                          <div className="text-center">
                            <Video className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                            <p className="text-white font-medium">{videoFile.name}</p>
                            <p className="text-sm text-gray-400">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
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

                {activeTab === 'json' && (
                  <div className="h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center bg-gray-800/30 hover:bg-gray-800/50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {jsonFile ? (
                      <div className="text-center">
                        <FileJson className="w-10 h-10 text-green-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{jsonFile.name}</p>
                        <p className="text-sm text-gray-400">{(jsonFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 pointer-events-none">
                        <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>Upload a Nodal Graph JSON file</p>
                        <p className="text-xs mt-1 opacity-50">Restore a previous analysis</p>
                      </div>
                    )}
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
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`mt-12 text-center text-gray-400 text-sm transition-all duration-500 ${loading ? 'opacity-0' : 'animate-in fade-in duration-1000 delay-300'}`}>
          <p className="mb-2">Built for the <span className="text-blue-400 font-semibold">Gemini 3 Hackathon</span></p>
          <p className="flex items-center justify-center gap-2">
            By <span className="text-white font-medium">U Still Coding</span> (USC CS Students)
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <a href="https://github.com/CodyQin/Nodal" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              <Github size={14} /> GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
