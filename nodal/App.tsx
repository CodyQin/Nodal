import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import GraphView from './components/GraphView';
import ChatPanel from './components/ChatPanel';
import TimelineControl from './components/TimelineControl';
import { AnalysisResult, GraphData, Phase, Node, Edge } from './types';
import { ArrowLeft, Languages, Download, Sun, Moon, Info, Settings2, Layout, GitGraph, CircleDot, Share2 } from 'lucide-react';

// Helper to calculate Betweenness Centrality (Brandes Algorithm)
// We calculate this on the frontend for the merged "Overview" graph
const calculateBetweenness = (nodes: Node[], edges: Edge[]) => {
  const adjacency: Record<string, string[]> = {};
  nodes.forEach(n => { adjacency[n.id] = []; });
  
  edges.forEach(e => {
    const s = typeof e.source === 'object' ? (e.source as any).id : e.source;
    const t = typeof e.target === 'object' ? (e.target as any).id : e.target;
    if (adjacency[s] && adjacency[t]) {
      // Avoid self-loops for centrality calculation
      if (s !== t) {
        // Check duplicates to ensure simple graph for metrics
        if (!adjacency[s].includes(t)) adjacency[s].push(t);
        if (!adjacency[t].includes(s)) adjacency[t].push(s);
      }
    }
  });

  const betweenness: Record<string, number> = {};
  nodes.forEach(n => { betweenness[n.id] = 0; });

  nodes.forEach(sNode => {
    const s = sNode.id;
    const stack: string[] = [];
    const P: Record<string, string[]> = {};
    const sigma: Record<string, number> = {};
    const d: Record<string, number> = {};

    nodes.forEach(n => {
      P[n.id] = [];
      sigma[n.id] = 0;
      d[n.id] = -1;
    });

    sigma[s] = 1;
    d[s] = 0;
    const Q: string[] = [s];

    while (Q.length > 0) {
      const v = Q.shift()!;
      stack.push(v);

      (adjacency[v] || []).forEach(w => {
        if (d[w] < 0) {
          Q.push(w);
          d[w] = d[v] + 1;
        }
        if (d[w] === d[v] + 1) {
          sigma[w] += sigma[v];
          P[w].push(v);
        }
      });
    }

    const delta: Record<string, number> = {};
    nodes.forEach(n => { delta[n.id] = 0; });

    while (stack.length > 0) {
      const w = stack.pop()!;
      P[w].forEach(v => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s) {
        betweenness[w] += delta[w];
      }
    }
  });

  // Normalize (undirected graph)
  const N = nodes.length;
  if (N > 2) {
    // FIX: The algorithm sums over ordered pairs (s,t), effectively counting every undirected path twice.
    // The max possible sum for ordered pairs is (N-1)(N-2).
    // Previously we divided by ((N-1)(N-2))/2, which resulted in values up to 2.0.
    // Correct normalization is 1 / ((N - 1) * (N - 2)).
    const scale = 1 / ((N - 1) * (N - 2));
    Object.keys(betweenness).forEach(k => {
      betweenness[k] *= scale;
    });
  } else {
    // For 1 or 2 nodes, betweenness is technically 0
    Object.keys(betweenness).forEach(k => {
      betweenness[k] = 0;
    });
  }

  return betweenness;
};

// Color Schemes Definition
const COLOR_SCHEMES = [
  { id: 'RdYlGn_r', name: 'Traffic', gradient: 'linear-gradient(to right, #1a9850, #ffffbf, #d73027)' }, // Green -> Red
  { id: 'RdBu_r', name: 'Hot/Cold', gradient: 'linear-gradient(to right, #2166ac, #f7f7f7, #b2182b)' }, // Blue -> Red
  { id: 'Viridis_r', name: 'Viridis', gradient: 'linear-gradient(to right, #fde725, #21918c, #440154)' }, // Yellow -> Purple
  { id: 'Classic', name: 'Classic', gradient: 'linear-gradient(to right, #3b82f6, #a855f7, #ef4444)' }, // Blue -> Purple -> Red
];

const App: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<'original' | 'en'>('original');
  const [activePhaseId, setActivePhaseId] = useState<string | 'overview'>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Visualization Settings
  const [colorSchemeIdx, setColorSchemeIdx] = useState(0); // Default to RdYlGn_r (index 0)
  const [colorExponent, setColorExponent] = useState(0.5);
  const [layoutStrategy, setLayoutStrategy] = useState<'force' | 'hierarchical' | 'circular'>('force');

  const activeColorScheme = COLOR_SCHEMES[colorSchemeIdx];

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
      });

      // Collect Edges
      phase.graph.edges.forEach(e => {
        const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        const type = e.relation.type_en || e.relation.type || 'unknown';
        
        const key = `${sId}-${tId}-${type}`;
        
        if (!edgesMap.has(key)) {
           edgesMap.set(key, { 
             ...e, 
             source: sId, 
             target: tId 
            });
           
           degreeCount.set(sId, (degreeCount.get(sId) || 0) + 1);
           degreeCount.set(tId, (degreeCount.get(tId) || 0) + 1);
        }
      });
    });

    const nodes = Array.from(nodesMap.values());
    const edges = Array.from(edgesMap.values());

    // Calculate Centrality (Betweenness) locally for the overview
    const betweennessScores = calculateBetweenness(nodes, edges);

    // Apply metrics
    nodes.forEach(n => {
      const d = degreeCount.get(n.id) || 0;
      
      // Use Betweenness for Centrality field (Influence)
      n.centrality = betweennessScores[n.id] || 0;
      
      // Use Degree for Size (Popularity)
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

  const cycleColorScheme = () => {
    setColorSchemeIdx((prev) => (prev + 1) % COLOR_SCHEMES.length);
  };

  const cycleLayout = () => {
    const layouts: ('force' | 'hierarchical' | 'circular')[] = ['force', 'hierarchical', 'circular'];
    const nextIdx = (layouts.indexOf(layoutStrategy) + 1) % layouts.length;
    setLayoutStrategy(layouts[nextIdx]);
  };

  const getLayoutIcon = () => {
    switch (layoutStrategy) {
      case 'hierarchical': return <GitGraph size={16} />;
      case 'circular': return <CircleDot size={16} />;
      case 'force': default: return <Share2 size={16} />;
    }
  };

  const getLayoutName = () => {
    switch (layoutStrategy) {
      case 'hierarchical': return 'Hierarchical';
      case 'circular': return 'Circular';
      case 'force': default: return 'Force';
    }
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

  // Check against both 'english' and 'en'
  const isBilingual = currentGraph.detected_language 
    && currentGraph.detected_language.toLowerCase() !== 'english'
    && currentGraph.detected_language.toLowerCase() !== 'en';

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
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Layout Toggle */}
            <button
              onClick={cycleLayout}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur border transition-all ${headerBgClass}`}
              title={`Change Layout Strategy (Current: ${getLayoutName()})`}
            >
              {getLayoutIcon()}
              <span className="text-sm font-medium hidden lg:inline">{getLayoutName()}</span>
            </button>

            {/* Interactive Heatmap Legend & Control */}
            <div className={`flex flex-col justify-center px-4 py-2 rounded-lg backdrop-blur border transition-all gap-2 group ${headerBgClass}`}>
                
                {/* Clickable Legend Bar */}
                <div 
                  className="cursor-pointer"
                  onClick={cycleColorScheme}
                  title={`Click to change color scheme. Current: ${activeColorScheme.name}`}
                >
                   <div className="flex justify-between items-center w-36 mb-1">
                      <span className="text-[9px] uppercase font-bold opacity-70">Low</span>
                      <span className="text-[9px] uppercase font-bold opacity-70 flex items-center gap-1">
                        Influence <Settings2 size={10} className="opacity-50" />
                      </span>
                      <span className="text-[9px] uppercase font-bold opacity-70">High</span>
                   </div>
                   <div 
                      className="w-36 h-2 rounded-full shadow-inner ring-1 ring-white/10 hover:ring-white/30 transition-all"
                      style={{ background: activeColorScheme.gradient }}
                   ></div>
                </div>

                {/* Slider for Exponent */}
                <div className="flex items-center gap-2 w-36 group-hover:opacity-100 opacity-60 transition-opacity">
                   <span className="text-[8px] font-mono opacity-50">SENSITIVITY</span>
                   <input 
                      type="range" 
                      min="0.1" 
                      max="1.5" 
                      step="0.1" 
                      value={colorExponent}
                      onChange={(e) => setColorExponent(parseFloat(e.target.value))}
                      className="w-full h-1 bg-gray-400/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      title={`Adjust Scale Exponent: ${colorExponent}`}
                   />
                </div>
            </div>

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
        <GraphView 
          data={currentGraph} 
          language={displayLanguage} 
          theme={theme}
          colorScheme={activeColorScheme.id}
          colorExponent={colorExponent}
          layoutStrategy={layoutStrategy}
        />

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