import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import GraphView from './components/GraphView';
import ChatPanel from './components/ChatPanel';
import { GraphData } from './types';
import { LayoutDashboard, ArrowLeft, Languages, Download } from 'lucide-react';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<'original' | 'en'>('original');

  const handleDownloadJson = () => {
    if (!graphData) return;
    const jsonString = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nodal-graph-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!graphData) {
    return <LandingPage onAnalysisComplete={(data) => {
      setGraphData(data);
      // Default to English if detected language IS English, otherwise original
      setDisplayLanguage('original'); 
    }} />;
  }

  const isBilingual = graphData.detected_language && graphData.detected_language.toLowerCase() !== 'english';

  return (
    <div className="flex h-screen w-screen bg-nodal-dark overflow-hidden">
      {/* Main Graph Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Navigation / Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none flex justify-between items-start">
          <div className="pointer-events-auto flex items-center gap-3">
            <button 
              onClick={() => setGraphData(null)}
              className="flex items-center gap-2 bg-nodal-card/80 backdrop-blur border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* Language Toggle */}
            {isBilingual && (
              <button
                onClick={() => setDisplayLanguage(prev => prev === 'original' ? 'en' : 'original')}
                className="flex items-center gap-2 bg-nodal-card/80 backdrop-blur border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Languages size={16} />
                <span className="text-sm font-medium">
                  {displayLanguage === 'original' ? graphData.detected_language : 'English'}
                </span>
              </button>
            )}

            {/* Download Button */}
            <button 
              onClick={handleDownloadJson}
              className="flex items-center gap-2 bg-nodal-card/80 backdrop-blur border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Download Graph JSON"
            >
              <Download size={16} />
            </button>
          </div>
          
          <div className="pointer-events-auto bg-nodal-card/80 backdrop-blur border border-white/10 px-6 py-2 rounded-full flex gap-6 text-sm">
             <div className="text-center">
               <span className="block text-xl font-bold text-white">{graphData.total_characters}</span>
               <span className="text-xs text-gray-400 uppercase tracking-wider">Nodes</span>
             </div>
             <div className="text-center">
               <span className="block text-xl font-bold text-white">{graphData.edges.length}</span>
               <span className="text-xs text-gray-400 uppercase tracking-wider">Edges</span>
             </div>
          </div>
        </div>

        {/* Graph Component */}
        <GraphView data={graphData} language={displayLanguage} />
      </div>

      {/* Sidebar - Chat */}
      <div className="w-[400px] h-full shadow-xl z-20">
        <ChatPanel graphData={graphData} />
      </div>
    </div>
  );
};

export default App;