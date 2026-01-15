// src/App.jsx
import { useState } from 'react';
import axios from 'axios';
import GraphView from './components/GraphView';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // 存储完整的后端 JSON
  const [currentPhase, setCurrentPhase] = useState(0); // 当前时间轴索引
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('text_content', file); // 简化演示，这里假设 input 是文本
    
    try {
      // 这里的 URL 后面部署时要改成你的后端 Render URL
      const res = await axios.post('http://localhost:8000/api/analyze', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Nodal
      </h1>

      {/* Input Section */}
      <div className="mb-8 flex gap-4">
        <textarea 
          className="w-full p-4 text-black rounded" 
          rows="4" 
          placeholder="Paste story text here..."
          onChange={(e) => setFile(e.target.value)}
        />
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-blue-600 px-8 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Generate Graph'}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Timeline Slider */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {result.timeline.map((phase, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhase(index)}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  currentPhase === index ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                {phase.phase_name}
              </button>
            ))}
          </div>

          {/* Graph Visualization */}
          <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <GraphView data={result.timeline[currentPhase]} />
          </div>
          
          {/* Phase Summary */}
          <div className="p-4 bg-slate-800 rounded">
            <h3 className="text-xl font-bold mb-2">Phase Summary</h3>
            <p>{result.timeline[currentPhase].summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;