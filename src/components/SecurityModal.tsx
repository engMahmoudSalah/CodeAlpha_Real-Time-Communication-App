import React from 'react';
import { RoomSecurityInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  X,
  Copy,
  Check
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityInfo: RoomSecurityInfo | null;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  securityInfo,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const isDark = theme === 'dark';

  if (!isOpen || !securityInfo) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(securityInfo.verificationWords.join(' ')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-xl border shadow-xl p-6 sm:p-7 relative transition-colors ${
          isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Telemetry Header */}
        <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pb-3 mb-4 border-b border-dashed border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>TELEMETRY // CRYPTOGRAPHIC AUDIT</span>
          </span>
          <span>AES-GCM-256</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors ${
            isDark ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850' : 'text-slate-400 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              End-to-End Cryptography
            </h2>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Zero-knowledge ephemeral peer mesh
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          {/* Security Status Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className={`font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-900'}`}>
                SESSION_PROTECTED // 100% SECURE
              </p>
              <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Messages, shared files, and collaboration are encrypted directly between participant browser tabs. No intermediate server holds decryption keys.
              </p>
            </div>
          </div>

          {/* Verification Words */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-[11px] font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                VERIFICATION_SAS_TOKENS
              </label>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div
              className={`p-3 rounded-xl border grid grid-cols-2 gap-2 text-center font-mono font-bold text-xs ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {securityInfo.verificationWords.map((word, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 px-2 rounded-lg border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
            <p className={`text-[10px] font-mono mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Compare these SAS tokens verbally with other participants to confirm zero MITM tampering.
            </p>
          </div>

          {/* Details */}
          <div
            className={`p-3 rounded-xl border space-y-1.5 text-xs font-mono ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>ROOM_IDENTIFIER:</span>
              <span className="font-mono font-bold">{securityInfo.roomId}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>CIPHER_SUITE:</span>
              <span className="font-semibold text-emerald-500">AES-GCM-256 (WebCrypto)</span>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            Dismiss Audit
          </button>
        </div>
      </div>
    </div>
  );
};
