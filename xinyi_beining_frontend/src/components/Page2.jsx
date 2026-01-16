import React from 'react';
import GraphViewer from '/components/GraphViewer';
import ChatAssistant from './components/ChatAssistant';

const RelationPage = () => {
    return (
        // 这是一个纯净的容器，只包含您要的这两个功能
        <div style={{
            width: '100%',
            height: '100%', // 占满父容器给它的空间
            display: 'flex',
            gap: '20px', // 两个卡片之间的间距
            boxSizing: 'border-box'
        }}>

            {/* 左边：关系图谱 (根据截图，占大部分) */}
            <div style={{
                flex: 3,
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                    人物关系图谱
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <GraphViewer />
                </div>
            </div>

            {/* 右边：AI 助手 (占小部分) */}
            <div style={{
                flex: 1,
                minWidth: '320px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                overflow: 'hidden'
            }}>
                <ChatAssistant />
            </div>

        </div>
    );
};

export default RelationPage;