import React, { useState } from 'react';
import Page1 from './components/Page1';
import Page2 from './components/Page2';

const App = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);

  // 🔴 状态 1：显示首页
  if (currentPage === 1) {
    // 👇👇👇 奶奶看这里：这里必须改叫 onStartAnalysis，因为 Page1 里用的是这个名字！
    return <Page1 onStartAnalysis={() => setCurrentPage(2)} />;
  }

  // 🟢 状态 2：显示详情页
  return (
    <Page2
      chapter={currentChapter}
      setChapter={setCurrentChapter}
      onBack={() => setCurrentPage(1)}
    />
  );
};

export default App;