import React, { useState } from 'react';

// 1. 引入所有组件 (注意路径)
import LandingPage from './components/Page1';
import GraphViewer from './components/GraphViewer';
import StoryTimeline from './components/StoryTimeline';
import StorySummary from './components/StorySummary';
import ChatAssistant from './components/ChatAssistant'; // 确保之前写的这个文件也在 components 里

const App = () => {
  // --- 状态管理 ---
  const [hasUploaded, setHasUploaded] = useState(false); // 是否已上传
  const [chapter, setChapter] = useState(1);             // 当前章节
  const [selectedNode, setSelectedNode] = useState(null); // 当前选中的人物(给AI用)

  // 🔴 状态 1：还没上传，显示首页
  if (!hasUploaded) {
    return <LandingPage onStartAnalysis={() => setHasUploaded(true)} />;
  }

  // 🟢 状态 2：分析详情页
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F7F8FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingBottom: '50px'
    }}>

      {/* A. 顶部导航栏 */}
      <div style={{
        height: '60px', background: 'white', borderBottom: '1px solid #eee',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'sticky', top: 0, zIndex: 999
      }}>
        <button
          onClick={() => setHasUploaded(false)}
          style={{ border: '1px solid #ddd', background: 'white', padding: '6px 15px', borderRadius: '6px', color: '#666', cursor: 'pointer' }}>
          ← 返回首页
        </button>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>📖 三体·地球往事</div>
      </div>

      {/* B. 核心内容区 */}
      <div style={{ maxWidth: '1400px', margin: '30px auto', padding: '0 20px' }}>

        {/* 第一排：左边是(图+摘要)，右边是(AI聊天) */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* --- 左栏：视觉展示区 (Flex 3) --- */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* 1. 3D 关系图 */}
            <div style={{
              height: '600px', // 固定高度
              background: 'white', borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden'
            }}>
              <GraphViewer
                chapter={chapter}
                onNodeClick={(node) => setSelectedNode(node)} // 👈 点击星球，传给 AI
              />
            </div>

            {/* 2. 剧情摘要卡片 (放在图的下面，很顺眼) */}
            <StorySummary chapter={chapter} />

          </div>

          {/* --- 右栏：AI 助手 (Flex 1) --- */}
          <div style={{
            flex: 1,
            minWidth: '320px',
            height: '800px', // 让它和左边差不多高
            background: 'white', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden',
            position: 'sticky', top: '80px' // 让聊天框随着滚动条固定住，很高级！
          }}>
            <ChatAssistant targetNode={selectedNode} />
          </div>

        </div>

        {/* 第二排：剧情时间轴 (放在最下面控制全局) */}
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ marginLeft: '20px', color: '#333' }}>剧情进度</h3>
          <StoryTimeline
            chapter={chapter}
            onChange={setChapter}
          />
        </div>

      </div>
    </div>
  );
};

export default App;