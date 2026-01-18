import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';

// Import Data
import DATA from '../data/json_with_centrality_size';

const GraphViewer = ({ chapter, onNodeClick }) => {
    const fgRef = useRef();

    // 1. Ref for the container to measure dimensions
    const containerRef = useRef();
    // 2. State to hold the dynamic width and height
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    const [highlightLink, setHighlightLink] = useState(null);
    // Data filtering logic
    const data = useMemo(() => {
        const validNodes = DATA.nodes.filter(node => node.chapter <= chapter);
        const nodeIds = new Set(validNodes.map(n => n.id));
        const validLinks = DATA.edges.filter(edge => {
            if (edge.chapter > chapter) return false;
            const sourceId = edge.source.id || edge.source;
            const targetId = edge.target.id || edge.target;
            return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });
        return { nodes: validNodes, links: validLinks };
    }, [chapter]);
    // 3. Measure container size automatically to avoid "black box" issues
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        // Measure on mount
        updateDimensions();
        // Measure on window resize
        window.addEventListener('resize', updateDimensions);

        // Measure again after a short delay to ensure layout is ready
        setTimeout(updateDimensions, 500);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const handleResetCamera = () => {
        if (fgRef.current) {
            // 1. 视角飞过去 (x=200)
            fgRef.current.cameraPosition(
                { x: 300, y: 50, z: 100 },
                { x: 0, y: 0, z: 0 },
                1000
            );

            // 2. 关键修改：直接用您定义在上面的 data 变量！
            // 只要 data 在这个函数上面定义了，这里就能直接用到，绝对不报错
            if (data && data.nodes) {
                data.nodes.forEach(node => {
                    node.fx = null; // 松开 X 轴
                    node.fy = null; // 松开 Y 轴
                    node.fz = null; // 松开 Z 轴
                });
            }

            // 3. 踹一脚物理引擎，让松开的球飞回去
            fgRef.current.d3ReheatSimulation();
        }
    };

    // 5. Initial auto-focus on load
    useEffect(() => {
        setTimeout(() => {
            handleResetCamera();
        }, 1000);
    }, []);


    // Link label rendering
    const getLinkText = useCallback((link) => {
        if (link === highlightLink) {
            const label = link.relation?.label || '';
            const sprite = new SpriteText(label);
            sprite.color = '#ffffff';
            sprite.textHeight = 4;
            sprite.backgroundColor = 'rgba(0,0,0,0.8)';
            sprite.padding = 2;
            return sprite;
        }
        return null;
    }, [highlightLink]);

    return (
        // Wrapper div with Ref to measure size
        <div ref={containerRef} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>

            <ForceGraph3D
                ref={fgRef}
                // Pass dynamic dimensions to the graph
                width={dimensions.width}
                height={dimensions.height}

                graphData={data}
                backgroundColor="#000510"

                // Node Click Event
                onNodeClick={node => {
                    if (onNodeClick) onNodeClick(node);
                    const distance = 40;
                    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                    fgRef.current.cameraPosition(
                        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                        node,
                        2000
                    );
                }}

                // Link Hover Event
                onLinkHover={link => setHighlightLink(link)}
                linkOpacity={link => (!highlightLink ? 0.3 : link === highlightLink ? 1.0 : 0.1)}
                linkWidth={link => link === highlightLink ? 2 : 1}
                linkColor={link => link.visual?.color || '#f4ff1d'}
                linkThreeObjectExtend={true}
                linkThreeObject={getLinkText}
                linkPositionUpdate={(sprite, { start, end }) => {
                    if (!sprite || !start || !end) return;
                    Object.assign(sprite.position, {
                        x: start.x + (end.x - start.x) / 2,
                        y: start.y + (end.y - start.y) / 2,
                        z: start.z + (end.z - start.z) / 2
                    });
                }}

                // Node Object Styling
                nodeThreeObject={node => {
                    const group = new THREE.Group();
                    const size = (node.visual?.size || 30) / 12;
                    const geometry = new THREE.SphereGeometry(size);
                    const material = new THREE.MeshPhongMaterial({
                        color: '#ffffff',
                        transparent: true, opacity: 0.8, shininess: 100
                    });
                    const sphere = new THREE.Mesh(geometry, material);
                    group.add(sphere);
                    const sprite = new SpriteText(node.label);
                    sprite.color = '#ffffff';
                    sprite.textHeight = 3;
                    sprite.position.set(0, -size - 6, 0);
                    group.add(sprite);
                    return group;
                }}
            />

            {/* Auto Focus Button (English) */}
            <button
                onClick={(e) => {
                    e.target.style.transform = 'scale(0.9)';
                    setTimeout(() => e.target.style.transform = 'scale(1)', 100);
                    handleResetCamera();
                }}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    padding: '12px 24px',
                    background: 'rgba(91, 78, 246, 0.4)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(91, 78, 246, 0.7)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(91, 78, 246, 0.4)'}
            >
                🎥 Auto Focus
            </button>
        </div>
    );
};

export default GraphViewer;