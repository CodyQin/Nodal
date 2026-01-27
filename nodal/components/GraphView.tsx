import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, Node, Edge } from '../types';
import { Info, X, RotateCcw } from 'lucide-react';

interface GraphViewProps {
  data: GraphData;
  language: 'original' | 'en';
}

const GraphView: React.FC<GraphViewProps> = ({ data, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update state to include position
  const [selectedElement, setSelectedElement] = useState<{ 
    type: 'node' | 'edge';
    data: any;
    x: number;
    y: number;
  } | null>(null);

  // Refs to control D3 from outside
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const textSelectionRef = useRef<d3.Selection<SVGTextElement, unknown, any, unknown> | null>(null);

  // Helper to get text based on current language
  const getText = (obj: any, field: string) => {
    const key = language === 'en' ? `${field}_en` : `${field}_original`;
    // Fallback to original if en not available, or just field if schema is old
    return obj[key] || obj[field] || "";
  };

  // Helper to get click coordinates relative to container
  const getRelativePosition = (event: any) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  // 1. Initialize Simulation (Re-run only when DATA changes)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.nodes.length) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Create a deep copy to prevent D3 from mutating original React state props directly
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.edges.map(d => ({ ...d }));

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
    
    svgSelectionRef.current = svg;

    // Add a group for zooming
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Force Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (d.visual?.size || 20) + 10));
    
    simulationRef.current = simulation;

    // Render Links
    const link = g.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => d.visual?.color || "#94a3b8")
      .attr("stroke-width", (d: any) => Math.sqrt((d.visual?.weight || 0.5) * 10) + 1)
      .attr("class", "cursor-pointer transition-all hover:stroke-white")
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        const { x, y } = getRelativePosition(event);
        setSelectedElement({ type: 'edge', data: d, x, y });
      });

    // Render Nodes
    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => d.visual?.size || 10)
      .attr("fill", (d: any) => "#3b82f6") 
      .attr("class", "cursor-pointer hover:brightness-110 transition-all shadow-lg")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any)
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        const { x, y } = getRelativePosition(event);
        setSelectedElement({ type: 'node', data: d, x, y });
      });

    // Render Labels (Initial)
    const text = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      // We set initial text here, but it will be updated by the language effect immediately
      .text("") 
      .attr("font-size", 12)
      .attr("fill", "#e2e8f0")
      .attr("dx", 15)
      .attr("dy", 4)
      .style("pointer-events", "none")
      .style("text-shadow", "2px 2px 4px #000");
    
    textSelectionRef.current = text as any;

    // Simulation Tick
    simulation.on("tick", () => {
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
    });

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    // Background click deselects
    svg.on("click", () => {
      setSelectedElement(null);
    });

    return () => {
      simulation.stop();
    };
  }, [data]); // Run only when data structure changes (e.g. Phase Switch)

  // 2. Update Labels (Runs when Language changes OR Data changes)
  useEffect(() => {
    if (textSelectionRef.current) {
       textSelectionRef.current.text((d: any) => getText(d, 'label'));
    }
  }, [language, data]); 

  const handleResetLayout = () => {
    if (!svgSelectionRef.current || !zoomRef.current || !simulationRef.current) return;
    
    // 1. Reset Zoom to Identity (center) with transition
    svgSelectionRef.current.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);

    // 2. Unpin all nodes to let force layout reorganize
    simulationRef.current.nodes().forEach((n: any) => {
      n.fx = null;
      n.fy = null;
    });

    // 3. Re-heat simulation
    simulationRef.current.alpha(1).restart();
  };

  // Calculate position logic for Floating Info Panel
  const getPanelPosition = () => {
    if (!selectedElement || !containerRef.current) return {};
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const { x, y } = selectedElement;

    const isRight = x > containerWidth / 2;
    const isBottom = y > containerHeight / 2;
    
    // Offset to prevent cursor overlap
    const offset = 20;

    return {
      left: isRight ? undefined : x + offset,
      right: isRight ? containerWidth - x + offset : undefined,
      top: isBottom ? undefined : y + offset,
      bottom: isBottom ? containerHeight - y + offset : undefined,
    };
  };

  return (
    <div className="relative w-full h-full bg-nodal-dark overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full"></svg>

      {/* Floating Info Panel */}
      {selectedElement && (
        <div 
          className="absolute z-50 max-w-xs glass rounded-xl p-4 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={getPanelPosition()}
        >
          <button 
            onClick={() => setSelectedElement(null)} 
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
          
          {selectedElement.type === 'node' ? (
            <>
              <h2 className="text-xl font-bold text-blue-400 mb-1 pr-6">{getText(selectedElement.data, 'label')}</h2>
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-400">Degree: </span>
                <span className="text-sm font-mono text-gray-200">{selectedElement.data.centrality}</span>
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                <p className="text-xs leading-relaxed text-gray-200">{getText(selectedElement.data, 'description')}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: selectedElement.data.visual.color}}></span>
                <div>
                   <h2 className="text-md font-bold leading-tight">{getText(selectedElement.data.relation, 'label')}</h2>
                   <p className="text-[10px] text-gray-400 uppercase">{getText(selectedElement.data.relation, 'type')}</p>
                </div>
              </div>
               <div className="mb-2">
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${selectedElement.data.visual.weight * 100}%` }}></div>
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                <p className="text-xs leading-relaxed text-gray-200">{getText(selectedElement.data.relation, 'description')}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reset Layout Button - Bottom Right */}
      <button 
        onClick={handleResetLayout}
        className="absolute bottom-8 right-8 z-40 glass p-3 rounded-full text-white hover:bg-white/10 transition-all shadow-lg group"
        title="Reset Layout"
      >
        <RotateCcw className="group-hover:rotate-[-180deg] transition-transform duration-500" />
      </button>

      {/* Help Tip - Bottom Left Area */}
      {!selectedElement && (
        <div className="absolute bottom-8 left-8 z-50 glass px-4 py-2 rounded-full flex items-center gap-2 text-sm text-gray-300 pointer-events-none opacity-70">
          <Info size={16} />
          <span>Click on nodes or lines to view details</span>
        </div>
      )}
    </div>
  );
};

export default GraphView;
