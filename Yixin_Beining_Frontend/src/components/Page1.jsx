import React, { useRef } from 'react';

// --- Component 1: Credit Card (Small Info Cards) ---
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

// --- Component 2: Main Landing Page ---
const LandingPage = ({ onStartAnalysis }) => {

    const fileInputRef = useRef(null);

    // Trigger file input click
    const handleBoxClick = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Simulate analysis process
            setTimeout(() => {
                onStartAnalysis(); // Navigate to next page
            }, 1000);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#FAFBFC', fontFamily: 'sans-serif',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>

            {/* Header / Navbar */}
            <header style={{
                width: '100%', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'white', boxShadow: '0 1px 0 #f0f0f0'
            }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* 🌟 Change: Renamed to Nodal */}
                    📖 <span style={{ background: 'linear-gradient(90deg, #5B4EF6, #9370DB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Nodal
                    </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>v1.0.0 Global Edition</div>
            </header>

            <main style={{
                flex: 1, width: '100%', maxWidth: '1200px', padding: '40px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '60px'
            }}>

                {/* A. Hero Section */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <h1 style={{ fontSize: '42px', color: '#1a1a1a', marginBottom: '15px', lineHeight: '1.2' }}>
                        Visualize Stories in <span style={{ color: '#5B4EF6' }}>3D Space</span>
                    </h1>
                    <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
                        Upload your novel or script to generate an interactive character relationship network powered by Gemini AI.
                    </p>
                </div>

                {/* B. Upload Box */}
                <div
                    onClick={handleBoxClick}
                    style={{
                        width: '100%', maxWidth: '600px', height: '200px',
                        border: '2px dashed #5B4EF6', borderRadius: '20px', backgroundColor: '#F4F3FF',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ECEBFF'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F3FF'}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".txt,.pdf,.docx"
                    />

                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📂</div>
                    <h3 style={{ fontSize: '18px', color: '#333', margin: '0 0 5px 0' }}>Click to Upload File</h3>
                    <p style={{ color: '#909399', fontSize: '14px', marginBottom: '20px' }}>Supports TXT, DOCX, PDF</p>

                    <button
                        style={{
                            padding: '10px 30px', background: '#5B4EF6', color: 'white',
                            border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
                            pointerEvents: 'none'
                        }}
                    >
                        Select Document
                    </button>
                </div>

                {/* C. Credits Section */}
                <div style={{ width: '100%', maxWidth: '1000px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '30px', color: '#333', textAlign: 'center' }}>Acknowledgments</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <CreditCard icon="🏆" title="Google" desc="Special thanks for support" bg="#E6F7FF" />
                        <CreditCard icon="🤖" title="Google Gemini" desc="Powered by AI Model" bg="#FFF7E6" />
                        <CreditCard icon="🎓" title="USC" desc="Academic Support" bg="#FFF0F6" />
                    </div>
                </div>
            </main>

            <footer style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '13px', borderTop: '1px solid #eee', width: '100%' }}>
                © 2024 Nodal Analysis. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;