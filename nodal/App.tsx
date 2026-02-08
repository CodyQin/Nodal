import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import GraphView from './components/GraphView';
import ChatPanel from './components/ChatPanel';
import TimelineControl from './components/TimelineControl';
import { AnalysisResult, GraphData, Phase, Node, Edge } from './types';
import { ArrowLeft, Languages, Download, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<'original' | 'en'>('original');
  const [activePhaseId, setActivePhaseId] = useState<string | 'overview'>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Compute the Overview Graph from all phases
  const overviewGraph = useMemo<GraphData | null>(() => {
    if (!analysisResult) return null;
    
    // If it's a legacy single graph response
    if (!analysisResult.timeline && analysisResult.nodes) {
      return {
        nodes: analysisResult.nodes,
        edges: analysisResult.edges || [],
        detected_language: analysisResult.detected_language || 'English',
        total_characters: analysisResult.total_characters || 0
      };
    }

    if (!analysisResult.timeline) return null;

    // Merge logic for Timeline
    const nodesMap = new Map<string, Node>();
    const edgesMap = new Map<string, Edge>();
    const degreeCount = new Map<string, number>();

    analysisResult.timeline.forEach(phase => {
      // Collect Nodes
      phase.graph.nodes.forEach(n => {
        if (!nodesMap.has(n.id)) {
          nodesMap.set(n.id, { ...n });
        }
        // We could accumulate descriptions or update labels if they change, 
        // but for now we stick to the first occurrence or specific logic.
      });

      // Collect Edges
      phase.graph.edges.forEach(e => {
        // Unique key for edges based on source-target-type
        // We handle objects or strings for source/target just in case
        const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        // Use type_en for uniqueness
        const type = e.relation.type_en || e.relation.type || 'unknown';
        
        const key = `${sId}-${tId}-${type}`;
        
        if (!edgesMap.has(key)) {
           // Ensure source/target are strings for the merged graph initially
           edgesMap.set(key, { 
             ...e, 
             source: sId, 
             target: tId 
            });
           
           // Count degree for centrality recalculation
           degreeCount.set(sId, (degreeCount.get(sId) || 0) + 1);
           degreeCount.set(tId, (degreeCount.get(tId) || 0) + 1);
        }
      });
    });

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());

    // Recalculate centrality and visual size for the Overview
    nodes.forEach(n => {
      const d = degreeCount.get(n.id) || 0;
      n.centrality = d;
      n.visual = {
        ...n.visual,
        size: 15 + (d * 5)
      };
    });

    return {
      detected_language: analysisResult.timeline[0]?.graph.detected_language || 'English',
      total_characters: nodes.length,
      nodes,
      edges
    };
  }, [analysisResult]);

  // Determine which graph to display
  const currentGraph = useMemo(() => {
    if (!analysisResult) return null;
    
    if (activePhaseId === 'overview') {
      return overviewGraph;
    }
    
    const phase = analysisResult.timeline?.find(p => p.phase_id === activePhaseId);
    return phase ? phase.graph : null;
  }, [analysisResult, activePhaseId, overviewGraph]);

  const handleDownloadJson = () => {
    if (!analysisResult) return;
    const jsonString = JSON.stringify(analysisResult, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nodal-analysis-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!analysisResult || !currentGraph) {
    return (
      <LandingPage 
        onAnalysisComplete={(data) => {
          setAnalysisResult(data);
          setDisplayLanguage('original'); 
        }} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const isBilingual = currentGraph.detected_language && currentGraph.detected_language.toLowerCase() !== 'english';
  const hasTimeline = !!analysisResult.timeline && analysisResult.timeline.length > 0;
  
  // Theme classes
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const headerBgClass = theme === 'dark' ? 'bg-slate-800/80 border-white/10 text-white hover:bg-white/10' : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm';
  const statsBgClass = theme === 'dark' ? 'bg-slate-800/80 border-white/10 text-white' : 'bg-white/80 border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className={`flex h-screen w-screen ${bgClass} overflow-hidden transition-colors duration-500`}>
      {/* Main Graph Area */}
      <div className="flex-1 relative flex flex-col">
        {/* Navigation / Header overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none flex justify-between items-start">
          <div className="pointer-events-auto flex items-center gap-3">
            <button 
              onClick={() => {
                setAnalysisResult(null);
                setActivePhaseId('overview');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur border transition-all ${headerBgClass}`}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* Language Toggle */}
            {isBilingual && (
              <button
                onClick={() => setDisplayLanguage(prev => prev === 'original' ? 'en' : 'original')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur border transition-all ${headerBgClass}`}
              >
                <Languages size={16} />
                <span className="text-sm font-medium">
                  {displayLanguage === 'original' ? currentGraph.detected_language : 'English'}
                </span>
              </button>
            )}

            {/* Download Button */}
            <button 
              onClick={handleDownloadJson}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur border transition-all ${headerBgClass}`}
              title="Download Analysis JSON"
            >
              <Download size={16} />
            </button>

             {/* Theme Toggle */}
             <button 
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur border transition-all ${headerBgClass}`}
              title="Toggle Day/Night Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          <div className={`pointer-events-auto px-6 py-2 rounded-full flex gap-6 text-sm backdrop-blur border transition-all ${statsBgClass}`}>
             <div className="text-center">
               <span className={`block text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentGraph.total_characters}</span>
               <span className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Nodes</span>
             </div>
             <div className="text-center">
               <span className={`block text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentGraph.edges.length}</span>
               <span className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Edges</span>
             </div>
          </div>
        </div>

        {/* Graph Component */}
        <GraphView key={activePhaseId} data={currentGraph} language={displayLanguage} theme={theme} />

        {/* Timeline Control */}
        {hasTimeline && (
          <TimelineControl 
            phases={analysisResult.timeline!} 
            activePhaseId={activePhaseId} 
            onPhaseSelect={setActivePhaseId} 
            language={displayLanguage}
            theme={theme}
          />
        )}
      </div>

      {/* Sidebar - Chat */}
      <div className="w-[400px] h-full shadow-xl z-20 relative">
        <ChatPanel analysisResult={analysisResult} theme={theme} />
      </div>
    </div>
  );
};

export default App;