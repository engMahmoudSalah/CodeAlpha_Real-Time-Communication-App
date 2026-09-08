import React, { useState, useEffect } from 'react';
import { MediaDeviceSettings } from '../types';
import { attachAudioMeter } from '../lib/audioMeter';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  Camera,
  Mic,
  Volume2,
  Sliders,
  Sparkles,
  X,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MediaDeviceSettings;
  onSaveSettings: (newSettings: MediaDeviceSettings) => void;
  localStream: MediaStream | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  localStream,
}) => {
  const { theme } = useTheme();
  const [currentSettings, setCurrentSettings] = useState<MediaDeviceSettings>(settings);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [testVolume, setTestVolume] = useState(0);

  const isDark = theme === 'dark';

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Enumerate devices
  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        setAudioInputDevices(devices.filter((d) => d.kind === 'audioinput'));
        setAudioOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
      } catch (err) {
        console.warn('Failed to enumerate media devices:', err);
      }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, [isOpen]);

  // Audio meter test
  useEffect(() => {
    if (!isOpen || !localStream) {
      setTestVolume(0);
      return;
    }

    const meter = attachAudioMeter(localStream, (level) => {
      setTestVolume(level);
    });

    return () => meter.stop();
  }, [isOpen, localStream]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onClose();
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
            <span>HARDWARE // I/O PERIPHERALS</span>
          </span>
          <span>WEBRTC MEDIA ENGINE</span>
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
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Device Configuration
            </h2>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Hardware drivers and video encoder bitrates
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Camera Selection */}
          <div>
            <label className={`block text-[11px] font-mono font-medium mb-1.5 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>CAMERA_INPUT</span>
            </label>
            <select
              value={currentSettings.videoInputId}
              onChange={(e) =>
                setCurrentSettings((prev) => ({ ...prev, videoInputId: e.target.value }))
              }
              className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="">Default System Camera</option>
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div>
            <label className={`block text-[11px] font-mono font-medium mb-1.5 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Mic className="w-3.5 h-3.5 text-emerald-500" />
              <span>MICROPHONE_INPUT</span>
            </label>
            <select
              value={currentSettings.audioInputId}
              onChange={(e) =>
                setCurrentSettings((prev) => ({ ...prev, audioInputId: e.target.value }))
              }
              className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="">Default System Microphone</option>
              {audioInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>

            {/* Test Volume Gauge */}
            <div className="mt-2 flex items-center space-x-2">
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>VU_TEST:</span>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, testVolume * 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Speaker / Output Selection */}
          {audioOutputDevices.length > 0 && (
            <div>
              <label className={`block text-[11px] font-mono font-medium mb-1.5 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>SPEAKER_OUTPUT</span>
              </label>
              <select
                value={currentSettings.audioOutputId}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, audioOutputId: e.target.value }))
                }
                className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-400 border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="">Default System Speaker</option>
                {audioOutputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Video Resolution */}
          <div>
            <label className={`block text-[11px] font-mono font-medium mb-1.5 flex items-center space-x-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>ENCODER_RESOLUTION</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '360p'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setCurrentSettings((prev) => ({ ...prev, resolution: res }))}
                  className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                    currentSettings.resolution === res
                      ? 'bg-black text-white dark:bg-white dark:text-slate-950 border-black dark:border-white shadow-xs'
                      : isDark
                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {res.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Background Blur */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <div>
                <p className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  AI_SEGMENTATION_BLUR
                </p>
                <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Softly obscures physical background
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentSettings.virtualBackgroundBlur}
              onChange={(e) =>
                setCurrentSettings((prev) => ({
                  ...prev,
                  virtualBackgroundBlur: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Save & Apply Button */}
        <div className="mt-5 flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 border rounded-xl text-xs font-mono transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
