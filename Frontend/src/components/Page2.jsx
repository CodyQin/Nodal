import React, { useState } from 'react';

// 引入邻居组件
import GraphViewer from './GraphViewer';     // 3D
import GraphViewer2D from './GraphViewer2D'; // 2D
import ChatAssistant from './ChatAssistant';
import StoryTimeline from './StoryTimeline';
import StorySummary from './StorySummary';

const Page2 = ({ chapter, setChapter, onBack }) => {
    // 🕹️ 状态1: 2D/3D 模式开关
    const [is2DMode, setIs2DMode] = useState(false);

    // 🕹️ 状态2: 当前选中的人物 (传给聊天助手)
    const [selectedNode, setSelectedNode] = useState(null);

    return (
        <div style={{
            height: '100vh', width: '100vw', backgroundColor: '#F5F7FA',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            {/* A. 顶部导航栏 */}
            <div style={{
                height: '64px', background: 'white', borderBottom: '1px solid #E4E7ED',
                display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <button onClick={onBack} style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #DCDFE6',
                    background: 'white', cursor: 'pointer', color: '#606266'
                }}>
                    ← Return
                </button>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#303133' }}>
                    📖 The Three-Body Problem
                </div>
                <div style={{ width: '80px' }}></div>
            </div>

            {/* B. 滚动内容区 */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* 第一排：图谱(左) + 聊天(右) */}
                <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', height: '600px', minHeight: '600px' }}>

                    {/* 左侧：图谱卡片 */}
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #EBEEF5',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
                    }}>
                        {/* 卡片头部：切换开关 */}
                        <div style={{
                            padding: '12px 24px', borderBottom: '1px solid #F0F2F5',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: '#FAFAFA'
                        }}>
                            <div style={{ fontWeight: 'bold', color: '#303133' }}>
                                {/* 显示当前模式 */}
                                {is2DMode ? 'Network (2D Flat)' : 'Network (3D Space)'}
                            </div>

                            {/* 🔵 切换按钮 */}
                            <button
                                onClick={() => setIs2DMode(!is2DMode)}
                                style={{
                                    padding: '6px 16px', borderRadius: '20px', border: '1px solid #5B4EF6',
                                    backgroundColor: is2DMode ? 'white' : '#5B4EF6',
                                    color: is2DMode ? '#5B4EF6' : 'white',
                                    cursor: 'pointer', fontWeight: '500', fontSize: '13px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {is2DMode ? '🔄 Switch to 3D' : '🗺️ Switch to 2D'}
                            </button>
                        </div>

                        {/* 图谱内容区 */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {is2DMode ? (
                                    // 2D 模式
                                    <GraphViewer2D
                                    // 👈 如果 2D 组件支持点击，这里也可以传
                                    />
                                ) : (
                                    // 3D 模式
                                    <GraphViewer
                                        chapter={chapter}
                                        // 👇 这里就是您刚才要想的互动功能！
                                        onNodeClick={(node) => {
                                            console.log("Clicked:", node);
                                            setSelectedNode(node);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧：聊天卡片 (接收选中的人物) */}
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #EBEEF5',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
                    }}>
                        <ChatAssistant targetNode={selectedNode} />
                    </div>
                </div>

                {/* 第二排：简介 */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #EBEEF5' }}>
                    <h3 style={{ marginTop: 0 }}>Story Overview</h3>
                    <StorySummary chapter={chapter} />
                </div>

                {/* 第三排：时间轴 */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #EBEEF5' }}>
                    <StoryTimeline chapter={chapter} onChange={setChapter} />
                </div>

                <div style={{ height: '40px' }}></div>
            </div>
        </div>
    );
};

export default Page2;