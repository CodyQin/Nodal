import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphData, Node, Edge } from '../types';
import { Info, X, RotateCcw, MousePointer2, Activity } from 'lucide-react';

interface GraphViewProps {
  data: GraphData;
  language: 'original' | 'en';
  theme: 'dark' | 'light';
}

const GraphView: React.FC<GraphViewProps> = ({ data, language, theme }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [resetKey, setResetKey] = useState(0);

  const [selectedElement, setSelectedElement] = useState<{ 
    type: 'node' | 'edge';
    data: any;
    x: number;
    y: number;
  } | null>(null);

  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

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

    return { nodes, links, neighbors };
  }, [data, resetKey]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !processedData.nodes.length) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const nodes = processedData.nodes.map(d => ({ ...d }));
    const links = processedData.links.map(d => ({ ...d }));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .style("cursor", "grab");
    
    svgSelectionRef.current = svg;

    const defs = svg.append("defs");

    // --- Node Gradients (Theme Aware) ---
    // Dark Mode: Sky-200 -> Blue-500 -> Blue-900
    // Light Mode: White/Sky-50 -> Sky-300 -> Sky-600
    const nodeGradient = defs.append("radialGradient")
      .attr("id", "nodeGradient")
      .attr("cx", "30%") 
      .attr("cy", "30%")
      .attr("r", "70%");

    nodeGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", isDark ? "#bae6fd" : "#f0f9ff") // sky-200 / sky-50
      .attr("stop-opacity", 1);

    nodeGradient.append("stop")
      .attr("offset", "60%")
      .attr("stop-color", isDark ? "#3b82f6" : "#7dd3fc") // blue-500 / sky-300
      .attr("stop-opacity", 1);

    nodeGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", isDark ? "#1e3a8a" : "#0284c7") // blue-900 / sky-600
      .attr("stop-opacity", 1);

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8]) 
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength((d: any) => -300 - (d.degree * 20)))
      .force("collide", d3.forceCollide().radius((d: any) => (d.visual?.size || 20) + 15).iterations(2))
      .force("x", d3.forceX(width / 2).strength(0.08)) 
      .force("y", d3.forceY(height / 2).strength(0.12));

    simulationRef.current = simulation;

    // Silent Tick
    simulation.stop(); 
    const initialTicks = 120;
    for (let i = 0; i < initialTicks; ++i) simulation.tick();

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
      })
      .on("mouseenter", function() {
          d3.select(this).attr("stroke-opacity", 1);
      })
      .on("mouseleave", function() {
          d3.select(this).attr("stroke-opacity", 0.6);
      });

    // --- Render Nodes ---
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => (d.visual?.size || 10) + (Math.sqrt(d.degree) * 2)) 
      .attr("fill", "url(#nodeGradient)") 
      .attr("stroke", isDark ? "#93c5fd" : "#0ea5e9") // sky-300 / sky-500
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8)
      .style("filter", isDark 
         ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))" 
         : "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))"
      ) 
      .style("cursor", "pointer")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        event.stopPropagation();
        const { x, y } = getRelativePosition(event);
        setSelectedElement({ type: 'node', data: d, x, y });
      });

    // --- Render Labels ---
    const text = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => getText(d, 'label'))
      .attr("font-size", (d: any) => 10 + Math.sqrt(d.degree))
      .attr("fill", isDark ? "#e2e8f0" : "#0f172a") // slate-200 / slate-900
      .attr("dx", (d: any) => (d.visual?.size || 10) + 8)
      .attr("dy", 4)
      .style("pointer-events", "none")
      // Only use strong shadow in dark mode, light mode gets a white halo for contrast
      .style("text-shadow", isDark 
          ? "0 2px 4px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,1)"
          : "0 1px 2px rgba(255,255,255,0.8), 0 0 3px rgba(255,255,255,1)"
      ); 
      
    updatePositions(); 
    
    // Fit To Screen
    const xExtent = d3.extent(nodes, (d: any) => d.x) as [number, number];
    const yExtent = d3.extent(nodes, (d: any) => d.y) as [number, number];
    
    if (xExtent[0] !== undefined && yExtent[0] !== undefined) {
      const graphWidth = xExtent[1] - xExtent[0];
      const graphHeight = yExtent[1] - yExtent[0];
      let scale = 0.9 / Math.max(graphWidth / width, graphHeight / height);
      scale = Math.min(scale, 1.2); 
      
      const centerX = (xExtent[0] + xExtent[1]) / 2;
      const centerY = (yExtent[0] + yExtent[1]) / 2;
      
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-centerX, -centerY);

      svg.transition().duration(1000).call(zoom.transform, transform);
    }

    simulation.alpha(0.1).restart();
    simulation.on("tick", updatePositions);

    function updatePositions() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      text
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    }

    // --- Hover Highlight Logic ---
    node
      .on("mouseenter", function(event, d: any) {
        const connectedNodeIds = processedData.neighbors.get(d.id);
        
        node.transition().duration(200)
          .style("opacity", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) ? 1 : 0.1
          )
          .style("filter", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) 
              ? (isDark ? "drop-shadow(0 0 10px rgba(96, 165, 250, 0.9))" : "drop-shadow(0 0 6px rgba(14, 165, 233, 0.6))")
              : "none"
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
        node.transition().duration(200)
          .style("opacity", 1)
          .style("filter", isDark 
            ? "drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))" 
            : "drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2))"
          );

        text.transition().duration(200).style("opacity", 1);
        link.transition().duration(200)
          .style("opacity", 1)
          .attr("stroke-opacity", 0.6) 
          .attr("stroke", (d: any) => getSafeEdgeColor(d.visual?.color))
          .attr("stroke-width", (d: any) => getLinkWidth(d.visual?.weight, false));
      });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      d3.select(svgRef.current).style("cursor", "grabbing");
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
      d3.select(svgRef.current).style("cursor", "grab");
    }

    svg.on("click", () => setSelectedElement(null));

    return () => {
      simulation.stop();
    };

  }, [processedData, language, resetKey, theme]); // Added theme dependency

  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);

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
    ? "bg-black/60 border-white/10 text-white shadow-2xl backdrop-blur-md" 
    : "bg-white/80 border-slate-200 text-slate-800 shadow-xl backdrop-blur-md";
  
  const panelTextSecondary = isDark ? "text-gray-400" : "text-slate-500";
  const panelTextDesc = isDark ? "text-gray-200" : "text-slate-600";
  const badgeBg = isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700";

  return (
    <div className={`relative w-full h-full overflow-hidden select-none transition-colors duration-500 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`} ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full block"></svg>

      {/* Info Panel */}
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
              <h2 className={`text-xl font-bold mb-1 pr-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{getText(selectedElement.data, 'label')}</h2>
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider ${panelTextSecondary}`}>Degree</span>
                <span className={`text-xs font-mono px-1.5 rounded ${badgeBg}`}>
                  {processedData.nodes.find(n => n.id === selectedElement.data.id)?.degree || 0}
                </span>
                <span className={`text-[10px] uppercase tracking-wider ml-2 ${panelTextSecondary}`}>Centrality</span>
                <span className={`text-xs font-mono ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{selectedElement.data.centrality}</span>
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