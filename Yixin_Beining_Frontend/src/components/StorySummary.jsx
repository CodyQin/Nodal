import React from 'react';

const STORY_SUMMARY = {
    1: { title: 'Prologue', text: 'Physicist Wang Miao witnesses a series of scientist suicides. He begins to uncover a force beyond human understanding.' },
    2: { title: 'Red Coast Base', text: 'Wang Miao contacts Ye Wenjie. A broadcast into the universe marks the first true contact between humanity and aliens.' },
    3: { title: 'The Response', text: 'A response comes from deep space. Trisolaris confirms humanity\'s existence and begins to intervene invisibly.' },
    4: { title: 'Modern Crisis', text: 'Scientific research stagnates. Humanity gradually realizes that a crisis spanning civilization levels is approaching.' },
    5: { title: 'Three Body Game', text: 'A mysterious VR game appears, guiding players to understand the survival logic of the Trisolaran civilization.' },
    6: { title: 'ETO', text: 'The Earth-Trisolaris Organization surfaces. Internal rifts appear as different factions hold conflicting views.' },
    7: { title: 'The Truth', text: 'Sophons are revealed. Human civilization is completely exposed under surveillance. All hopes are laid bare.' },
    8: { title: 'Operation Guzheng', text: 'Humanity strikes back. Operation Guzheng deals a heavy blow to the ETO, but the war has just begun.' }
};

const StorySummary = ({ chapter }) => {
    const summary = STORY_SUMMARY[chapter];
    if (!summary) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            {/* 左侧：蓝色数字方块 */}
            <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                background: '#5B4EF6', // 截图里的蓝色
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(91, 78, 246, 0.3)'
            }}>
                {chapter}
            </div>

            {/* 右侧：文字内容 */}
            <div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#303133' }}>
                    {summary.title}
                </h2>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#606266' }}>
                    {summary.text}
                </p>
            </div>
        </div>
    );
};

export default StorySummary;