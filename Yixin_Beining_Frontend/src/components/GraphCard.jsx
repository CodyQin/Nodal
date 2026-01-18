import React from 'react';
import GraphViewer from './components/GraphViewer';

const GraphCard = ({ onNodeSelect }) => {
    return (
        <div style={{
            flex: 3,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #f0f0f0'
        }}>

            {/* Title Bar */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2d3d' }}>
                    Character Network
                </div>
                {/* Tooltip */}
                <div style={{
                    fontSize: '12px',
                    color: '#909399',
                    background: '#f4f4f5',
                    padding: '4px 10px',
                    borderRadius: '4px'
                }}>
                    💡 Hover or click nodes
                </div>
            </div>

            {/* Graph Content */}
            <div style={{
                flex: 1,
                position: 'relative',
                backgroundColor: '#000510'
            }}>
                <GraphViewer onNodeClick={onNodeSelect} />
            </div>
        </div>
    );
};

export default GraphCard;