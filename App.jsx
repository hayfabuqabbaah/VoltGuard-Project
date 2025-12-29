import React, { useState } from 'react';
import { Zap, Activity, UploadCloud, Play, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_BASE = "https://voltguard-api.onrender.com";

export default function App() {
  const [dataPoints, setDataPoints] = useState(Array(128).fill(0.0));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = (i, v) => {
    const next = [...dataPoints];
    next[i] = parseFloat(v) || 0;
    setDataPoints(next);
  };

  const handlePaste = (e) => {
    const nums = e.target.value.split(/[,\s\n]+/).filter(x => x !== "").map(Number);
    if (nums.length > 0) {
      const next = [...dataPoints];
      nums.slice(0, 128).forEach((n, i) => next[i] = n);
      setDataPoints(next);
    }
  };

  const callApi = async (endpoint, isPost = false) => {
    setLoading(true);
    try {
      const options = isPost ? {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: dataPoints })
      } : { method: 'GET' };

      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await res.json();
      if (data.raw_data) setDataPoints(data.raw_data);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("تأكد من تشغيل ملف backend.py أولاً!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 p-4 md:p-8 bg-[#0a2a4f]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4 text-[#f0a500]">
            <Zap size={40} fill="#f0a500" />
            <h1 className="text-4xl font-black tracking-tighter italic text-white uppercase">VoltGuard AI</h1>
          </div>
          <button onClick={() => callApi('/generate_test')} className="flex items-center gap-2 px-6 py-2 border-2 border-[#f0a500] text-[#f0a500] rounded-full font-bold hover:bg-[#f0a500] hover:text-white transition-all">
            <RefreshCw className={loading ? "animate-spin" : ""} size={20} /> عينة اختبار
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
              <label className="flex items-center gap-2 text-[#f0a500] font-bold mb-3"><UploadCloud /> لصق البيانات</label>
              <textarea onChange={handlePaste} placeholder="لصق 128 قيمة هنا..." className="w-full h-24 bg-[#0a1e35] border border-white/10 rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-[#f0a500] outline-none" />
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="grid grid-cols-8 gap-2 h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                {dataPoints.map((p, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[8px] text-slate-500 mb-0.5 font-mono">Col{i+1}</span>
                    <input type="number" value={p} onChange={(e) => handleUpdate(i, e.target.value)} className="w-full bg-[#0a1e35] border border-white/5 rounded p-1 text-center text-[10px] text-cyan-400 focus:border-[#f0a500] outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <button onClick={() => callApi('/predict', true)} disabled={loading} className="w-full py-6 bg-[#f0a500] text-[#0a2a4f] rounded-3xl font-black text-2xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-4">
              {loading ? <RefreshCw className="animate-spin" size={28} /> : <Play fill="currentColor" size={28} />} تحليل الإشارة
            </button>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
              <h3 className="text-[#f0a500] font-bold mb-4 flex items-center gap-2"><Activity /> تصور الموجة</h3>
              <div className="bg-[#0a1e35] rounded-2xl min-h-[200px] flex items-center justify-center border border-white/5 overflow-hidden">
                {result?.waveform_img ? (
                  <img src={`data:image/png;base64,${result.waveform_img}`} alt="Signal" className="w-full" />
                ) : (
                  <p className="text-slate-600 italic">بانتظار التحليل...</p>
                )}
              </div>
            </div>

            {result && (
              <div className={`p-8 rounded-3xl border-l-8 shadow-2xl ${result.class === 'Normal' ? 'bg-cyan-900/20 border-cyan-400' : 'bg-red-900/20 border-red-500'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase">النتيجة</p>
                    <h2 className="text-3xl font-black mt-1">{result.class}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase">الثقة</p>
                    <p className="text-3xl font-black text-[#f0a500]">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
