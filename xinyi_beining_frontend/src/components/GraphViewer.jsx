import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import React, { useRef, useState, useMemo, useCallback } from 'react';

// 引入您的数据
import DATA from '../data/json_with_centrality_size';

const GraphViewer = ({ chapter, onNodeClick }) => {
    const fgRef = useRef();

    // 🌟 状态：记录当前鼠标悬停在哪条线上
    const [highlightLink, setHighlightLink] = useState(null);

    const NODE_UNIFORM_COLOR = '#ffffff';

    // 数据过滤逻辑 (保持不变)
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

    // 🌟 核心修改：连线文字渲染器
    // 只有当 link === highlightLink (被悬停) 时，才返回文字对象
    const getLinkText = useCallback((link) => {
        if (link === highlightLink) {
            const label = link.relation?.label || ''; // 从您的新数据结构取 label
            const sprite = new SpriteText(label);
            sprite.color = '#ffffff'; // 文字白色
            sprite.textHeight = 4;    // 文字大小
            sprite.backgroundColor = 'rgba(0,0,0,0.8)'; //以此为背景，看不清时可以加黑底
            sprite.padding = 2;
            return sprite;
        }
        return null; // 平时不显示文字
    }, [highlightLink]);

    return (
        <div style={{
            height: '100%',
            width: '100%',
            background: 'linear-gradient(135deg, #000510 0%, #1a0b2e 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <ForceGraph3D
                ref={fgRef}
                graphData={data}
                backgroundColor="rgba(0,0,0,0)"

                // 1. 🌟 悬停事件：鼠标放上去记录 link，移开清空
                onLinkHover={link => setHighlightLink(link)}

                // 2. 🌟 透明度控制：
                // 没悬停时 0.2 (很淡)，悬停这根线时 1.0 (全亮)，悬停别的线时 0.1 (更淡)
                linkOpacity={link => {
                    if (!highlightLink) return 0.3; // 默认淡淡的
                    return link === highlightLink ? 1.0 : 0.1; // 聚焦模式
                }}

                // 3. 粗细控制：悬停时加粗
                linkWidth={link => link === highlightLink ? 2 : 1}

                // 4. 颜色控制
                linkColor={link => link.visual?.color || '#f4ff1d'}

                // 5. 🌟 增加文字对象 (保留原有的线条)
                linkThreeObjectExtend={true}
                linkThreeObject={getLinkText}

                // 6. 🌟 让文字始终在连线中间
                linkPositionUpdate={(sprite, { start, end }) => {
                    if (!sprite || !start || !end) return;
                    // 计算中点坐标
                    Object.assign(sprite.position, {
                        x: start.x + (end.x - start.x) / 2,
                        y: start.y + (end.y - start.y) / 2,
                        z: start.z + (end.z - start.z) / 2
                    });
                }}

                // --- 节点样式 (保持不变) ---
                onNodeClick={node => {
                    if (onNodeClick) onNodeClick(node);
                    const distance = 40;
                    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                    fgRef.current.cameraPosition(
                        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                        node,
                        3000
                    );
                }}
                nodeThreeObject={node => {
                    const group = new THREE.Group();
                    const size = (node.visual?.size || 30) / 12;
                    const geometry = new THREE.SphereGeometry(size);
                    const material = new THREE.MeshPhongMaterial({
                        color: NODE_UNIFORM_COLOR,
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
        </div>
    );
};

export default GraphViewer;