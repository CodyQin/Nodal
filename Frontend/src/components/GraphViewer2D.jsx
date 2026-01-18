import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
// 引入您的数据文件
import RAW_FILE from '../data/json_with_centrality_size';

const GraphViewer2D = () => {
    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState(false);

    // --- 数据提取逻辑 (和之前修好的一模一样) ---
    const dataObj = (RAW_FILE && RAW_FILE.default) ? RAW_FILE.default : RAW_FILE;
    if (!dataObj) return <div>❌ 无法读取数据文件</div>;

    const originalNodes = dataObj.nodes || [];
    const originalEdges = dataObj.edges || dataObj.links || [];

    const extractId = (val) => {
        if (!val) return null;
        if (typeof val === 'object') return val.id || val.name || null;
        return String(val).trim();
    };

    const myNodes = originalNodes.map(node => {
        const safeId = extractId(node.id);
        return {
            id: safeId,
            name: safeId,
            displayName: node.label,
            symbolSize: (node.visual && node.visual.size) ? node.visual.size : 20,
            itemStyle: {
                color: (node.visual && node.visual.color) ? node.visual.color : '#2f4554'
            },
            draggable: true,
            label: {
                show: true, position: 'right',
                formatter: function (p) { return p.data.displayName || p.name; },
                color: '#333', fontWeight: 'bold'
            }
        };
    });

    const nodeIdSet = new Set(myNodes.map(n => n.id));
    let validCount = 0;

    const myLinks = originalEdges.map(edge => {
        const sourceId = extractId(edge.source);
        const targetId = extractId(edge.target);
        if (nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
            validCount++;
            return {
                source: sourceId, target: targetId,
                label: {
                    show: true, formatter: (edge.relation && edge.relation.label) ? edge.relation.label : '',
                    color: '#666', fontSize: 11
                },
                lineStyle: {
                    color: (edge.visual && edge.visual.color) ? edge.visual.color : '#999',
                    width: (edge.visual && edge.visual.weight) ? edge.visual.weight : 2,
                    curveness: 0.1
                }
            };
        }
        return null;
    }).filter(link => link !== null);

    // --- 按钮逻辑 ---
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // --- 画图配置 ---
    const option = {
        // 工具栏：ECharts 自带的复位功能
        toolbox: {
            show: true,
            feature: {
                restore: { title: '复位' }, // 这个就是 2D 的 Auto Focus
                saveAsImage: { title: '保存图片' }
            },
            right: 20,
            top: 10
        },
        series: [{
            type: 'graph',
            layout: 'force',
            data: myNodes,
            links: myLinks,
            roam: true, // 允许拖拽缩放
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 10],
            force: {
                repulsion: 800,
                edgeLength: 200,
                gravity: 0.05,
                layoutAnimation: true
            },
            lineStyle: { opacity: 0.9 }
        }]
    };

    return (
        <div style={{
            width: isFullscreen ? '100vw' : '100%',
            height: isFullscreen ? '100vh' : '100%',
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? 0 : 'auto',
            left: isFullscreen ? 0 : 'auto',
            zIndex: isFullscreen ? 9999 : 1,
            backgroundColor: 'white',
            border: isFullscreen ? 'none' : '1px solid #ccc',
            transition: 'all 0.3s ease'
        }}>
            {/* 全屏按钮 */}
            <button
                onClick={toggleFullscreen}
                style={{
                    position: 'absolute', bottom: 20, right: 20, zIndex: 100,
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc',
                    background: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                {isFullscreen ? '✖ 退出全屏' : '⛶ 全屏查看'}
            </button>

            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
                lazyUpdate={true}
            />
        </div>
    );
};

export default GraphViewer2D;