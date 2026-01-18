import React from 'react';

const chapters = [1, 2, 3, 4, 5, 6, 7, 8];

const StoryTimeline = ({ chapter, onChange }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', // 让圆圈均匀分布
            position: 'relative',
            padding: '0 20px'
        }}>
            {/* 背景灰线 */}
            <div style={{
                position: 'absolute', left: '30px', right: '30px', top: '50%',
                height: '2px', background: '#EBEEF5', zIndex: 0
            }} />

            {chapters.map((id) => {
                const isActive = chapter === id;
                return (
                    <button
                        key={id}
                        onClick={() => onChange(id)}
                        style={{
                            position: 'relative', zIndex: 1, // 保证圆圈压在线上
                            width: '40px', height: '40px',
                            borderRadius: '50%',
                            border: isActive ? 'none' : '2px solid #DCDFE6',
                            background: isActive ? '#5B4EF6' : 'white',
                            color: isActive ? 'white' : '#909399',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {id}
                    </button>
                );
            })}
        </div>
    );
};

export default StoryTimeline;