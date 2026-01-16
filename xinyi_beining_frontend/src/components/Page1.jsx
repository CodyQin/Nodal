import React, { useRef } from 'react'; // 👈 1. 引入 useRef

// --- 积木 1：致谢小卡片 (保持不变) ---
const CreditCard = ({ icon, title, desc, bg }) => (
    <div style={{
        flex: 1, minWidth: '250px', padding: '30px 20px',
        border: '1px solid #f0f0f0', borderRadius: '16px', backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
        <div style={{
            width: '60px', height: '60px', borderRadius: '50%', backgroundColor: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '15px'
        }}>
            {icon}
        </div>
        <h4 style={{ fontSize: '16px', margin: '0 0 8px 0', color: '#333' }}>{title}</h4>
        <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>{desc}</p>
    </div>
);

// --- 积木 2：主页面 ---
const LandingPage = ({ onStartAnalysis }) => {

    // 👇 2. 创建一个“遥控器”，用来控制那个隐形的上传按钮
    const fileInputRef = useRef(null);

    // 👇 3. 当用户点击大框框时，我们用遥控器按一下隐形按钮
    const handleBoxClick = () => {
        fileInputRef.current.click();
    };

    // 👇 4. 当用户真的选好文件后，才执行这里
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log("用户选了文件：", file.name);
            // 这里可以加个加载动画，现在先直接进下一页
            onStartAnalysis();
        }
    };

    return (
        <div style={{
            minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            backgroundColor: '#fff', display: 'flex', flexDirection: 'column'
        }}>

            {/* 👇 5. 这里藏着真正的文件上传器，平时不显示 (display: none) */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".txt,.docx,.pdf" // 限制只能选这些格式
            />

            {/* A. 头部 */}
            <header style={{
                height: '70px', padding: '0 40px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2d3d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#5B4EF6', fontSize: '28px' }}>📖</span> Nodal
                </div>
                <button style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', color: '#606266', cursor: 'pointer' }}>
                    ℹ️ 了解更多
                </button>
            </header>

            {/* B. 中间 */}
            <main style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '60px 20px'
            }}>
                <h1 style={{ fontSize: '36px', marginBottom: '16px', color: '#1f2d3d' }}>智能小说解析平台</h1>
                <p style={{ fontSize: '16px', color: '#606266', marginBottom: '50px' }}>
                    基于AI技术的小说分析工具，帮助您理清复杂的人物关系
                </p>

                {/* 👇 这个大框框现在加上了 onClick={handleBoxClick} */}
                <div
                    onClick={handleBoxClick}
                    style={{
                        width: '100%', maxWidth: '700px', height: '350px',
                        border: '2px dashed #A0A4F6', borderRadius: '20px', backgroundColor: '#FDFCFF',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '80px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F3FF'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FDFCFF'}
                >
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📤</div>
                    <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>上传您的小说文件</h3>
                    <p style={{ color: '#909399', fontSize: '14px', marginBottom: '30px' }}>支持 TXT、DOCX、PDF 格式</p>

                    {/* 这个按钮也一样，点它等于点大框 */}
                    <button
                        style={{
                            padding: '12px 40px', background: '#5B4EF6', color: 'white',
                            border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                            pointerEvents: 'none' // 让点击穿透到大框上，简单处理
                        }}
                    >
                        选择文件
                    </button>
                </div>

                {/* C. 底部 */}
                <div style={{ width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '30px', color: '#333', textAlign: 'center' }}>致谢</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <CreditCard icon="🏆" title="赛事主办方" desc="感谢支持与指导" bg="#E6F7FF" />
                        <CreditCard icon="🤖" title="Google" desc="由 Gemini AI 驱动" bg="#FFF7E6" />
                        <CreditCard icon="🎓" title="南加州大学" desc="学术支持与技术指导" bg="#FFF0F6" />
                    </div>
                </div>
            </main>

            <footer style={{ padding: '30px', textAlign: 'center', color: '#909399', fontSize: '14px' }}>
                © 2026 Nodal. 智能小说解析平台
            </footer>
        </div>
    );
};

export default LandingPage;