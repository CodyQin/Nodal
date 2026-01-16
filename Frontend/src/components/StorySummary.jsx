import React from 'react';

const STORY_SUMMARY = {
    1: {
        title: '序章',
        text:
            '物理学家汪淼接连目睹多起科学家自杀事件，在警方史强的协助下，他逐渐察觉到这些事件背后隐藏着某种超越人类理解的力量。'
    },
    2: {
        title: '红岸基地',
        text:
            '在调查过程中，汪淼接触到叶文洁，并逐步了解到红岸基地的历史。一次被监听的宇宙广播，成为人类与外星文明第一次真正的接触。'
    },
    3: {
        title: '三体回应',
        text:
            '宇宙深处传来了回应。三体文明确认了人类的存在，并开始以不可见的方式介入地球文明的发展进程。'
    },
    4: {
        title: '现代危机',
        text:
            '科学研究全面停滞，基础理论接连崩塌。人类逐渐意识到，一场跨越文明层级的危机正在逼近。'
    },
    5: {
        title: '三体游戏',
        text:
            '一款名为“三体”的神秘游戏出现，引导玩家理解三体文明的生存逻辑，同时也成为筛选人类追随者的工具。'
    },
    6: {
        title: '地球三体组织',
        text:
            'ETO 的结构逐渐浮出水面。不同派系对三体文明抱有截然不同的态度，人类内部的分裂愈发明显。'
    },
    7: {
        title: '真相揭露',
        text:
            '智子现身，人类文明被彻底暴露在三体文明的监控之下。所有隐秘的希望与挣扎都无所遁形。'
    },
    8: {
        title: '古筝行动',
        text:
            '人类发起反击。“古筝行动”展开，ETO 遭受重创，但这场文明之间的对抗才刚刚开始。'
    }
};

const StorySummary = ({ chapter }) => {
    const summary = STORY_SUMMARY[chapter];

    if (!summary) return null;

    return (
        <div style={container}>
            <div style={chapterBadge}>{chapter}</div>
            <div>
                <h3 style={title}>{summary.title}</h3>
                <p style={text}>{summary.text}</p >
            </div>
        </div>
    );
};

const container = {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '24px 32px',
    borderRadius: '16px',
    background: 'rgba(240,242,255,0.8)',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start'
};

const chapterBadge = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#5b5bff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
};

const title = {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold'
};

const text = {
    marginTop: '8px',
    lineHeight: 1.6,
    fontSize: '14px',
    color: '#333'
};

export default StorySummary;