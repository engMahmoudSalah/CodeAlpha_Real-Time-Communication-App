import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Send,
  ShieldCheck,
  Smile,
  X,
  Lock,
  MessageSquare
} from 'lucide-react';

interface ChatPanelProps {
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
  isE2EEActive: boolean;
}

const QUICK_EMOJIS = ['👍', '👏', '🎉', '❤️', '🔥', '💡', '🚀', '✋'];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUser,
  messages,
  onSendMessage,
  onClose,
  isE2EEActive,
}) => {
  const { theme } = useTheme();
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark';

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div
      className={`absolute sm:relative inset-y-0 right-0 sm:right-auto z-50 sm:z-30 w-full sm:w-80 md:w-96 h-full flex flex-col rounded-xl border shadow-2xl overflow-hidden font-mono transition-colors ${
        isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3.5 sm:p-4 border-b ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              MEETLY // CHAT
            </h3>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
              AES-256
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            P2P DataChannel &bull; Zero Server Storage
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDark ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
          }`}
          title="Close Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No messages yet</p>
            <p className={`text-[11px] mt-1 max-w-[200px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Say hello to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name & time */}
                <div className={`flex items-center space-x-1.5 mb-1 px-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span>&bull;</span>
                  <span>{timeFormatted}</span>
                </div>

                {/* Message Bubble */}
                {(() => {
                  const rawText = msg.decryptedText || msg.text || '';
                  const hasImageData = rawText.includes('data:image/');
                  let textDisplay = rawText;
                  let imageUrl = msg.dataUrl || '';

                  if (hasImageData) {
                    const match = rawText.match(/(data:image\/[a-zA-Z]+;base64,[^\s"']+)/);
                    if (match) {
                      imageUrl = match[1];
                      textDisplay = rawText.replace(match[0], '').replace(/!\[.*?\]\(\)/g, '').trim();
                    }
                  }

                  return (
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700'
                          : 'bg-slate-100 text-slate-900 rounded-tl-xs border border-slate-200'
                      }`}
                    >
                      {textDisplay && <p className="whitespace-pre-wrap">{textDisplay}</p>}
                      {imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-500/30 bg-slate-950/40 p-1">
                          <img
                            src={imageUrl}
                            alt="Shared Whiteboard Snapshot"
                            className="w-full max-h-52 object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(imageUrl, '_blank')}
                            title="Click to view full size"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Drawer */}
      {showEmojiPicker && (
        <div
          className={`px-3 py-2 border-t flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className={`text-base p-1.5 rounded-lg transition-transform hover:scale-125 ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className={`p-2.5 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors border ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Insert Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          <input
            type="text"
            id="chat-message-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message & enter..."
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />

          <button
            type="submit"
            id="chat-send-btn"
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white rounded-lg shadow-xs transition-all flex items-center justify-center shrink-0"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
