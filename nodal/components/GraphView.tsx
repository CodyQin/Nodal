import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  select, 
  zoom, 
  zoomIdentity, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCollide, 
  forceX, 
  forceY, 
  forceRadial,
  interpolateRgbBasis, 
  interpolateRdYlGn,
  interpolateRdBu,
  interpolateViridis,
  scalePow,
  drag, 
  color as d3Color, 
  extent 
} from 'd3';
import { GraphData } from '../types';
import { X, RotateCcw, MousePointer2, Activity, Zap, Info, ExternalLink, Move, MousePointerClick, Search, Download, Calendar, MessageSquare, Palette, Sliders, Bot, Languages, Sun, Moon, GitGraph, Share2, CircleDot } from 'lucide-react';

interface GraphViewProps {
  data: GraphData;
  language: 'original' | 'en';
  theme: 'dark' | 'light';
  colorScheme: string;
  colorExponent: number;
  layoutStrategy: 'force' | 'hierarchical' | 'circular';
}

const GraphView: React.FC<GraphViewProps> = ({ data, language, theme, colorScheme, colorExponent, layoutStrategy }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [resetKey, setResetKey] = useState(0);
  const [showGuide, setShowGuide] = useState(false); // Toggle for the help panel

  const [selectedElement, setSelectedElement] = useState<{ 
    type: 'node' | 'edge';
    data: any;
    x: number;
    y: number;
  } | null>(null);

  // Using any for d3 types to avoid namespace import issues
  const zoomRef = useRef<any>(null);
  const svgSelectionRef = useRef<any>(null);
  const simulationRef = useRef<any>(null);

  const isDark = theme === 'dark';

  const getText = (obj: any, field: string) => {
    const key = language === 'en' ? `${field}_en` : `${field}_original`;
    return obj[key] || obj[field] || "";
  };

  const getRelativePosition = (event: any) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const getLinkWidth = (weight: number, isHighlighted: boolean = false) => {
    const baseWidth = Math.sqrt((weight || 0.5) * 12) + 1.5; 
    return isHighlighted ? baseWidth * 1.8 : baseWidth;
  };

  const getStrengthDescription = (weight: number) => {
    if (weight < 0.2) return "Tenuous Connection";
    if (weight < 0.4) return "Weak Bond";
    if (weight < 0.6) return "Moderate Relationship";
    if (weight < 0.8) return "Strong Bond";
    return "Inseparable / Intense";
  };

  // Helper to ensure edges are never pure black
  const getSafeEdgeColor = (color: string | undefined) => {
    const defaultColor = isDark ? "#94a3b8" : "#64748b"; // Slate-400 (dark mode) / Slate-500 (light mode)
    if (!color) return defaultColor;
    
    // Normalize and check for black
    const c = color.toLowerCase();
    if (c === '#000000' || c === 'black' || c === '#000') {
      return isDark ? "#475569" : "#334155"; // Dark gray instead of black
    }
    return color;
  };

  // Compute stats and neighbors
  const processedData = useMemo(() => {
    const nodes = data.nodes.map(d => ({ ...d, degree: 0 }));
    const links = data.edges.map(d => ({ ...d }));
    
    const neighbors = new Map<string, Set<string>>();

    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode) sourceNode.degree = (sourceNode.degree || 0) + 1;
      if (targetNode) targetNode.degree = (targetNode.degree || 0) + 1;

      if (!neighbors.has(link.source as string)) neighbors.set(link.source as string, new Set());
      if (!neighbors.has(link.target as string)) neighbors.set(link.target as string, new Set());
      neighbors.get(link.source as string)?.add(link.target as string);
      neighbors.get(link.target as string)?.add(link.source as string);
    });

    // Determine max centrality for scaling color
    const maxCentrality = Math.max(...nodes.map(n => n.centrality), 0.01);

    return { nodes, links, neighbors, maxCentrality };
  }, [data, resetKey]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !processedData.nodes.length) return;

    select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const nodes = processedData.nodes.map(d => ({ ...d }));
    const links = processedData.links.map(d => ({ ...d }));

    // Prepare Hierarchical Data if needed (BFS Levels)
    if (layoutStrategy === 'hierarchical') {
       const visited = new Set<string>();
       const queue: { id: string; depth: number }[] = [];
       
       // Start BFS from the node with highest centrality (root approximation)
       const sortedNodes = [...nodes].sort((a, b) => b.centrality - a.centrality);
       
       sortedNodes.forEach(rootCand => {
         if (!visited.has(rootCand.id)) {
           queue.push({ id: rootCand.id, depth: 0 });
           visited.add(rootCand.id);
           
           while (queue.length > 0) {
             const { id, depth } = queue.shift()!;
             const node = nodes.find(n => n.id === id);
             if (node) (node as any).depth = depth;
             
             const neighborIds = processedData.neighbors.get(id);
             if (neighborIds) {
               neighborIds.forEach(nid => {
                 if (!visited.has(nid)) {
                   visited.add(nid);
                   queue.push({ id: nid, depth: depth + 1 });
                 }
               });
             }
           }
         }
       });
    }

    const svg = select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");
    
    svgSelectionRef.current = svg;

    // Define Gradients for Bubble Effect
    const defs = svg.append("defs");
    
    // Create a generic highlight gradient
    const radialGradient = defs.append("radialGradient")
        .attr("id", "bubble-shine")
        .attr("cx", "30%")
        .attr("cy", "30%")
        .attr("r", "70%");
    
    radialGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#fff")
        .attr("stop-opacity", 0.4);

    radialGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#fff")
        .attr("stop-opacity", 0);

    const g = svg.append("g");

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8]) 
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    // --- Layout Strategy Implementation ---
    const simulation = forceSimulation(nodes);

    // Common forces to prevent overlap
    simulation.force("charge", forceManyBody().strength((d: any) => -300 - (d.degree * 20)));
    simulation.force("collide", forceCollide().radius((d: any) => (d.visual?.size || 20) + 15).iterations(2));

    if (layoutStrategy === 'force') {
       simulation
         .force("link", forceLink(links).id((d: any) => d.id).distance(120))
         .force("x", forceX(width / 2).strength(0.08)) 
         .force("y", forceY(height / 2).strength(0.12));

    } else if (layoutStrategy === 'hierarchical') {
       // Pull nodes to Y-position based on BFS depth
       simulation
         .force("link", forceLink(links).id((d: any) => d.id).distance(80))
         .force("x", forceX(width / 2).strength(0.3)) // Keep centered horizontally
         .force("y", forceY((d: any) => {
            const depth = (d.depth || 0);
            return (height * 0.15) + (depth * 120); // Top-down flow
         }).strength(2)); // Strong pull to layers

    } else if (layoutStrategy === 'circular') {
       const radius = Math.min(width, height) * 0.35;
       simulation
         // Link force is weak just to keep related nodes vaguely near, but ring is primary
         .force("link", forceLink(links).id((d: any) => d.id).distance(50).strength(0.2)) 
         .force("radial", forceRadial(radius, width / 2, height / 2).strength(0.8));
    }

    simulationRef.current = simulation;

    // Silent Tick
    simulation.stop(); 
    const initialTicks = 120;
    for (let i = 0; i < initialTicks; ++i) simulation.tick();

    // --- Dynamic Heatmap Color Scale ---
    const normScale = scalePow()
      .exponent(colorExponent) // User-adjustable sensitivity
      .domain([0, processedData.maxCentrality || 1])
      .range([0, 1]);

    const getColor = (val: number) => {
      const t = normScale(val);
      switch(colorScheme) {
        case 'RdYlGn_r': return interpolateRdYlGn(1 - t); 
        case 'RdBu_r': return interpolateRdBu(1 - t);
        case 'Viridis_r': return interpolateViridis(1 - t);
        case 'Classic':
        default: return interpolateRgbBasis(["#3b82f6", "#a855f7", "#ef4444"])(t);
      }
    };

    // --- Render Links ---
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => getSafeEdgeColor(d.visual?.color))
      .attr("stroke-opacity", 0.6) 
      .attr("stroke-width", (d: any) => getLinkWidth(d.visual?.weight))
      .attr("class", "transition-all duration-200") 
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        const { x, y } = getRelativePosition(event);
        setSelectedElement({ type: 'edge', data: d, x, y });
      });

    // --- Render Nodes (Bubble Style) ---
    const nodeGroup = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Layer 1: Base Circle (Color + Drop Shadow)
    nodeGroup.append("circle")
      .attr("r", (d: any) => (d.visual?.size || 10) + (Math.sqrt(d.degree) * 2)) 
      .attr("fill", (d: any) => getColor(d.centrality))
      .attr("stroke", isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)")
      .attr("stroke-width", 1.5)
      .style("filter", isDark 
         ? "drop-shadow(0 0 6px rgba(0, 0, 0, 0.6))" 
         : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))"
      );

    // Layer 2: Shine/Gloss Effect (Gradient Overlay)
    nodeGroup.append("circle")
      .attr("r", (d: any) => (d.visual?.size || 10) + (Math.sqrt(d.degree) * 2))
      .attr("fill", "url(#bubble-shine)")
      .style("pointer-events", "none"); 

    // Interaction Events (Attached to the group)
    nodeGroup
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        const { x, y } = getRelativePosition(event);
        setSelectedElement({ type: 'node', data: d, x, y });
      })
      .on("mouseenter", function(event, d: any) {
        const connectedNodeIds = processedData.neighbors.get(d.id);
        
        // Dim others
        nodeGroup.transition().duration(200)
          .style("opacity", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) ? 1 : 0.1
          );
        
        text.transition().duration(200)
          .style("opacity", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) ? 1 : 0.1
          );

        link.transition().duration(200)
          .style("opacity", (l: any) => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15 
          )
          .attr("stroke", (l: any) => getSafeEdgeColor(l.visual?.color)) 
          .attr("stroke-width", (l: any) => {
             const isConnected = l.source.id === d.id || l.target.id === d.id;
             return getLinkWidth(l.visual?.weight, isConnected);
          });
      })
      .on("mouseleave", function() {
        nodeGroup.transition().duration(200).style("opacity", 1);
        text.transition().duration(200).style("opacity", 1);
        link.transition().duration(200)
          .style("opacity", 1)
          .attr("stroke-opacity", 0.6) 
          .attr("stroke", (d: any) => getSafeEdgeColor(d.visual?.color))
          .attr("stroke-width", (d: any) => getLinkWidth(d.visual?.weight, false));
      });

    // --- Render Labels ---
    const text = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => getText(d, 'label'))
      .attr("font-size", (d: any) => 10 + Math.sqrt(d.degree))
      .attr("fill", isDark ? "#e2e8f0" : "#0f172a") 
      .attr("dx", (d: any) => (d.visual?.size || 10) + 8)
      .attr("dy", 4)
      .style("pointer-events", "none")
      .style("text-shadow", isDark 
          ? "0 2px 4px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,1)"
          : "0 1px 2px rgba(255,255,255,0.8), 0 0 3px rgba(255,255,255,1)"
      ); 

    // --- Link Hover Logic ---
    link
      .on("mouseenter", function(event, d: any) {
         const sId = d.source.id;
         const tId = d.target.id;
         
         // Highlight specific link
         select(this)
            .attr("stroke-opacity", 1)
            .attr("stroke-width", getLinkWidth(d.visual?.weight, true));

         // Dim other links
         link.transition().duration(200)
            .style("opacity", (l: any) => l === d ? 1 : 0.1);

         // Highlight connected nodes, dim others
         nodeGroup.transition().duration(200)
            .style("opacity", (n: any) => (n.id === sId || n.id === tId) ? 1 : 0.1);
            
         text.transition().duration(200)
            .style("opacity", (n: any) => (n.id === sId || n.id === tId) ? 1 : 0.1);
      })
      .on("mouseleave", function(event, d: any) {
         // Reset this link style
         select(this)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", getLinkWidth(d.visual?.weight, false));

         // Reset all opacities
         link.transition().duration(200).style("opacity", 1);
         nodeGroup.transition().duration(200).style("opacity", 1);
         text.transition().duration(200).style("opacity", 1);
      });
      
    updatePositions(); 
    
    // Fit To Screen
    const xExtent = extent(nodes, (d: any) => d.x) as [number, number];
    const yExtent = extent(nodes, (d: any) => d.y) as [number, number];
    
    if (xExtent[0] !== undefined && yExtent[0] !== undefined) {
      const graphWidth = xExtent[1] - xExtent[0];
      const graphHeight = yExtent[1] - yExtent[0];
      let scale = 0.9 / Math.max(graphWidth / width, graphHeight / height);
      scale = Math.min(scale, 1.2); 
      
      const centerX = (xExtent[0] + xExtent[1]) / 2;
      const centerY = (yExtent[0] + yExtent[1]) / 2;
      
      const transform = zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-centerX, -centerY);

      svg.transition().duration(1000).call(zoomBehavior.transform, transform);
    }

    simulation.alpha(0.3).restart();
    simulation.on("tick", updatePositions);

    function updatePositions() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      text
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    }

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      select(svgRef.current).style("cursor", "grabbing");
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      select(svgRef.current).style("cursor", "grab");
    }

    svg.on("click", () => setSelectedElement(null));

    return () => {
      simulation.stop();
    };

  }, [processedData, language, resetKey, theme, colorScheme, colorExponent, layoutStrategy]);

  const handleResetLayout = () => {
    setSelectedElement(null);
    setResetKey(prev => prev + 1);
  };

  const getPanelPosition = () => {
    if (!selectedElement || !containerRef.current) return {};
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const { x, y } = selectedElement;
    const isRight = x > containerWidth / 2;
    const isBottom = y > containerHeight / 2;
    const offset = 20;
    return {
      left: isRight ? undefined : x + offset,
      right: isRight ? containerWidth - x + offset : undefined,
      top: isBottom ? undefined : y + offset,
      bottom: isBottom ? containerHeight - y + offset : undefined,
    };
  };

  // Popup Panel Theme Classes
  const panelClasses = isDark 
    ? "bg-black/80 border-white/20 text-white shadow-2xl backdrop-blur-md" 
    : "bg-white/90 border-slate-200 text-slate-800 shadow-xl backdrop-blur-md";
  
  const panelTextSecondary = isDark ? "text-gray-400" : "text-slate-500";
  const panelTextDesc = isDark ? "text-gray-200" : "text-slate-600";
  const badgeBg = isDark ? "bg-white/10 text-gray-200" : "bg-slate-100 text-slate-600";
  const hotBadgeBg = isDark ? "bg-purple-500/30 text-purple-200" : "bg-orange-100 text-orange-700";

  return (
    <div className={`relative w-full h-full overflow-hidden select-none transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full block"></svg>

      {/* Graph Guide Trigger Button - Replaces static legend */}
      <button 
        onClick={() => setShowGuide(!showGuide)}
        className={`absolute top-20 left-4 z-40 px-3 py-2 rounded-lg border backdrop-blur-md flex items-center gap-2 shadow-lg transition-all active:scale-95 ${isDark ? 'bg-black/30 border-white/10 text-white hover:bg-white/10' : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white/80'}`}
      >
         <Info size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
         <span className="text-xs font-semibold uppercase tracking-wide">Graph Guide</span>
      </button>

      {/* Graph Guide Modal/Panel */}
      {showGuide && (
         <div className={`absolute top-32 left-4 z-50 w-80 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-left-4 fade-in duration-300 flex flex-col ${isDark ? 'bg-black/80 border-white/20' : 'bg-white/95 border-slate-200'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
               <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                 <Activity size={16} className="text-blue-500" />
                 Graph Visualization Guide
               </h3>
               <button onClick={() => setShowGuide(false)} className={`transition-opacity hover:opacity-100 opacity-60 ${isDark ? 'text-white' : 'text-slate-600'}`}>
                 <X size={16} />
               </button>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
               
               {/* Section 1: Features Overview */}
               <div className="space-y-3">
                  <h4 className={`text-xs uppercase tracking-wider font-bold opacity-70 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Core Features</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                     <div className={`p-2 rounded border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`flex items-center gap-2 font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}><Download size={14} className="text-blue-500" /> Download</div>
                        <p className={`text-[10px] leading-tight ${panelTextSecondary}`}>Save analysis as JSON. You can re-upload this file later to reproduce results instantly.</p>
                     </div>
                     <div className={`p-2 rounded border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`flex items-center gap-2 font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}><Calendar size={14} className="text-blue-500" /> Timeline</div>
                        <p className={`text-[10px] leading-tight ${panelTextSecondary}`}>Use the bottom bar to navigate story phases or view the full "Overview" graph.</p>
                     </div>
                     <div className={`p-2 rounded border col-span-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`flex items-center gap-2 font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}><Bot size={14} className="text-blue-500" /> AI Chat</div>
                        <p className={`text-[10px] leading-tight ${panelTextSecondary}`}>Ask questions about the plot, characters, or hidden relationships. The AI uses the active graph data as context.</p>
                     </div>
                  </div>
               </div>

               {/* Section 1.5: Layout Strategies (New) */}
               <div className="space-y-3">
                  <h4 className={`text-xs uppercase tracking-wider font-bold opacity-70 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Layout Strategies</h4>
                  <div className={`flex flex-col gap-2 text-xs ${panelTextSecondary}`}>
                     <div className={`p-2 rounded border flex flex-col gap-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex items-center gap-2 font-semibold text-blue-500">
                             <Share2 size={12} /> Force-Directed
                         </div>
                         <p className="text-[10px] leading-normal">
                             Simulates physical forces (gravity, repulsion). Good for general clusters and organic connections. <a href="https://en.wikipedia.org/wiki/Force-directed_graph_drawing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Learn more</a>.
                         </p>
                     </div>
                     <div className={`p-2 rounded border flex flex-col gap-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex items-center gap-2 font-semibold text-blue-500">
                             <GitGraph size={12} /> Hierarchical
                         </div>
                         <p className="text-[10px] leading-normal">
                             Arranges nodes in layers to show flow or influence. Central characters appear at the top. <a href="https://en.wikipedia.org/wiki/Layered_graph_drawing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Learn more</a>.
                         </p>
                     </div>
                     <div className={`p-2 rounded border flex flex-col gap-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex items-center gap-2 font-semibold text-blue-500">
                             <CircleDot size={12} /> Circular
                         </div>
                         <p className="text-[10px] leading-normal">
                             Places nodes on a ring. Useful for highlighting network density and distinct communities. <a href="https://en.wikipedia.org/wiki/Circular_layout" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Learn more</a>.
                         </p>
                     </div>
                  </div>
               </div>

               {/* Section 3: Visual Encoding & Customization */}
               <div className="space-y-3">
                  <h4 className={`text-xs uppercase tracking-wider font-bold opacity-70 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Visual Encoding</h4>
                  
                  {/* Color Controls Info */}
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                     <div className="flex justify-between items-center text-xs mb-2">
                        <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
                           <Palette size={14} className="text-purple-500" />
                           Node Influence
                        </span>
                     </div>
                     <div className={`text-[11px] mb-2 ${panelTextSecondary}`}>
                        Nodes are colored by <a href="https://en.wikipedia.org/wiki/Betweenness_centrality" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 font-bold">Betweenness Centrality</a> (how vital they are as bridges).
                     </div>
                     
                     <div className="space-y-2">
                        <div className={`text-[10px] p-2 rounded flex items-start gap-2 ${isDark ? 'bg-black/20 text-gray-300' : 'bg-white border text-slate-600'}`}>
                           <MousePointerClick size={12} className="mt-0.5 opacity-50" />
                           <span>
                              <strong>Click the color bar</strong> in the top header to cycle schemes (e.g., Traffic, Heat, Viridis).
                           </span>
                        </div>
                        <div className={`text-[10px] p-2 rounded flex items-start gap-2 ${isDark ? 'bg-black/20 text-gray-300' : 'bg-white border text-slate-600'}`}>
                           <Sliders size={12} className="mt-0.5 opacity-50" />
                           <span>
                              Use the <strong>Sensitivity Slider</strong> below the color bar to adjust contrast. Lower values make colors "hotter" faster.
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Size Legend */}
                  <div className={`p-3 rounded-lg border flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                     <div className="flex items-end gap-1 px-1">
                        <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                        <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                     </div>
                     <div>
                        <div className="flex justify-between items-center text-xs">
                           <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>Size = Connections</span>
                        </div>
                        <p className={`text-[10px] leading-tight ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                           (<a href="https://en.wikipedia.org/wiki/Degree_(graph_theory)" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">Degree Centrality</a>)
                        </p>
                     </div>
                  </div>
               </div>

               {/* Section 4: Navigation */}
               <div className="space-y-3">
                  <h4 className={`text-xs uppercase tracking-wider font-bold opacity-70 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Navigation</h4>
                  <div className={`grid grid-cols-2 gap-2 text-[11px] ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                     <div className="flex items-center gap-2">
                        <Move size={12} className="text-blue-500" /> Pan / Drag Graph
                     </div>
                     <div className="flex items-center gap-2">
                        <Search size={12} className="text-blue-500" /> Scroll to Zoom
                     </div>
                     <div className="flex items-center gap-2 col-span-2">
                        <MousePointerClick size={12} className="text-blue-500" /> Click nodes/edges for details
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Info Panel for Selected Element */}
      {selectedElement && (
        <div 
          className={`absolute z-50 max-w-xs rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200 border ${panelClasses}`}
          style={getPanelPosition()}
        >
          <button 
            onClick={() => setSelectedElement(null)} 
            className={`absolute top-2 right-2 hover:opacity-100 transition-opacity ${isDark ? 'text-gray-400 opacity-60' : 'text-slate-400 opacity-60'}`}
          >
            <X size={16} />
          </button>
          
          {selectedElement.type === 'node' ? (
            <>
              <h2 className={`text-xl font-bold mb-1 pr-6 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                 {getText(selectedElement.data, 'label')}
              </h2>
              
              <div className="mb-3 grid grid-cols-2 gap-2 mt-2">
                <div className={`flex flex-col p-2 rounded ${badgeBg}`}>
                    <span className={`text-[9px] uppercase tracking-wider opacity-70`}>Connections (Size)</span>
                    <span className="text-sm font-mono font-bold">
                        {processedData.nodes.find(n => n.id === selectedElement.data.id)?.degree || 0}
                    </span>
                </div>
                <div className={`flex flex-col p-2 rounded ${hotBadgeBg}`}>
                    <span className={`text-[9px] uppercase tracking-wider opacity-70 flex items-center gap-1`}>
                       <Zap size={10} /> Influence (Color)
                    </span>
                    <span className="text-sm font-mono font-bold">
                        {(selectedElement.data.centrality || 0).toFixed(3)}
                    </span>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                <p className={`text-xs leading-relaxed ${panelTextDesc}`}>{getText(selectedElement.data, 'description')}</p>
              </div>
            </>
          ) : (
            <>
              {/* Header: Color dot + Title */}
              <div className="flex items-center gap-2 mb-3 pr-6">
                <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px]" style={{backgroundColor: getSafeEdgeColor(selectedElement.data.visual.color), boxShadow: `0 0 8px ${getSafeEdgeColor(selectedElement.data.visual.color)}`}}></span>
                <div>
                   <h2 className="text-md font-bold leading-tight">{getText(selectedElement.data.relation, 'label')}</h2>
                   <p className={`text-[10px] uppercase ${panelTextSecondary}`}>{getText(selectedElement.data.relation, 'type')}</p>
                </div>
              </div>

               {/* Strength Meter */}
               <div className={`mb-3 p-2.5 rounded-lg border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${panelTextSecondary}`}>
                      <Activity size={12} />
                      Connection Strength
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                      {getStrengthDescription(selectedElement.data.visual.weight)}
                    </span>
                  </div>
                  {/* Discrete Bars Visual */}
                  <div className="flex gap-1 h-1.5">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold) => (
                      <div 
                        key={threshold}
                        className={`flex-1 rounded-sm transition-all duration-300 ${
                          (selectedElement.data.visual.weight || 0) >= (threshold - 0.15)
                            ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]' 
                            : (isDark ? 'bg-gray-700/50' : 'bg-slate-300/50')
                        }`}
                      />
                    ))}
                  </div>
               </div>

              <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                <p className={`text-xs leading-relaxed ${panelTextDesc}`}>{getText(selectedElement.data.relation, 'description')}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reset Layout Button */}
      <button 
        onClick={handleResetLayout}
        className={`absolute bottom-8 right-8 z-40 p-3 rounded-full transition-all shadow-lg group border backdrop-blur-md ${isDark ? 'bg-black/30 border-white/10 text-white hover:bg-white/10' : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
        title="Reset & Refit Layout"
      >
        <RotateCcw className="group-hover:-rotate-180 transition-transform duration-500" />
      </button>

      {/* Helper Tip */}
      {!selectedElement && (
        <div className={`absolute top-24 right-6 z-40 px-4 py-2 rounded-full flex items-center gap-2 text-xs pointer-events-none opacity-80 border shadow-lg backdrop-blur-md ${isDark ? 'border-white/5 bg-black/20 text-gray-400' : 'border-slate-200 bg-white/60 text-slate-500'}`}>
          <MousePointer2 size={14} className="text-blue-400" />
          <span>Hover nodes to highlight, click for details</span>
        </div>
      )}
    </div>
  );
};

export default GraphView;