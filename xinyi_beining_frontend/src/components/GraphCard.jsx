import React from 'react';
import GraphViewer from './components/GraphViewer'; // 把您的地球组件引进来

const GraphCard = ({ onNodeSelect }) => {
    return (
        // 1. 大卡片容器 (白底、圆角、阴影)
        <div style={{
            flex: 3, // 占宽度的 3/4
            backgroundColor: 'white',
            borderRadius: '16px', // 大圆角，像截图一样
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', // 淡淡的高级阴影
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // 防止圆角被里面的内容遮住
            border: '1px solid #f0f0f0' // 极细的边框
        }}>

            {/* 2. 标题栏 (截图里的 "人物关系图谱") */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0 // 防止被压扁
            }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2d3d' }}>
                    人物关系图谱
                </div>
                {/* 那个小小的提示标签 */}
                <div style={{
                    fontSize: '12px',
                    color: '#909399',
                    background: '#f4f4f5',
                    padding: '4px 10px',
                    borderRadius: '4px'
                }}>
                    💡 悬停或点击节点
                </div>
            </div>

            {/* 3. 内容区：把 GraphViewer 塞在这里 */}
            <div style={{
                flex: 1, // 剩下的空间全给地球
                position: 'relative',
                backgroundColor: '#fafafa' // 地球背景稍微灰一点点，显得有层次
            }}>
                {/* 👇 地球就在这儿！ */}
                <GraphViewer onNodeClick={onNodeSelect} />
            </div>

        </div>
    );
};

export default GraphCard;