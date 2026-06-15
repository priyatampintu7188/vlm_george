import React, { useState, useRef } from 'react';
import { Upload, Loader2, LogOut, ImageIcon, AlertTriangle, Car, FileVideo } from 'lucide-react';
import type { User, DiagramResult } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

const DiagramPortal: React.FC<Props> = ({ user, onLogout }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<DiagramResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const samples = [
    { name: 'Collision 1', url: '/samples/sample_video.mp4' },
    { name: 'Collision 2', url: '/samples/sample_video2.mp4' },
  ];

  const handleSampleClick = async (sample: { name: string, url: string }) => {
    try {
      setLoading(true);
      setProgress(`Loading sample ${sample.name}...`);
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], sample.url.split('/').pop() || 'sample.mp4', { type: 'video/mp4' });
      setVideoFile(file);
      setVideoPreviewUrl(sample.url);
      setResult(null);
      setError('');
    } catch (err) {
      setError('Failed to load sample video.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError('');
    setProgress('Uploading video and extracting frames...');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      setProgress('Analyzing with VLM (this may take 30-60 seconds)...');
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const data: DiagramResult = await res.json();
      setResult(data);
      setProgress('');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">Accident Scene Analyzer</h1>
            <p className="text-xs text-slate-400">Video-to-Diagram Pipeline</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 font-medium">{user.username}</span>
          <button onClick={onLogout} className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT Panel: Upload */}
        <section className="w-1/2 p-6 flex flex-col border-r border-slate-200 overflow-y-auto">
          <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-indigo-500" /> Upload Video
          </h2>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3"
          >
            <Upload className="w-10 h-10 text-slate-400" />
            <p className="text-slate-500 font-medium">Drop a video file here or click to browse</p>
            <p className="text-xs text-slate-400">Supports MP4, AVI, MOV, MKV</p>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
          </div>

          {/* Sample Videos */}
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Try a Sample Video</p>
            <div className="flex gap-2">
              {samples.map((s) => (
                <button
                  key={s.url}
                  onClick={() => handleSampleClick(s)}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <FileVideo className="w-4 h-4 text-indigo-400" /> {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Video Preview */}
          {videoPreviewUrl && (
            <div className="mt-6">
              <p className="text-sm font-bold text-slate-600 mb-2">Preview: {videoFile?.name}</p>
              <video src={videoPreviewUrl} controls className="w-full rounded-xl border border-slate-200 shadow-sm max-h-[350px]" />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="mt-4 w-full py-3 text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                ) : (
                  <><ImageIcon className="w-5 h-5" /> Generate Accident Diagram</>
                )}
              </button>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {progress}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
        </section>

        {/* RIGHT Panel: Result */}
        <section className="w-1/2 p-6 overflow-y-auto bg-white">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <ImageIcon className="w-20 h-20 mb-4" />
              <p className="text-lg font-medium">Diagram will appear here</p>
              <p className="text-sm">Upload a video and click "Generate"</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-500" /> Analysis Result
              </h2>

              {/* Diagram Image */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <img src={`data:image/png;base64,${result.diagram_b64}`} alt="Accident Diagram" className="w-full" />
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-2">Accident Summary</h3>
                <p className="text-sm text-slate-600">{result.analysis.accident_summary}</p>
              </div>

              {/* Fault */}
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h3 className="font-bold text-red-700 mb-2">Fault Assessment</h3>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  At-Fault: Vehicle {result.analysis.fault_assessment.at_fault_vehicle_id}
                </p>
                <p className="text-sm text-slate-600">{result.analysis.fault_assessment.rationale}</p>
              </div>

              {/* Involvement */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-3">Vehicle Involvement</h3>
                <div className="space-y-2">
                  {result.analysis.involvement.map((v) => (
                    <div key={v.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.role === 'Striking' ? 'bg-red-100 text-red-700' : v.role === 'Struck' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        V{v.id} · {v.role}
                      </span>
                      <p className="text-sm text-slate-600 flex-1">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download */}
              <a
                href={`data:image/png;base64,${result.diagram_b64}`}
                download="accident_diagram.png"
                className="block text-center py-3 text-sm font-bold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Download Diagram PNG
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DiagramPortal;
