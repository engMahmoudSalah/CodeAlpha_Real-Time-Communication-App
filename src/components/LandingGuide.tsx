import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  HelpCircle,
  Video,
  Mic,
  PenTool,
  Lock,
  ArrowRight,
  Shield,
  MessageSquare,
  Share2,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LandingGuide: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Spin Up or Join a Secure Room',
      desc: 'Enter a clean room ID (e.g. meet-design-review) or click "Generate Code" on your dashboard. To secure the room with symmetric cryptography, add a secure passcode. Anyone who enters the correct room ID and passcode will automatically establish the exact same local cryptographic keys inside their browser.',
      tip: 'The room passcode is never saved on our databases, so remember to share it securely via other channels.',
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: 'Hardware & Device Verification',
      desc: 'Before stepping into the live meeting, our Pre-call Lobby initiates a safe visual pre-view. Here, you can toggle your camera, mute your microphone, and select your preferred hardware inputs. Speak into your mic to test the interactive green decibel indicator.',
      tip: 'Always grant camera/mic permissions to let WebRTC establish direct video tracks.',
      icon: <Video className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: 'Real-time Vector Whiteboarding',
      desc: 'Inside the meeting, expand the Whiteboard drawing panel. Choose your brush color and draw diagrams or highlight items. Because drawing is vector-based, you will see your peers drawing live cursors and high-precision visual paths with negligible network overhead.',
      tip: 'The whiteboard syncs history automatically when new participants join.',
      icon: <PenTool className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: 'End-to-End Cryptography check',
      desc: 'Click on the "E2EE Encrypted" badge in the header. Meetly displays 5 secure verification words (e.g. Amber - Echo - Falcon - Indigo - Sierra). Compare these words with your peers verbally. If they match, it mathematically proves your direct mesh links are secured with no middle-man sniffing.',
      tip: 'This fingerprint matches the SHA-256 hash of your derived symmetric key.',
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
    },
  ];

  return (
    <div className="w-full relative overflow-hidden transition-colors duration-150">
      {/* Precision Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark ? 'bg-tech-grid-dark mask-radial' : 'bg-tech-grid-light mask-radial'
        }`}
      />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Interactive User Playbook
          </h1>
          <p className={`text-xs sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Starting private peer video sessions should be simple. Read through our 4-step playbook to master the platform.
          </p>
        </div>

        {/* Guide Stepper Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
          {/* Left Steps Indicators */}
          <div className="lg:col-span-5 flex flex-col space-y-2">
            {steps.map((step, idx) => {
              const isSel = activeStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-4 focus:outline-none ${
                    isSel
                      ? isDark
                        ? 'bg-[#0f1422] border-slate-700 shadow-sm ring-1 ring-white/10'
                        : 'bg-white border-slate-400 shadow-sm ring-1 ring-black/5'
                      : isDark
                      ? 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/50'
                      : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center font-mono font-bold text-xs ${
                    isSel
                      ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-transparent'
                      : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className={`text-xs sm:text-sm font-bold ${isSel ? (isDark ? 'text-white' : 'text-slate-900') : ''}`}>
                      {step.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Active Card Details */}
          <div className="lg:col-span-7 relative">
            <div
              className={`relative rounded-xl border shadow-sm p-6 sm:p-8 text-left ${
                isDark ? 'bg-[#0f1422] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                  {steps[activeStep].icon}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">STEP // 0{activeStep + 1}</span>
                  <h2 className="text-lg sm:text-xl font-bold">{steps[activeStep].title}</h2>
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {steps[activeStep].desc}
              </p>

              {/* Quick Warning / Tip Box */}
              <div className={`p-4 rounded-xl border flex items-start space-x-2.5 text-xs font-mono ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>TIP:</strong> {steps[activeStep].tip}</span>
              </div>

              {/* Pagination Button */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs font-mono font-semibold text-slate-500">PHASE 0{activeStep + 1} / 04</span>
                <button
                  onClick={() => setActiveStep((prev) => (prev + 1) % 4)}
                  className="h-10 px-5 bg-black hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 shadow-xs"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
