import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import GraphView from './components/GraphView';
import ChatPanel from './components/ChatPanel';
import TimelineControl from './components/TimelineControl';
import { AnalysisResult, GraphData, Phase, Node, Edge } from './types';
import { ArrowLeft, Languages, Download } from 'lucide-react';

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<'original' | 'en'>('original');
  const [activePhaseId, setActivePhaseId] = useState<string | 'overview'>('overview');

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

  if (!analysisResult || !currentGraph) {
    return <LandingPage onAnalysisComplete={(data) => {
      setAnalysisResult(data);
      // Default to English if detected language IS English, otherwise original
      setDisplayLanguage('original'); 
    }} />;
  }

  const isBilingual = currentGraph.detected_language && currentGraph.detected_language.toLowerCase() !== 'english';
  const hasTimeline = !!analysisResult.timeline && analysisResult.timeline.length > 0;

  return (
    <div className="flex h-screen w-screen bg-nodal-dark overflow-hidden">
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
                  {displayLanguage === 'original' ? currentGraph.detected_language : 'English'}
                </span>
              </button>
            )}

            {/* Download Button */}
            <button 
              onClick={handleDownloadJson}
              className="flex items-center gap-2 bg-nodal-card/80 backdrop-blur border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Download Analysis JSON"
            >
              <Download size={16} />
            </button>
          </div>
          
          <div className="pointer-events-auto bg-nodal-card/80 backdrop-blur border border-white/10 px-6 py-2 rounded-full flex gap-6 text-sm">
             <div className="text-center">
               <span className="block text-xl font-bold text-white">{currentGraph.total_characters}</span>
               <span className="text-xs text-gray-400 uppercase tracking-wider">Nodes</span>
             </div>
             <div className="text-center">
               <span className="block text-xl font-bold text-white">{currentGraph.edges.length}</span>
               <span className="text-xs text-gray-400 uppercase tracking-wider">Edges</span>
             </div>
          </div>
        </div>

        {/* Graph Component */}
        {/* Key forces re-mount/reset when phase changes */}
        <GraphView key={activePhaseId} data={currentGraph} language={displayLanguage} />

        {/* Timeline Control */}
        {hasTimeline && (
          <TimelineControl 
            phases={analysisResult.timeline!} 
            activePhaseId={activePhaseId} 
            onPhaseSelect={setActivePhaseId} 
            language={displayLanguage}
          />
        )}
      </div>

      {/* Sidebar - Chat */}
      <div className="w-[400px] h-full shadow-xl z-20">
        <ChatPanel analysisResult={analysisResult} />
      </div>
    </div>
  );
};

export default App;
