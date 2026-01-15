// src/components/GraphView.jsx
import React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

const GraphView = ({ data }) => {
  // 将后端数据转换为 Cytoscape 格式
  const elements = [
    ...data.nodes.map(n => ({
      data: { id: n.id, label: n.label, ...n }
    })),
    ...data.edges.map(e => ({
      data: { source: e.source, target: e.target, ...e }
    }))
  ];

  const layout = { name: 'cose', animate: true }; // 力导向布局

  const stylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(label)',
        'width': 'mapData(centrality, 0, 10, 30, 80)', // 大小随 centrality 变化
        'height': 'mapData(centrality, 0, 10, 30, 80)',
        'text-valign': 'center',
        'color': '#fff',
        'text-outline-width': 2,
        'text-outline-color': '#666'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(weight)',
        'line-color': (ele) => {
          const sent = ele.data('sentiment');
          if (sent === 'positive') return '#4ade80'; // Green
          if (sent === 'negative') return '#f87171'; // Red
          return '#94a3b8'; // Grey
        },
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ];

  return (
    <CytoscapeComponent 
      elements={elements} 
      style={{ width: '100%', height: '600px' }} 
      stylesheet={stylesheet}
      layout={layout}
    />
  );
};

export default GraphView;