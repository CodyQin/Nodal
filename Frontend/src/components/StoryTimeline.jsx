import React from 'react';

const chapters = [
    { id: 1, label: '序章' },
    { id: 2, label: '红岸基地' },
    { id: 3, label: '三体回应' },
    { id: 4, label: '现代危机' },
    { id: 5, label: '三体游戏' },
    { id: 6, label: '地球三体组织' },
    { id: 7, label: '真相揭露' },
    { id: 8, label: '古筝行动' }
];

const StoryTimeline = ({ chapter, onChange }) => {
    return (
        <div style={container}>
            {chapters.map(c => (
                <div
                    key={c.id}
                    onClick={() => onChange(c.id)}
                    style={{
                        ...node,
                        background: chapter === c.id ? '#5b5bff' : '#e5e7ff',
                        color: chapter === c.id ? '#fff' : '#333'
                    }}
                >
                    <div style={{ fontWeight: 'bold' }}>{c.id}</div>
                    <div style={{ fontSize: '12px', marginTop: '6px' }}>{c.label}</div>
                </div>
            ))}
        </div>
    );
};

const container = {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    padding: '20px'
};

const node = {
    width: '110px',
    height: '80px',
    borderRadius: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
};

export default StoryTimeline;