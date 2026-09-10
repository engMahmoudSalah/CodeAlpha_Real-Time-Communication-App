import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Video,
  PenTool,
  MessageSquare,
  Share2,
  Lock,
  Sparkles,
  Zap,
  Shield,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  RefreshCw,
  Send
} from 'lucide-react';

export const LandingFeatures: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activePlaygroundTab, setActivePlaygroundTab] = useState<'video' | 'whiteboard' | 'chat' | 'files'>('video');

  // Simulated Video states
  const [simCam, setSimCam] = useState(true);
  const [simMic, setSimMic] = useState(true);
  const [simLayout, setSimLayout] = useState<'grid' | 'spotlight'>('grid');

  // Interactive Mini Whiteboard states
  const [lines, setLines] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#6366f1');

  // Interactive Encrypted Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; encrypted: string; color: string; decrypted: boolean }[]
  >([
    {
      sender: 'Sarah (Frontend)',
      text: 'Have you verified the security keys for room meet-932?',
      encrypted: 'U2FsdGVkX19P8gOAnK6mZlqY2g1K...',
      color: '#db2777',
      decrypted: true,
    },
    {
      sender: 'Alex (Backend)',
      text: 'Yes! Fully symmetric. Checked the verification word hashes.',
      encrypted: 'RzE1aDhBMms5M2w0NmRmOThiMD...',
      color: '#4f46e5',
      decrypted: true,
    },
  ]);

  // Mini Drawing support
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLines([...lines, [{ x, y }]]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || lines.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lastLine = lines[lines.length - 1];
    const updatedLine = [...lastLine, { x, y }];
    const nextLines = [...lines];
    nextLines[nextLines.length - 1] = updatedLine;
    setLines(nextLines);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearMiniBoard = () => {
    setLines([]);
  };

  // Mini Chat Encrypter support
  const simulatedEncrypt = (str: string) => {
    if (!str) return '';
    return btoa(encodeURIComponent(str)).substring(0, 24) + '...[AES-GCM]';
  };

  const handleSendSimulatedChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const encryptedStr = simulatedEncrypt(chatInput);
    setChatMessages([
      ...chatMessages,
      {
        sender: 'You',
        text: chatInput,
        encrypted: encryptedStr,
        color: '#059669',
        decrypted: true,
      },
    ]);
    setChatInput('');
  };

  const toggleDecryptMessage = (idx: number) => {
    const next = [...chatMessages];
    next[idx].decrypted = !next[idx].decrypted;
    setChatMessages(next);
  };

  return (
    <div className="w-full relative overflow-hidden transition-colors duration-150">
      {/* Precision Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        {/* Intro Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Collaboration Engine Sandbox
          </h1>
          <p className={`text-xs sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Meetly integrates audio, HD video, whiteboard vectors, and peer chats into a single cohesive, sandboxed client interface. Click through the interactive modules below to test our client capabilities in real time.
          </p>
        </div>

        {/* Dynamic Interactive Playground */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto mb-20">
          {/* Tab Selection */}
          <div className="lg:col-span-4 flex flex-col justify-start space-y-2">
            {[
              {
                id: 'video',
                label: 'HD Mesh Video Calling',
                icon: <Video className="w-4 h-4 text-emerald-500" />,
                desc: 'High-definition WebRTC peer scaling with real-time adaptive speaking metrics.',
              },
              {
                id: 'whiteboard',
                label: 'Interactive Vector Board',
                icon: <PenTool className="w-4 h-4 text-emerald-500" />,
                desc: 'Collaborative vector board drawing with multiple cursors and path caching.',
              },
              {
                id: 'chat',
                label: 'Symmetric Encrypted Chat',
                icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
                desc: 'Decrypt chats locally on your tab. See raw ciphered bytes vs decrypted plain-text.',
              },
              {
                id: 'files',
                label: 'Peer-to-Peer File Transfer',
                icon: <Share2 className="w-4 h-4 text-emerald-500" />,
                desc: 'Secure sandboxed data streams directly to connected peers with no size limits.',
              },
            ].map((tab) => {
              const isSel = activePlaygroundTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePlaygroundTab(tab.id as any)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3.5 focus:outline-none ${
                    isSel
                      ? isDark
                        ? 'bg-[#0f1422] border-slate-700 shadow-sm ring-1 ring-white/10'
                        : 'bg-white border-slate-400 shadow-sm ring-1 ring-black/5'
                      : isDark
                      ? 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-white'
                      : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg border shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isSel ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                      {tab.label}
                    </h3>
                    <p className={`text-[11px] leading-relaxed mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Display Sandbox Stage */}
          <div className="lg:col-span-8 relative mt-6 lg:mt-0">
            <div
              className={`w-full h-[450px] rounded-xl border shadow-sm flex flex-col overflow-hidden relative ${
                isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Stage Header */}
              <div className={`h-11 px-4 border-b flex items-center justify-between shrink-0 font-mono ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300">MEETLY // CLIENT SANDBOX</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">P2P_LOCAL_ACTIVE</span>
                </div>
              </div>

              {/* Stage Content */}
              <div className="flex-1 overflow-hidden relative">
                {/* VIDEO PLAYGROUND */}
                {activePlaygroundTab === 'video' && (
                  <div className="w-full h-full p-4 flex flex-col justify-between">
                    {/* Mock Video Grid */}
                    <div className="grid grid-cols-2 gap-3 flex-1 mb-4">
                      {/* Block 1 (Local Participant Mock) */}
                      <div className="bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800 group">
                        {simCam ? (
                          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                              <User className="w-8 h-8 text-slate-300" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-500 mb-1">
                              <EyeOff className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">Camera Off</span>
                          </div>
                        )}
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded-md text-[9px] font-mono font-bold text-white border border-slate-800 flex items-center space-x-1">
                          {simMic && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />}
                          <span>YOU // LOCAL</span>
                        </div>
                      </div>

                      {/* Block 2 (Remote Participant Mock) */}
                      <div className="bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800">
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                            <User className="w-8 h-8 text-slate-300" />
                          </div>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded-md text-[9px] font-mono font-bold text-white border border-slate-800 flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>SARAH // REMOTE</span>
                        </div>
                      </div>
                    </div>

                    {/* Mock Action Controls */}
                    <div className="flex items-center justify-center space-x-3 shrink-0 py-1">
                      <button
                        onClick={() => setSimMic(!simMic)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all ${
                          simMic ? 'bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 border-transparent shadow-xs' : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}
                      >
                        {simMic ? 'Mute Microphone' : 'Unmute Microphone'}
                      </button>
                      <button
                        onClick={() => setSimCam(!simCam)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all ${
                          simCam ? 'bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 border-transparent shadow-xs' : 'bg-red-500/10 border-red-500/30 text-red-500'
                        }`}
                      >
                        {simCam ? 'Camera On' : 'Camera Off'}
                      </button>
                    </div>
                  </div>
                )}

                {/* WHITEBOARD PLAYGROUND */}
                {activePlaygroundTab === 'whiteboard' && (
                  <div className="w-full h-full flex flex-col">
                    {/* Drawing Toolbar */}
                    <div className="px-3 py-2 bg-slate-950/20 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-400">Brush Color:</span>
                        {['#10b981', '#6366f1', '#f59e0b', '#ef4444'].map((col) => (
                          <button
                            key={col}
                            onClick={() => setDrawColor(col)}
                            className={`w-4 h-4 rounded-full border transition-all ${
                              drawColor === col ? 'scale-125 ring-1 ring-slate-400 ring-offset-1' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={clearMiniBoard}
                        className="px-2 py-1 bg-red-500/15 text-red-500 border border-red-500/20 rounded-md text-[9px] font-mono font-bold hover:bg-red-500/25 transition-colors flex items-center space-x-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>CLEAR CANVAS</span>
                      </button>
                    </div>

                    {/* Draw Box */}
                    <div className="flex-1 relative bg-slate-950">
                      <svg
                        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        {lines.map((line, i) => (
                          <path
                            key={i}
                            d={`M ${line.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                            fill="none"
                            stroke={drawColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ))}
                      </svg>

                      {lines.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                          <span className="text-[11px] font-mono text-slate-500">Click & drag your cursor inside this window to test drawing vectors</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CHAT PLAYGROUND */}
                {activePlaygroundTab === 'chat' && (
                  <div className="w-full h-full flex flex-col justify-between bg-slate-950">
                    {/* Messages */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 scrollbar-thin">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className="text-left space-y-1 max-w-[85%]">
                          <div className="flex items-center space-x-1.5 text-[9px] font-mono text-slate-400">
                            <span style={{ color: msg.color }}>{msg.sender}</span>
                            <span>•</span>
                            <button
                              onClick={() => toggleDecryptMessage(i)}
                              className="text-slate-300 hover:underline hover:text-white inline-flex items-center space-x-0.5 font-mono text-[9px]"
                            >
                              <span>{msg.decrypted ? '[VIEW CIPHER]' : '[VIEW DECRYPTED]'}</span>
                            </button>
                          </div>
                          <div
                            className={`p-2.5 rounded-xl text-[11px] leading-relaxed border font-mono ${
                              msg.decrypted
                                ? isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                                  : 'bg-slate-900 border-slate-850 text-slate-100'
                                : 'bg-red-950/20 border-red-500/20 text-[10px] text-red-400 break-all'
                            }`}
                          >
                            {msg.decrypted ? msg.text : msg.encrypted}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendSimulatedChat} className="p-2 border-t border-slate-800 flex items-center space-x-2 shrink-0 bg-slate-950">
                      <input
                        type="text"
                        placeholder="Type a message to encrypt locally..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-black hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 rounded-lg transition-all shadow-xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}

                {/* FILE SHARING PLAYGROUND */}
                {activePlaygroundTab === 'files' && (
                  <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-slate-950">
                    <div className="max-w-md space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-white">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-100">Zero-Server WebRTC Data Streams</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Rather than uploading files to a cloud server and forcing participants to download them via public links, Meetly creates point-to-point chunk streams directly through the sandboxed RTCDataChannel.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 inline-flex items-center space-x-3 text-left">
                        <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="text-[10px] font-mono font-bold block text-slate-300">LOCAL SYMMETRIC ENVELOPE</span>
                          <p className="text-[9px] text-slate-500 leading-none mt-0.5">Files are sliced and cryptographically ciphered before peer streaming.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Structured Topic Sections */}
        <section className="mt-20 border-t border-dashed border-slate-300 dark:border-slate-800 pt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white mb-2">WEBRTC_MESH_VS_SFU</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Traditional platforms route audio/video signals through a centralized server (Selective Forwarding Unit / SFU). Meetly establishes direct P2P mesh links, giving you absolute visual isolation and making central server eavesdropping mathematically impossible.
            </p>
          </div>
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white mb-2">AES_GCM_256_SYMMETRIC</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Every room utilizes a unique cryptographic session context. Symmetric 256-bit Galois/Counter Mode keys are generated entirely locally on the user's browser, preventing man-in-the-middle decryption.
            </p>
          </div>
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-white mb-2">P2P_VECTOR_PIPELINES</h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Our multi-cursor vector board shares lightweight, math-based draw vectors instead of heavy image tiles. This preserves peak responsiveness even on low-bandwidth connections or complex diagrams.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
