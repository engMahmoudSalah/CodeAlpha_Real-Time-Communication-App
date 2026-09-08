import React, { useState, useRef } from 'react';
import { SharedFile, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  UploadCloud,
  File,
  Download,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface FileSharingPanelProps {
  currentUser: User;
  sharedFiles: SharedFile[];
  onUploadFile: (file: File) => void;
  onDownloadFile: (fileId: string) => void;
  onClose: () => void;
}

export const FileSharingPanel: React.FC<FileSharingPanelProps> = ({
  currentUser,
  sharedFiles,
  onUploadFile,
  onDownloadFile,
  onClose,
}) => {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDark = theme === 'dark';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onUploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadge = (type: string, name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    let colorClass = 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    if (type.startsWith('image/')) colorClass = 'bg-purple-500/20 text-purple-500 border-purple-500/30';
    else if (type.includes('pdf')) colorClass = 'bg-red-500/20 text-red-500 border-red-500/30';
    else if (type.includes('zip') || type.includes('compressed')) colorClass = 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    else if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) colorClass = 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';

    return (
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold border shrink-0 ${colorClass}`}>
        {ext.slice(0, 4)}
      </div>
    );
  };

  return (
    <div
      className={`w-full sm:w-80 md:w-96 h-full flex flex-col rounded-xl border shadow-xl z-30 overflow-hidden transition-colors ${
        isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-lg'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2">
            <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>TRANSFERS ({sharedFiles.length})</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-mono font-semibold border border-emerald-500/20 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>E2EE</span>
            </span>
          </h3>
          <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Direct peer-to-peer data channels
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-850' : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
          }`}
          title="Close Files"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload Zone */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-950/30' : 'border-slate-200 bg-slate-50/50'}`}>
        <input
          ref={fileInputRef}
          type="file"
          id="hidden-file-input"
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : isDark
              ? 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
              : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 mx-auto mb-2">
            <UploadCloud className="w-4 h-4" />
          </div>
          <p className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            CLICK_TO_UPLOAD // DRAG_DROP
          </p>
          <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Documents, archives, code, media
          </p>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2.5 font-mono">
        {sharedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
              <File className="w-5 h-5" />
            </div>
            <p className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>NO_FILES_TRANSMITTED</p>
            <p className={`text-[10px] font-mono mt-1 max-w-[200px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Drop artifacts here to distribute via WebRTC data channel.
            </p>
          </div>
        ) : (
          sharedFiles.map((file) => {
            const isMe = file.senderId === currentUser.id;
            const timeFormatted = new Date(file.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={file.id}
                className={`p-3 rounded-xl border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getFileBadge(file.type, file.name)}

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {file.name}
                    </p>
                    <div className={`flex items-center space-x-1.5 text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>{formatFileSize(file.size)}</span>
                      <span>&bull;</span>
                      <span>{isMe ? 'You' : file.senderName}</span>
                      <span>&bull;</span>
                      <span>{timeFormatted}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDownloadFile(file.id)}
                    className="p-2 bg-black hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg transition-all shadow-xs shrink-0"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
