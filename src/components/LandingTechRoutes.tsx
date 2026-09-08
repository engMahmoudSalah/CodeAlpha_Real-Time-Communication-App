import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Network,
  Cpu,
  Lock,
  ArrowRight,
  Shield,
  Key,
  Server,
  Code,
  CheckCircle,
  Eye,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const LandingTechRoutes: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeSchemaTab, setActiveSchemaTab] = useState<'signaling' | 'cryptography' | 'mesh'>('signaling');

  return (
    <div className="w-full relative transition-colors duration-150">
      {/* Precision Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none h-[1200px] ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />

      {/* Top Editorial Corner Markers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-6 sm:pt-10">
        <div className="flex items-center justify-between text-[11px] font-mono opacity-50 pb-4 border-b border-dashed border-slate-300 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>BLUEPRINT // PROTOCOL ROUTING</span>
          </span>
          <span className="hidden sm:inline">ZERO SERVER RELAY</span>
          <span>TOPOLOGY // P2P MESH MESH</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Decentralized Architecture Routes
          </h1>
          <p className={`text-xs sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Meetly represents an intentional departure from traditional centralized video architectures. Read on to inspect our technical protocols, routing layers, and cryptographic primitives.
          </p>
        </div>

        {/* Technical Routing Interactive Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto mb-20">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2 text-left">
            {[
              {
                id: 'signaling',
                title: '1. Signaling & Handshake Route',
                tag: 'WebRTC SDP // Ephemeral',
                desc: 'How peer SDP exchanges, ICE candidates, and handshakes are established without central persistent logging.',
              },
              {
                id: 'cryptography',
                title: '2. On-Device Key Derivation',
                tag: 'Web Cryptography API',
                desc: 'How PBKDF2 with SHA-256 derives 256-bit AES-GCM symmetric keys locally inside sandboxed browser tabs.',
              },
              {
                id: 'mesh',
                title: '3. Mesh Node Routing Grid',
                tag: 'Peer-to-Peer Mesh Lattice',
                desc: 'How connections are established dynamically in an N*(N-1)/2 mesh node lattice for minimal streaming hop counts.',
              },
            ].map((sch) => {
              const isSel = activeSchemaTab === sch.id;
              return (
                <button
                  key={sch.id}
                  onClick={() => setActiveSchemaTab(sch.id as any)}
                  className={`w-full text-left p-5 rounded-xl border transition-all focus:outline-none block ${
                    isSel
                      ? isDark
                        ? 'bg-[#0f1422] border-slate-700 shadow-sm ring-1 ring-white/10'
                        : 'bg-white border-slate-400 shadow-sm ring-1 ring-black/5'
                      : isDark
                      ? 'bg-slate-950/40 border-slate-900 text-slate-400 hover:bg-slate-900/40'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isSel ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{sch.tag}</span>
                    {isSel && <Sliders className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />}
                  </div>
                  <h3 className={`text-sm sm:text-base font-extrabold mt-1.5 ${isSel ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                    {sch.title}
                  </h3>
                  <p className={`text-[11px] leading-relaxed mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {sch.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Conceptual Schema Diagram Window */}
          <div className="lg:col-span-8">
            <div
              className={`w-full rounded-xl border shadow-sm p-6 sm:p-8 min-h-[440px] flex flex-col justify-between ${
                isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Tab Header */}
              <div className="flex items-center space-x-2.5 mb-6">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                  <Code className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                  {activeSchemaTab === 'signaling' && 'SIGNAL // EXCHANGE PROTOCOL BLUEPRINT'}
                  {activeSchemaTab === 'cryptography' && 'CRYPTO // LOCAL AES-GCM KEY DERIVATION'}
                  {activeSchemaTab === 'mesh' && 'TOPOLOGY // MESH NODE NETWORK LATTICE'}
                </span>
              </div>

              {/* Content Body based on tab */}
              <div className="flex-1 text-left space-y-6">
                {activeSchemaTab === 'signaling' && (
                  <>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      WebRTC requires an ephemeral <strong>Signaling Channel</strong> to coordinate handshakes. Meetly utilizes an ephemeral socket-routing layer backed by secure room channels. No call payloads (video packets, audio tracks) ever pass through this layer—only SDP tokens and ICE Candidates.
                    </p>

                    {/* Flow Steps Graphic */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">STEP 1</span>
                        <span className="text-xs font-bold block mt-1">Initiator Offer</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Client generates WebRTC Session offer SDP and publishes to signaling channel.</p>
                      </div>
                      <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">STEP 2</span>
                        <span className="text-xs font-bold block mt-1">Ephemeral Relay</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Coordinates SDP delivery to registered peer IDs with zero persistence.</p>
                      </div>
                      <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">STEP 3</span>
                        <span className="text-xs font-bold block mt-1">Direct Connection</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">ICE candidate routing succeeds, and visual media switches to pure direct P2P streams.</p>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 font-mono text-xs ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Signal Transparency:</strong> Once WebRTC peers establish state, the signaling channel sits dormant, maintaining absolute direct peer communication.</span>
                    </div>
                  </>
                )}

                {activeSchemaTab === 'cryptography' && (
                  <>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      We guarantee zero-knowledge video calling by deriving keys directly on client tabs. The room passphrase and ID never leave your machine in raw form. We employ native Web Cryptography API primitives.
                    </p>

                    {/* Schema Steps */}
                    <div className={`p-4 rounded-xl border font-mono text-[10px] sm:text-xs leading-relaxed space-y-2 ${isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-500">1. Raw Input:</span>
                        <span>[User Passphrase] + [Room ID acting as Salt]</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-500">2. Derivation:</span>
                        <span>PBKDF2 (SHA-256) stretching iterations to 100,000 rounds.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-500">3. Derived Key:</span>
                        <span>256-bit AES-GCM Symmetric Key context established.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-emerald-500">4. Encryption:</span>
                        <span>Text chats and drawing files are symmetrically ciphered in-memory.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold">Web Cryptography Standard compliance</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-semibold">No storage of private keys in localDB or cloud</span>
                      </div>
                    </div>
                  </>
                )}

                {activeSchemaTab === 'mesh' && (
                  <>
                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      Rather than a star-topology (where everyone streams to a central server SFU which forwards packets), Meetly establishes a dynamic, peer-to-peer <strong>Mesh Lattice</strong>. Every node in the room connects directly with every other node.
                    </p>

                    {/* Mesh Diagram simulated */}
                    <div className="relative h-24 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
                      <div className="flex items-center justify-around w-full max-w-sm relative z-10">
                        {['Node Alpha', 'Node Bravo', 'Node Charlie'].map((node, i) => (
                          <div key={i} className="flex flex-col items-center space-y-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-white shadow-xs">
                              P{i+1}
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-400">{node}</span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 border-t-2 border-dashed border-slate-800 top-1/2 -translate-y-1/2 w-2/3 left-1/6" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">LATENCY_BENEFIT:</span>
                        <p className="text-[11px] text-slate-500 leading-normal">Zero middle-man buffering means video packets take the absolute shortest route over IP routing.</p>
                      </div>
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">SECURITY_ISOLATION:</span>
                        <p className="text-[11px] text-slate-500 leading-normal">Complete visual isolation where intermediate packet sniffers receive only encrypted bytes.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Tab Footer */}
              <div className={`mt-6 pt-4 border-t text-[11px] font-mono flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <span>MEETLY // BLUEPRINT SPEC v2.0</span>
                <span>WebRTC Native + Web Crypto API</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
