import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  
  const [resetKey, setResetKey] = useState(0);

  const [selectedElement, setSelectedElement] = useState<{ 
    type: 'node' | 'edge';
    data: any;
    x: number;
    y: number;
  } | null>(null);

  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

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

    // --- 1. 定义 SVG 渐变和滤镜 (关键步骤) ---
    const defs = svg.append("defs");

    // 创建 "3D 泡泡" 渐变
    const bubbleGradient = defs.append("radialGradient")
      .attr("id", "nodeGradient")
      .attr("cx", "30%") // 高光位置偏左上
      .attr("cy", "30%")
      .attr("r", "70%"); // 扩散半径

    // 高光部分 (亮青色)
    bubbleGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#bae6fd") // tailwind sky-200
      .attr("stop-opacity", 1);

    // 中间过渡 (标准蓝)
    bubbleGradient.append("stop")
      .attr("offset", "60%")
      .attr("stop-color", "#3b82f6") // tailwind blue-500
      .attr("stop-opacity", 1);

    // 边缘阴影 (深蓝)
    bubbleGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#1e3a8a") // tailwind blue-900
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

    // --- 渲染连线 ---
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => d.visual?.color || "#94a3b8")
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

    // --- 渲染节点 (修改为泡泡外观) ---
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d: any) => (d.visual?.size || 10) + (Math.sqrt(d.degree) * 2)) 
      // [修改点] 使用 url(#nodeGradient) 引用上面定义的渐变
      .attr("fill", "url(#nodeGradient)") 
      // [修改点] 边框颜色调亮一点，增强通透感
      .attr("stroke", "#93c5fd") 
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8)
      // [修改点] 添加 CSS 阴影发光效果
      .style("filter", "drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))") 
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

    // 渲染标签
    const text = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d: any) => getText(d, 'label'))
      .attr("font-size", (d: any) => 10 + Math.sqrt(d.degree))
      .attr("fill", "#e2e8f0")
      .attr("dx", (d: any) => (d.visual?.size || 10) + 8)
      .attr("dy", 4)
      .style("pointer-events", "none")
      // 文字增加黑色描边，防止在发光背景下看不清
      .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,1)"); 
      
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

    // --- 关联高亮逻辑 ---
    node
      .on("mouseenter", function(event, d: any) {
        const connectedNodeIds = processedData.neighbors.get(d.id);
        
        // 1. 节点变淡/高亮
        node.transition().duration(200)
          .style("opacity", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) ? 1 : 0.1
          )
          // [修改点] 悬停时，相关的节点发光更强（更亮）
          .style("filter", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) 
              ? "drop-shadow(0 0 10px rgba(96, 165, 250, 0.9))"  // 强光
              : "none"
          );
        
        text.transition().duration(200)
          .style("opacity", (n: any) => 
            (n.id === d.id || connectedNodeIds?.has(n.id)) ? 1 : 0.1
          );

        // 2. 线条样式处理
        link.transition().duration(200)
          .style("opacity", (l: any) => 
            (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15 
          )
          .attr("stroke", (l: any) => l.visual?.color || "#94a3b8") 
          .attr("stroke-width", (l: any) => {
             const isConnected = l.source.id === d.id || l.target.id === d.id;
             return getLinkWidth(l.visual?.weight, isConnected);
          });
      })
      .on("mouseleave", function() {
        // 复原
        node.transition().duration(200)
          .style("opacity", 1)
          .style("filter", "drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))"); // 恢复默认微光

        text.transition().duration(200).style("opacity", 1);
        link.transition().duration(200)
          .style("opacity", 1)
          .attr("stroke-opacity", 0.6) 
          .attr("stroke", (d: any) => d.visual?.color || "#94a3b8")
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

  }, [processedData, language, resetKey]); 

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

  return (
    <div className="relative w-full h-full bg-nodal-dark overflow-hidden select-none" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full block"></svg>

      {/* Info Panel */}
      {selectedElement && (
        <div 
          className="absolute z-50 max-w-xs glass rounded-xl p-4 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md bg-black/60 border border-white/10"
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
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-400">Degree</span>
                <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-1.5 rounded">
                  {processedData.nodes.find(n => n.id === selectedElement.data.id)?.degree || 0}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 ml-2">Centrality</span>
                <span className="text-xs font-mono text-gray-300">{selectedElement.data.centrality}</span>
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

      {/* Reset Layout Button */}
      <button 
        onClick={handleResetLayout}
        className="absolute bottom-8 right-8 z-40 glass p-3 rounded-full text-white hover:bg-white/10 transition-all shadow-lg group border border-white/10"
        title="Reset & Refit Layout"
      >
        <RotateCcw className="group-hover:-rotate-180 transition-transform duration-500" />
      </button>

      {/* Helper Tip */}
      {!selectedElement && (
        <div className="absolute bottom-8 left-8 z-50 glass px-4 py-2 rounded-full flex items-center gap-2 text-sm text-gray-300 pointer-events-none opacity-60 hover:opacity-100 transition-opacity border border-white/5 bg-black/20">
          <Info size={16} />
          <span>Hover to highlight, click to view details</span>
        </div>
      )}
    </div>
  );
};

export default GraphView;