import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Loader2, PlayCircle, BookOpen, File, Globe, Network } from 'lucide-react'; // 引入更多图标
import GraphView from './components/GraphView';

function App() {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setInputText(""); // 如果传了文件，清空文本框，避免混淆
    }
  };

  const handleAnalyze = async () => {
    if (!inputText && !selectedFile) {
      alert("Please upload a file or paste text.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    
    // 逻辑：如果有文件传文件，没文件传文本
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else {
      formData.append('text_content', inputText);
    }
    
    try {
      const res = await axios.post('http://localhost:8000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(res.data);
      setCurrentPhase(0); // 重置到第一阶段
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check console for details.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl mb-6 border border-slate-700/50 backdrop-blur-sm">
            <Network className="w-12 h-12 text-purple-400 mr-4" />
            <h1 className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse">
              StoryWeaver AI
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload scripts, novels, or documents. Visualize character relationships and narrative structures instantly.
          </p>
          <div className="mt-4 flex justify-center items-center space-x-6 text-sm text-slate-500">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-blue-400" />
              Character Analysis
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2 text-purple-400" />
              Relationship Mapping
            </div>
            <div className="flex items-center">
              <Network className="w-4 h-4 mr-2 text-pink-400" />
              Dynamic Timeline
            </div>
          </div>
        </header>

        {/* Input Section - 改进卡片式设计 */}
        <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 mb-10 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Text Input */}
            <div className="space-y-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-400 mr-2" />
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Paste Text</label>
              </div>
              <div className="relative">
                <textarea 
                  className="w-full h-48 bg-slate-900/80 border border-slate-600 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none outline-none" 
                  placeholder="Paste story content here... Characters, plot, relationships, etc."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setSelectedFile(null); // 互斥逻辑
                  }}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {inputText.length} characters
                </div>
              </div>
            </div>

            {/* Right: File Upload */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Upload className="w-5 h-5 text-purple-400 mr-2" />
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Or Upload File</label>
              </div>
              <div className="relative w-full h-48 border-2 border-dashed border-slate-600/50 rounded-2xl hover:border-purple-500/80 hover:bg-slate-800/90 transition-all group flex flex-col items-center justify-center cursor-pointer p-4">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {selectedFile ? (
                  <div className="text-center p-4">
                    <File className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <span className="font-medium text-slate-200 break-all max-w-xs">{selectedFile.name}</span>
                    <p className="text-sm text-slate-400 mt-2">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full w-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-12 h-12 text-slate-500 group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
                    <span className="text-slate-400 group-hover:text-slate-200 transition-colors text-lg font-medium">Drop PDF or Word here</span>
                    <p className="text-sm text-slate-600 mt-2">Supports PDF, DOCX, TXT</p>
                    <div className="mt-4 flex justify-center">
                      <div className="text-xs bg-slate-700/50 px-3 py-1 rounded-full text-slate-400">
                        Click to browse
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-10 flex justify-center">
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                loading 
                  ? 'bg-slate-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/30 hover:shadow-blue-500/50'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing Narrative Structure...</>
              ) : (
                <><PlayCircle className="w-6 h-6" /> Generate Knowledge Graph</>
              )}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="animate-fade-in-up">
            {/* Timeline Navigation */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-200 mb-4 text-center">Narrative Timeline</h2>
              <div className="flex flex-wrap justify-center gap-3 overflow-x-auto pb-4">
                {result.timeline.map((phase, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhase(index)}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-medium transition-all border ${
                      currentPhase === index 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-purple-500 text-white shadow-lg shadow-purple-500/30' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {phase.phase_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Graph Container */}
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-purple-500/10 relative h-[700px]">
              <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 min-w-[300px]">
                 <h3 className="text-base font-bold text-slate-300 mb-2">Phase Summary</h3>
                 <p className="text-sm text-slate-400 leading-relaxed">
                   {result.timeline[currentPhase]?.summary || 'Loading summary...'}
                 </p>
              </div>
              
              {/* Stats Bar */}
              <div className="absolute top-6 right-6 z-10 bg-black/40 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 flex space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{result.timeline[currentPhase]?.nodes?.length || 0}</div>
                  <div className="text-xs text-slate-400">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{result.timeline[currentPhase]?.edges?.length || 0}</div>
                  <div className="text-xs text-slate-400">Relationships</div>
                </div>
              </div>
              
              <GraphView data={result.timeline[currentPhase]} />
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-slate-600 text-sm border-t border-slate-800/50">
        <p>StoryWeaver AI • Dynamic Social Network Graph Generator • Analyze narrative structures with AI</p>
      </footer>
    </div>
  );
}

export default App;