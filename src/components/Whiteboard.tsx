import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WhiteboardTool, WhiteboardAction, WhiteboardCursor, User, DrawPoint } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  MousePointer,
  Pen,
  Highlighter,
  Eraser,
  Minus,
  Square,
  Circle,
  ArrowRight,
  Type,
  StickyNote,
  Zap,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid,
  Undo2,
  Redo2,
  Trash2,
  Download,
  X,
  Palette,
  Sliders,
  Copy,
  Edit3,
  ArrowUp,
  ArrowDown,
  Layers,
  Plus,
  Share2,
  MessageSquare,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileText,
  LayoutGrid,
  Search,
  ArrowLeft,
  Calendar,
  FolderPlus,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  MoreVertical,
  MoreHorizontal
} from 'lucide-react';

interface WhiteboardProps {
  currentUser: User;
  actions: WhiteboardAction[];
  remoteCursors: Map<string, WhiteboardCursor>;
  onEmitAction: (action: WhiteboardAction) => void;
  onEmitCursor: (coords: { x: number; y: number }) => void;
  onClose: () => void;
  onSendMessage?: (text: string) => void;
}

const COLOR_PALETTE = [
  '#3b82f6', // Indigo Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ffffff', // White
  '#1e293b', // Dark Slate
];

const STICKY_COLORS = [
  { name: 'Yellow', bg: '#fef08a', text: '#713f12' },
  { name: 'Pink', bg: '#fbcfe8', text: '#831843' },
  { name: 'Blue', bg: '#bae6fd', text: '#0369a1' },
  { name: 'Green', bg: '#bbf7d0', text: '#14532d' },
  { name: 'Orange', bg: '#fed7aa', text: '#7c2d12' },
  { name: 'Purple', bg: '#e9d5ff', text: '#581c87' },
];

const STROKE_SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Bold', value: 16 },
];

interface BoardPage {
  id: string;
  name: string;
  createdAt?: number;
  color?: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  currentUser,
  actions,
  remoteCursors,
  onEmitAction,
  onEmitCursor,
  onClose,
  onSendMessage,
}) => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View Mode: 'grid' for Cards Gallery view, 'canvas' for editing a single board
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('canvas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multiple Whiteboards / Pages State
  const [boards, setBoards] = useState<BoardPage[]>([
    { id: 'board_1', name: 'Board 1', createdAt: Date.now() },
  ]);
  const [activeBoardId, setActiveBoardId] = useState<string>('board_1');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState<string>('');

  // Toast & Modal Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);

  // Active Tool & Style Config
  const [activeTool, setActiveTool] = useState<WhiteboardTool>('select');
  const [activeColor, setActiveColor] = useState('#3b82f6');
  const [activeStickyBg, setActiveStickyBg] = useState('#fef08a');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isFilled, setIsFilled] = useState(false);
  const [fillColor, setFillColor] = useState('rgba(59, 130, 246, 0.2)');
  const [bgPattern, setBgPattern] = useState<'dots' | 'grid' | 'lines' | 'blank'>('dots');

  // Toolbar Position, Collapsible & Size / Compactness Config
  const [toolbarPosition, setToolbarPosition] = useState<'left' | 'top' | 'right'>('left');
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState<boolean>(false);
  const [toolbarSize, setToolbarSize] = useState<'full' | 'compact' | 'minimal'>('full');
  const [activeGroupOpen, setActiveGroupOpen] = useState<'draw' | 'shapes' | 'layout' | null>(null);

  // Zoom & Pan Canvas Transform State
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing & Cursor Hover State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawPoint[]>([]);
  const [startPoint, setStartPoint] = useState<DrawPoint | null>(null);
  const [hoverCoords, setHoverCoords] = useState<DrawPoint | null>(null);

  // Selection & Manipulation State
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [isDraggingSelected, setIsDraggingSelected] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<DrawPoint | null>(null);
  const [activeResizeHandle, setActiveResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | null>(null);

  // Editing Modal State for Text / Sticky
  const [editingAction, setEditingAction] = useState<WhiteboardAction | null>(null);
  const [editingText, setEditingText] = useState('');

  // Laser Pointer Trails
  const [laserPoints, setLaserPoints] = useState<{ x: number; y: number; time: number }[]>([]);

  // History & Redo Stacks
  const [localHistory, setLocalHistory] = useState<WhiteboardAction[]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardAction[]>([]);

  // Text & Sticky Input Creation
  const [textInputPos, setTextInputPos] = useState<DrawPoint | null>(null);
  const [textContent, setTextContent] = useState('');
  const [stickyInputPos, setStickyInputPos] = useState<DrawPoint | null>(null);
  const [stickyContent, setStickyContent] = useState('');

  // UI Panels
  const [showSettings, setShowSettings] = useState(false);
  const [exportFormat] = useState<'png' | 'jpeg'>('png');

  const isDark = theme === 'dark';

  // Automatically close settings dropdown when user is actively moving, resizing, drawing, or panning
  useEffect(() => {
    if (isDraggingSelected || activeResizeHandle || isDrawing || isPanning) {
      setShowSettings(false);
      setActiveGroupOpen(null);
    }
  }, [isDraggingSelected, activeResizeHandle, isDrawing, isPanning]);

  // Board Pages Management Handlers
  const handleAddBoard = (shouldOpen: boolean = true) => {
    const newId = `board_${Date.now()}`;
    const newName = `Board ${boards.length + 1}`;
    const newBoard = { id: newId, name: newName, createdAt: Date.now() };
    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newId);
    setSelectedActionId(null);
    if (shouldOpen) {
      setViewMode('canvas');
    }
    setToastMessage(`Created ${newName}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDuplicateBoard = (sourceBoardId: string) => {
    const sourceBoard = boards.find((b) => b.id === sourceBoardId);
    const newId = `board_${Date.now()}`;
    const newName = `${sourceBoard ? sourceBoard.name : 'Board'} (Copy)`;

    setBoards((prev) => [...prev, { id: newId, name: newName, createdAt: Date.now() }]);

    const sourceActions = actions.filter(
      (act) => !act.isDeleted && (act.boardId === sourceBoardId || (!act.boardId && sourceBoardId === 'board_1'))
    );

    sourceActions.forEach((act) => {
      const clonedAction: WhiteboardAction = {
        ...act,
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        boardId: newId,
        timestamp: Date.now(),
        userId: currentUser.id,
        userName: currentUser.name,
      };
      onEmitAction(clonedAction);
    });

    setToastMessage(`Duplicated as "${newName}"`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeleteBoard = (boardIdToDelete: string) => {
    if (boards.length <= 1) {
      setShowClearConfirmModal(true);
      return;
    }
    // Remove all actions associated with this board
    actions
      .filter((act) => act.boardId === boardIdToDelete || (!act.boardId && boardIdToDelete === 'board_1'))
      .forEach((act) => {
        onEmitAction({
          ...act,
          type: 'delete',
          isDeleted: true,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
        });
      });

    const filtered = boards.filter((b) => b.id !== boardIdToDelete);
    setBoards(filtered);
    if (activeBoardId === boardIdToDelete) {
      setActiveBoardId(filtered[0].id);
    }
    setSelectedActionId(null);
    setToastMessage('Board page deleted');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRenameBoard = (boardId: string, newName: string) => {
    if (!newName.trim()) {
      setEditingBoardId(null);
      return;
    }
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name: newName.trim() } : b))
    );
    setEditingBoardId(null);
  };

  // Share Whiteboard Snapshot in Room Chat
  const handleShareToChat = async () => {
    if (!canvasRef.current || !onSendMessage) {
      setToastMessage('Meeting chat not connected');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const currBoard = boards.find((b) => b.id === activeBoardId);
      const boardTitle = currBoard ? currBoard.name : 'Whiteboard';

      const msgText = `🎨 **${boardTitle} Snapshot**\n${dataUrl}`;
      onSendMessage(msgText);

      setToastMessage(`Shared "${boardTitle}" snapshot to chat!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Error sharing whiteboard snapshot:', err);
    }
  };

  // Get currently selected action object
  const selectedAction = actions.find((a) => a.id === selectedActionId && !a.isDeleted);

  // Laser pointer fade animation loop
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 1200));
    }, 50);
    return () => clearInterval(interval);
  }, [laserPoints.length]);

  // Helper: Calculate Bounding Box of any WhiteboardAction
  const getBoundingBox = useCallback((act: WhiteboardAction): { x: number; y: number; width: number; height: number } => {
    const pad = Math.max(8, act.size || 4);

    if (act.type === 'rect' || act.type === 'circle' || act.type === 'sticky') {
      const x = act.x ?? 0;
      const y = act.y ?? 0;
      const width = act.width ?? 180;
      const height = act.height ?? 180;
      return {
        x: Math.min(x, x + width),
        y: Math.min(y, y + height),
        width: Math.abs(width),
        height: Math.abs(height),
      };
    } else if (act.type === 'text') {
      const x = act.x ?? 0;
      const y = act.y ?? 0;
      const fontSize = Math.max(16, (act.size || 4) * 4);
      const textWidth = Math.max(60, (act.text?.length || 5) * (fontSize * 0.6));
      const textHeight = fontSize * 1.3;
      return {
        x,
        y: y - fontSize,
        width: textWidth,
        height: textHeight,
      };
    } else if ((act.type === 'line' || act.type === 'arrow') && act.points && act.points.length >= 2) {
      const p1 = act.points[0];
      const p2 = act.points[1];
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(20, maxX - minX + pad * 2),
        height: Math.max(20, maxY - minY + pad * 2),
      };
    } else if (act.type === 'draw' && act.points && act.points.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      act.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      return {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(16, maxX - minX + pad * 2),
        height: Math.max(16, maxY - minY + pad * 2),
      };
    }

    return { x: act.x ?? 0, y: act.y ?? 0, width: 100, height: 100 };
  }, []);

  // Hit Test: Find top-most action at world coordinates
  const findActionAtCoords = useCallback(
    (coords: DrawPoint): WhiteboardAction | null => {
      // Loop backwards from top element to bottom
      for (let i = actions.length - 1; i >= 0; i--) {
        const act = actions[i];
        if (act.isDeleted || act.type === 'clear') continue;
        if (act.boardId && act.boardId !== activeBoardId) continue;
        if (!act.boardId && activeBoardId !== 'board_1') continue;

        const box = getBoundingBox(act);
        const pad = 6;
        if (
          coords.x >= box.x - pad &&
          coords.x <= box.x + box.width + pad &&
          coords.y >= box.y - pad &&
          coords.y <= box.y + box.height + pad
        ) {
          return act;
        }
      }
      return null;
    },
    [actions, getBoundingBox]
  );

  // Smooth freehand curve rendering helper
  const drawSmoothCurve = (ctx: CanvasRenderingContext2D, points: DrawPoint[]) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    }
    ctx.stroke();
  };

  // Main Redraw Canvas Routine
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    // Reset transform to clear full canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Canvas Background Color
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Zoom & Pan Transform Matrix
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);

    // Render Canvas Background Pattern
    if (bgPattern === 'dots') {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)';
      const spacing = 28;
      const startX = Math.floor(-panOffset.x / scale / spacing) * spacing - spacing;
      const endX = startX + canvas.width / scale + spacing * 2;
      const startY = Math.floor(-panOffset.y / scale / spacing) * spacing - spacing;
      const endY = startY + canvas.height / scale + spacing * 2;

      for (let x = startX; x < endX; x += spacing) {
        for (let y = startY; y < endY; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 / scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (bgPattern === 'grid') {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)';
      ctx.lineWidth = 1 / scale;
      const spacing = 32;
      const startX = Math.floor(-panOffset.x / scale / spacing) * spacing - spacing;
      const endX = startX + canvas.width / scale + spacing * 2;
      const startY = Math.floor(-panOffset.y / scale / spacing) * spacing - spacing;
      const endY = startY + canvas.height / scale + spacing * 2;

      ctx.beginPath();
      for (let x = startX; x < endX; x += spacing) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y < endY; y += spacing) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    } else if (bgPattern === 'lines') {
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
      ctx.lineWidth = 1 / scale;
      const spacing = 32;
      const startY = Math.floor(-panOffset.y / scale / spacing) * spacing - spacing;
      const endY = startY + canvas.height / scale + spacing * 2;

      ctx.beginPath();
      for (let y = startY; y < endY; y += spacing) {
        ctx.moveTo(-10000, y);
        ctx.lineTo(10000, y);
      }
      ctx.stroke();
    }

    // Render All Actions for Active Board
    actions.forEach((act) => {
      if (act.isDeleted) return;
      if (act.boardId && act.boardId !== activeBoardId) return;
      if (!act.boardId && activeBoardId !== 'board_1') return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (act.type === 'draw') {
        if (!act.points || act.points.length < 2) {
          ctx.restore();
          return;
        }

        if (act.isHighlighter) {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = act.color;
          ctx.lineWidth = act.size * 2.5;
          drawSmoothCurve(ctx, act.points);
        } else {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = act.color;
          ctx.lineWidth = act.size;
          drawSmoothCurve(ctx, act.points);
        }
      } else if (act.type === 'line' && act.points && act.points.length >= 2) {
        ctx.strokeStyle = act.color;
        ctx.lineWidth = act.size;
        ctx.beginPath();
        ctx.moveTo(act.points[0].x, act.points[0].y);
        ctx.lineTo(act.points[1].x, act.points[1].y);
        ctx.stroke();
      } else if (act.type === 'rect' && act.x !== undefined && act.y !== undefined && act.width !== undefined && act.height !== undefined) {
        if (act.isFilled && act.fillColor) {
          ctx.fillStyle = act.fillColor;
          ctx.fillRect(act.x, act.y, act.width, act.height);
        }
        ctx.strokeStyle = act.color;
        ctx.lineWidth = act.size;
        ctx.strokeRect(act.x, act.y, act.width, act.height);
      } else if (act.type === 'circle' && act.x !== undefined && act.y !== undefined && act.width !== undefined && act.height !== undefined) {
        ctx.beginPath();
        const rx = Math.abs(act.width / 2);
        const ry = Math.abs(act.height / 2);
        const cx = act.x + act.width / 2;
        const cy = act.y + act.height / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (act.isFilled && act.fillColor) {
          ctx.fillStyle = act.fillColor;
          ctx.fill();
        }
        ctx.strokeStyle = act.color;
        ctx.lineWidth = act.size;
        ctx.stroke();
      } else if (act.type === 'arrow' && act.points && act.points.length >= 2) {
        const from = act.points[0];
        const to = act.points[1];
        ctx.strokeStyle = act.color;
        ctx.fillStyle = act.color;
        ctx.lineWidth = act.size;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = Math.max(14, act.size * 2.5);
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (act.type === 'text' && act.x !== undefined && act.y !== undefined && act.text) {
        ctx.fillStyle = act.color;
        ctx.font = `600 ${Math.max(14, act.size * 4)}px 'Cairo', sans-serif, system-ui`;
        ctx.fillText(act.text, act.x, act.y);
      } else if (act.type === 'sticky' && act.x !== undefined && act.y !== undefined) {
        const w = act.width || 180;
        const h = act.height || 180;
        const stickyBg = act.stickyBg || '#fef08a';

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        // Sticky Card Fill
        ctx.fillStyle = stickyBg;
        ctx.beginPath();
        ctx.roundRect(act.x, act.y, w, h, 8);
        ctx.fill();

        // Reset Shadow for Text
        ctx.shadowColor = 'transparent';

        // Sticky Accent Bar
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(act.x, act.y, w, 24);

        // Sticky Text
        if (act.text) {
          ctx.fillStyle = '#1e293b';
          ctx.font = `500 ${Math.max(13, act.size * 3)}px 'Cairo', sans-serif`;

          const words = act.text.split(' ');
          let line = '';
          let lineY = act.y + 45;
          const maxWidth = w - 24;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              ctx.fillText(line, act.x + 12, lineY);
              line = words[n] + ' ';
              lineY += 22;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, act.x + 12, lineY);
        }
      }

      ctx.restore();
    });

    // Render Active In-Progress Drawing Preview
    if (isDrawing && startPoint && currentPoints.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (activeTool === 'eraser') {
        ctx.strokeStyle = isDark ? '#090d16' : '#f8fafc';
        ctx.lineWidth = strokeWidth * 4;
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
      } else if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth * 2.5;
        drawSmoothCurve(ctx, currentPoints);
      } else if (activeTool === 'pen') {
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth;
        drawSmoothCurve(ctx, currentPoints);
      } else {
        const endPoint = currentPoints[currentPoints.length - 1];
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = strokeWidth;

        if (activeTool === 'line') {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        } else if (activeTool === 'rect') {
          const x = Math.min(startPoint.x, endPoint.x);
          const y = Math.min(startPoint.y, endPoint.y);
          const w = Math.abs(endPoint.x - startPoint.x);
          const h = Math.abs(endPoint.y - startPoint.y);
          if (isFilled) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, w, h);
          }
          ctx.strokeRect(x, y, w, h);
        } else if (activeTool === 'circle') {
          ctx.beginPath();
          const w = Math.abs(endPoint.x - startPoint.x);
          const h = Math.abs(endPoint.y - startPoint.y);
          const x = Math.min(startPoint.x, endPoint.x);
          const y = Math.min(startPoint.y, endPoint.y);
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
          if (isFilled) {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          ctx.stroke();
        } else if (activeTool === 'arrow') {
          ctx.fillStyle = activeColor;
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();

          const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
          const headLen = Math.max(14, strokeWidth * 2.5);
          ctx.beginPath();
          ctx.moveTo(endPoint.x, endPoint.y);
          ctx.lineTo(endPoint.x - headLen * Math.cos(angle - Math.PI / 6), endPoint.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(endPoint.x - headLen * Math.cos(angle + Math.PI / 6), endPoint.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Render Laser Trail
    if (laserPoints.length > 1) {
      ctx.save();
      const now = Date.now();
      for (let i = 1; i < laserPoints.length; i++) {
        const p1 = laserPoints[i - 1];
        const p2 = laserPoints[i];
        const age = now - p2.time;
        const opacity = Math.max(0, 1 - age / 1200);

        ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 6 / scale;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Selection Box & Corner Handles for Currently Selected Action
    if (selectedAction) {
      ctx.save();
      const box = getBoundingBox(selectedAction);

      // Selection Outer Border
      ctx.strokeStyle = '#6366f1'; // Indigo-500
      ctx.lineWidth = 2 / scale;
      ctx.setLineDash([6 / scale, 4 / scale]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.setLineDash([]); // Reset dash

      // Draw 4 Corner Handles
      const handleRadius = 5 / scale;
      const corners = [
        { x: box.x, y: box.y }, // nw
        { x: box.x + box.width, y: box.y }, // ne
        { x: box.x + box.width, y: box.y + box.height }, // se
        { x: box.x, y: box.y + box.height }, // sw
      ];

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2 / scale;

      corners.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Object Info Badge Above Selection
      ctx.fillStyle = '#6366f1';
      const label = `${selectedAction.type.toUpperCase()} • ${selectedAction.userName || 'Item'}`;
      ctx.font = `700 ${11 / scale}px sans-serif`;
      const badgeWidth = ctx.measureText(label).width + 12 / scale;
      const badgeHeight = 18 / scale;
      ctx.fillRect(box.x, box.y - badgeHeight - 4 / scale, badgeWidth, badgeHeight);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, box.x + 6 / scale, box.y - 8 / scale);

      ctx.restore();
    }

    // Eraser Cursor Ring Indicator
    if (activeTool === 'eraser' && hoverCoords) {
      ctx.save();
      const r = Math.max(16, strokeWidth * 3.5);
      ctx.strokeStyle = isDark ? '#f43f5e' : '#e11d48';
      ctx.fillStyle = isDark ? 'rgba(244, 63, 94, 0.15)' : 'rgba(225, 29, 72, 0.12)';
      ctx.lineWidth = 1.5 / scale;
      ctx.setLineDash([4 / scale, 4 / scale]);
      ctx.beginPath();
      ctx.arc(hoverCoords.x, hoverCoords.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // Restore global matrix transform
  }, [actions, isDark, isDrawing, currentPoints, startPoint, activeTool, activeColor, strokeWidth, bgPattern, scale, panOffset, isFilled, fillColor, laserPoints, selectedAction, getBoundingBox, hoverCoords]);

  // Handle Resize Window
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Convert Screen Coordinates to Canvas World Coordinates
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return null;
    }

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return {
      x: (screenX - panOffset.x) / scale,
      y: (screenY - panOffset.y) / scale,
    };
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedActionId) {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedActionId(null);
        setTextInputPos(null);
        setStickyInputPos(null);
        setActiveTool('select');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedActionId) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (e.key === 'ArrowUp' && selectedActionId) {
        e.preventDefault();
        handleNudgeSelected(0, e.shiftKey ? -10 : -2);
      } else if (e.key === 'ArrowDown' && selectedActionId) {
        e.preventDefault();
        handleNudgeSelected(0, e.shiftKey ? 10 : 2);
      } else if (e.key === 'ArrowLeft' && selectedActionId) {
        e.preventDefault();
        handleNudgeSelected(e.shiftKey ? -10 : -2, 0);
      } else if (e.key === 'ArrowRight' && selectedActionId) {
        e.preventDefault();
        handleNudgeSelected(e.shiftKey ? 10 : 2, 0);
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('pan');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
      } else if (e.key.toLowerCase() === 's') {
        setActiveTool('sticky');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      } else if (e.key.toLowerCase() === 'l') {
        setActiveTool('laser');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedActionId, actions]);

  // Nudge selected element position via arrow keys
  const handleNudgeSelected = (dx: number, dy: number) => {
    if (!selectedAction) return;
    const updated = { ...selectedAction };

    if (updated.x !== undefined && updated.y !== undefined) {
      updated.x += dx;
      updated.y += dy;
    }

    if (updated.points) {
      updated.points = updated.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    }

    onEmitAction(updated);
  };

  // Delete Selected Element
  const handleDeleteSelected = useCallback(() => {
    if (!selectedActionId) return;
    const deletePayload: WhiteboardAction = {
      id: selectedActionId,
      type: 'delete',
      color: '',
      size: 0,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      isDeleted: true,
    };
    onEmitAction(deletePayload);
    setSelectedActionId(null);
  }, [selectedActionId, currentUser, onEmitAction]);

  // Object / Stroke Real-Time Eraser Handler
  const eraseAtCoords = useCallback((coords: DrawPoint) => {
    const eraserRadius = Math.max(16, strokeWidth * 3.5);
    actions.forEach((act) => {
      if (act.isDeleted || act.type === 'clear') return;
      if (act.boardId && act.boardId !== activeBoardId) return;
      if (!act.boardId && activeBoardId !== 'board_1') return;

      let hit = false;
      const box = getBoundingBox(act);

      // Bounding box test expanded by eraserRadius
      if (
        coords.x >= box.x - eraserRadius &&
        coords.x <= box.x + box.width + eraserRadius &&
        coords.y >= box.y - eraserRadius &&
        coords.y <= box.y + box.height + eraserRadius
      ) {
        if (act.type === 'draw' && act.points && act.points.length > 0) {
          hit = act.points.some((p) => Math.hypot(p.x - coords.x, p.y - coords.y) <= eraserRadius);
        } else if ((act.type === 'line' || act.type === 'arrow') && act.points && act.points.length >= 2) {
          const p1 = act.points[0];
          const p2 = act.points[1];
          const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
          if (l2 === 0) {
            hit = Math.hypot(coords.x - p1.x, coords.y - p1.y) <= eraserRadius;
          } else {
            let t = ((coords.x - p1.x) * (p2.x - p1.x) + (coords.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = p1.x + t * (p2.x - p1.x);
            const projY = p1.y + t * (p2.y - p1.y);
            hit = Math.hypot(coords.x - projX, coords.y - projY) <= eraserRadius;
          }
        } else {
          hit = true;
        }
      }

      if (hit) {
        const deletePayload: WhiteboardAction = {
          id: act.id,
          type: 'delete',
          color: '',
          size: 0,
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          isDeleted: true,
        };
        onEmitAction(deletePayload);
        if (selectedActionId === act.id) {
          setSelectedActionId(null);
        }
      }
    });
  }, [actions, getBoundingBox, strokeWidth, currentUser, onEmitAction, selectedActionId]);

  // Duplicate Selected Element
  const handleDuplicateSelected = () => {
    if (!selectedAction) return;
    const offset = 24;
    const newId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const clonedAction: WhiteboardAction = {
      ...selectedAction,
      id: newId,
      timestamp: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
    };

    if (clonedAction.x !== undefined) clonedAction.x += offset;
    if (clonedAction.y !== undefined) clonedAction.y += offset;
    if (clonedAction.points) {
      clonedAction.points = clonedAction.points.map((p) => ({ x: p.x + offset, y: p.y + offset }));
    }

    onEmitAction(clonedAction);
    setSelectedActionId(newId);
  };

  // Canvas Mouse Down / Touch Start
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Middle click or Pan Tool
    if (activeTool === 'pan' || ('button' in e && (e as React.MouseEvent).button === 1)) {
      setIsPanning(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setPanStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    // SELECT TOOL MODE
    if (activeTool === 'select') {
      // Check if clicked inside existing selected action or its handles
      if (selectedAction) {
        const box = getBoundingBox(selectedAction);
        const handleRadius = 10 / scale;

        // Check corner handles
        if (Math.hypot(coords.x - box.x, coords.y - box.y) <= handleRadius) {
          setActiveResizeHandle('nw');
          setDragStartPos(coords);
          return;
        } else if (Math.hypot(coords.x - (box.x + box.width), coords.y - box.y) <= handleRadius) {
          setActiveResizeHandle('ne');
          setDragStartPos(coords);
          return;
        } else if (Math.hypot(coords.x - (box.x + box.width), coords.y - (box.y + box.height)) <= handleRadius) {
          setActiveResizeHandle('se');
          setDragStartPos(coords);
          return;
        } else if (Math.hypot(coords.x - box.x, coords.y - (box.y + box.height)) <= handleRadius) {
          setActiveResizeHandle('sw');
          setDragStartPos(coords);
          return;
        }
      }

      // Hit test elements
      const hit = findActionAtCoords(coords);
      if (hit) {
        setSelectedActionId(hit.id);
        setIsDraggingSelected(true);
        setDragStartPos(coords);
      } else {
        // Clicked blank space
        setSelectedActionId(null);
      }
      return;
    }

    if (activeTool === 'eraser') {
      setIsDrawing(true);
      eraseAtCoords(coords);
      return;
    }

    if (activeTool === 'text') {
      setTextInputPos(coords);
      return;
    }

    if (activeTool === 'sticky') {
      setStickyInputPos(coords);
      return;
    }

    if (activeTool === 'laser') {
      setIsDrawing(true);
      setLaserPoints([{ ...coords, time: Date.now() }]);
      return;
    }

    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPoints([coords]);
  };

  // Canvas Mouse Move / Touch Move
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPanning) {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setPanOffset({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
      return;
    }

    const coords = getCanvasCoords(e);
    if (!coords) return;

    setHoverCoords(coords);
    onEmitCursor(coords);

    if (activeTool === 'eraser') {
      if (isDrawing) {
        eraseAtCoords(coords);
      }
      return;
    }

    // Resizing selected object
    if (activeResizeHandle && selectedAction && dragStartPos) {
      const dx = coords.x - dragStartPos.x;
      const dy = coords.y - dragStartPos.y;
      setDragStartPos(coords);

      const updated = { ...selectedAction };

      if (updated.type === 'rect' || updated.type === 'circle' || updated.type === 'sticky' || updated.type === 'text') {
        let w = updated.width || 100;
        let h = updated.height || 100;
        let x = updated.x || 0;
        let y = updated.y || 0;

        if (activeResizeHandle === 'se') {
          updated.width = Math.max(20, w + dx);
          updated.height = Math.max(20, h + dy);
        } else if (activeResizeHandle === 'nw') {
          const newW = Math.max(20, w - dx);
          const newH = Math.max(20, h - dy);
          if (newW > 20) updated.x = x + dx;
          if (newH > 20) updated.y = y + dy;
          updated.width = newW;
          updated.height = newH;
        } else if (activeResizeHandle === 'sw') {
          const newW = Math.max(20, w - dx);
          const newH = Math.max(20, h + dy);
          if (newW > 20) updated.x = x + dx;
          updated.width = newW;
          updated.height = newH;
        } else if (activeResizeHandle === 'ne') {
          const newH = Math.max(20, h - dy);
          const newW = Math.max(20, w + dx);
          if (newH > 20) updated.y = y + dy;
          updated.width = newW;
          updated.height = newH;
        }

        if (updated.type === 'text') {
          const newH = updated.height || 100;
          updated.size = Math.max(2, Math.round(newH / 10));
        }

        onEmitAction(updated);
      } else if (updated.points && updated.points.length > 0) {
        const oldBox = getBoundingBox(selectedAction);
        if (oldBox.width > 0 && oldBox.height > 0) {
          let newX = oldBox.x;
          let newY = oldBox.y;
          let newW = oldBox.width;
          let newH = oldBox.height;

          if (activeResizeHandle === 'se') {
            newW = Math.max(20, oldBox.width + dx);
            newH = Math.max(20, oldBox.height + dy);
          } else if (activeResizeHandle === 'nw') {
            newW = Math.max(20, oldBox.width - dx);
            newH = Math.max(20, oldBox.height - dy);
            newX = oldBox.x + (oldBox.width - newW);
            newY = oldBox.y + (oldBox.height - newH);
          } else if (activeResizeHandle === 'sw') {
            newW = Math.max(20, oldBox.width - dx);
            newH = Math.max(20, oldBox.height + dy);
            newX = oldBox.x + (oldBox.width - newW);
          } else if (activeResizeHandle === 'ne') {
            newW = Math.max(20, oldBox.width + dx);
            newH = Math.max(20, oldBox.height - dy);
            newY = oldBox.y + (oldBox.height - newH);
          }

          const scaleX = newW / oldBox.width;
          const scaleY = newH / oldBox.height;

          updated.points = updated.points.map((p) => ({
            x: newX + (p.x - oldBox.x) * scaleX,
            y: newY + (p.y - oldBox.y) * scaleY,
          }));

          onEmitAction(updated);
        }
      }
      return;
    }

    // Dragging / Moving selected object
    if (isDraggingSelected && selectedAction && dragStartPos) {
      const dx = coords.x - dragStartPos.x;
      const dy = coords.y - dragStartPos.y;
      setDragStartPos(coords);

      const updated = { ...selectedAction };

      if (updated.x !== undefined && updated.y !== undefined) {
        updated.x += dx;
        updated.y += dy;
      }

      if (updated.points) {
        updated.points = updated.points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
      }

      onEmitAction(updated);
      return;
    }

    if (!isDrawing) return;

    if (activeTool === 'laser') {
      setLaserPoints((prev) => [...prev, { ...coords, time: Date.now() }]);
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPoints((prev) => [...prev, coords]);
    } else if (startPoint) {
      setCurrentPoints([startPoint, coords]);
    }
  };

  // Canvas Mouse Up / Touch End
  const handleEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingSelected) {
      setIsDraggingSelected(false);
      setDragStartPos(null);
      return;
    }

    if (activeResizeHandle) {
      setActiveResizeHandle(null);
      setDragStartPos(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === 'laser' || activeTool === 'eraser') return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      if (currentPoints.length < 2) return;
      const action: WhiteboardAction = {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'draw',
        color: activeTool === 'eraser' ? (isDark ? '#090d16' : '#f8fafc') : activeColor,
        isHighlighter: activeTool === 'highlighter',
        size: activeTool === 'eraser' ? strokeWidth * 4 : strokeWidth,
        points: currentPoints,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
        boardId: activeBoardId,
      };
      onEmitAction(action);
      setLocalHistory((prev) => [...prev, action]);
      setRedoStack([]);
    } else if (startPoint && currentPoints.length > 0) {
      const endPoint = currentPoints[currentPoints.length - 1];
      let action: WhiteboardAction | null = null;

      if (activeTool === 'line') {
        action = {
          id: `act_${Date.now()}`,
          type: 'line',
          color: activeColor,
          size: strokeWidth,
          points: [startPoint, endPoint],
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          boardId: activeBoardId,
        };
      } else if (activeTool === 'rect') {
        action = {
          id: `act_${Date.now()}`,
          type: 'rect',
          color: activeColor,
          fillColor: fillColor,
          isFilled: isFilled,
          size: strokeWidth,
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y),
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          boardId: activeBoardId,
        };
      } else if (activeTool === 'circle') {
        action = {
          id: `act_${Date.now()}`,
          type: 'circle',
          color: activeColor,
          fillColor: fillColor,
          isFilled: isFilled,
          size: strokeWidth,
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y),
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          boardId: activeBoardId,
        };
      } else if (activeTool === 'arrow') {
        action = {
          id: `act_${Date.now()}`,
          type: 'arrow',
          color: activeColor,
          size: strokeWidth,
          points: [startPoint, endPoint],
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          boardId: activeBoardId,
        };
      }

      if (action) {
        onEmitAction(action);
        setLocalHistory((prev) => [...prev, action!]);
        setRedoStack([]);
      }
    }

    setCurrentPoints([]);
    setStartPoint(null);
  };

  // Zoom Control Helpers
  const handleZoom = (delta: number) => {
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(0.3, prevScale + delta), 3.0);
      return Math.round(newScale * 10) / 10;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Text Insertion
  const handleInsertText = () => {
    if (!textInputPos || !textContent.trim()) {
      setTextInputPos(null);
      setTextContent('');
      return;
    }

    const action: WhiteboardAction = {
      id: `act_${Date.now()}`,
      type: 'text',
      color: activeColor,
      size: strokeWidth,
      x: textInputPos.x,
      y: textInputPos.y,
      text: textContent.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      boardId: activeBoardId,
    };

    onEmitAction(action);
    setLocalHistory((prev) => [...prev, action]);
    setRedoStack([]);
    setTextInputPos(null);
    setTextContent('');
  };

  // Sticky Note Insertion
  const handleInsertSticky = () => {
    if (!stickyInputPos || !stickyContent.trim()) {
      setStickyInputPos(null);
      setStickyContent('');
      return;
    }

    const action: WhiteboardAction = {
      id: `act_${Date.now()}`,
      type: 'sticky',
      color: '#1e293b',
      stickyBg: activeStickyBg,
      size: strokeWidth,
      x: stickyInputPos.x,
      y: stickyInputPos.y,
      width: 190,
      height: 190,
      text: stickyContent.trim(),
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: Date.now(),
      boardId: activeBoardId,
    };

    onEmitAction(action);
    setLocalHistory((prev) => [...prev, action]);
    setRedoStack([]);
    setStickyInputPos(null);
    setStickyContent('');
  };

  // Open Edit Modal for Selected Action
  const handleOpenEditModal = () => {
    if (!selectedAction) return;
    setEditingAction(selectedAction);
    setEditingText(selectedAction.text || '');
  };

  // Save Text / Sticky Edit Changes
  const handleSaveEdit = () => {
    if (!editingAction) return;
    const updated: WhiteboardAction = {
      ...editingAction,
      text: editingText.trim(),
    };
    onEmitAction(updated);
    setEditingAction(null);
    setEditingText('');
  };

  // Change Color of Selected Object
  const handleChangeSelectedColor = (color: string) => {
    if (!selectedAction) return;
    const updated = { ...selectedAction, color };
    onEmitAction(updated);
  };

  // Change Sticky Note Background
  const handleChangeStickyBg = (bg: string) => {
    if (!selectedAction || selectedAction.type !== 'sticky') return;
    const updated = { ...selectedAction, stickyBg: bg };
    onEmitAction(updated);
  };

  // Undo & Redo
  const handleUndo = () => {
    if (localHistory.length === 0) return;
    const lastAction = localHistory[localHistory.length - 1];
    setLocalHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    // Send delete or clear for this action
    onEmitAction({
      ...lastAction,
      isDeleted: true,
      type: 'delete',
    });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const actionToRedo = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setLocalHistory((prev) => [...prev, actionToRedo]);
    onEmitAction({
      ...actionToRedo,
      isDeleted: false,
    });
  };

  // Clear Whiteboard
  const handleClearAll = () => {
    if (window.confirm('Clear whiteboard for all participants?')) {
      const action: WhiteboardAction = {
        id: `clear_${Date.now()}`,
        type: 'clear',
        color: '',
        size: 0,
        userId: currentUser.id,
        userName: currentUser.name,
        timestamp: Date.now(),
      };
      onEmitAction(action);
      setLocalHistory([]);
      setRedoStack([]);
      setSelectedActionId(null);
    }
  };

  // Download High Quality Snapshot
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.fillStyle = isDark ? '#090d16' : '#ffffff';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    offCtx.drawImage(canvas, 0, 0);

    const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = offCanvas.toDataURL(mimeType, 0.95);
    const link = document.createElement('a');
    link.download = `FAKKA-Whiteboard-${Date.now()}.${exportFormat}`;
    link.href = dataUrl;
    link.click();
  };

  // Convert canvas position to screen position for floating element toolbar
  const getSelectedScreenPos = () => {
    if (!selectedAction) return null;
    const box = getBoundingBox(selectedAction);
    const screenX = box.x * scale + panOffset.x;
    const screenY = box.y * scale + panOffset.y;
    return {
      x: Math.max(20, Math.min(window.innerWidth - 320, screenX)),
      y: Math.max(80, screenY - 50),
    };
  };

  const selectedScreenPos = getSelectedScreenPos();

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col border shadow-2xl transition-colors select-none ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {viewMode === 'grid' ? (
        /* ================= ALL BOARDS CARDS GALLERY VIEW ================= */
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 animate-in fade-in duration-200">
          {/* Gallery Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-2xl shadow-lg">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
                  <span>معرض السبورات والتصاميم</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {boards.length} سبورة
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختر أي سبورة للدخول إليها والبدء بالرسم، أو قم بإنشاء سبورة جديدة
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Search filter */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث عن سبورة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 focus:outline-none placeholder:text-slate-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Create New Board Button */}
              <button
                onClick={() => handleAddBoard(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center space-x-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>سبورة جديدة</span>
              </button>

              {/* Close Whiteboard Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  title="إغلاق اللوحة البيضاء"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid Container */}
          <div className="flex-1 overflow-y-auto py-6 pr-1">
            {boards.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
                  <LayoutGrid className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">لم يتم العثور على أي سبورة بهذا الاسم</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleAddBoard(true);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline"
                >
                  إضافة سبورة جديدة الان
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {/* Create New Board Card Prompt */}
                <button
                  type="button"
                  onClick={() => handleAddBoard(true)}
                  className="h-64 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 bg-slate-900/30 hover:bg-slate-900/80 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center space-y-3 group cursor-pointer"
                >
                  <div className="p-4 bg-indigo-600/10 group-hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 group-hover:text-white rounded-2xl transition-all shadow-lg group-hover:scale-110">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">إضافة سبورة جديدة</h3>
                    <p className="text-xs text-slate-500 mt-1">اضغط لإنشاء مساحة رسم جديدة للعمل الجماعي</p>
                  </div>
                </button>

                {/* List of Boards as Cards */}
                {boards
                  .filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((board) => {
                    const boardActions = actions.filter(
                      (a) => !a.isDeleted && (a.boardId === board.id || (!a.boardId && board.id === 'board_1'))
                    );
                    const stickiesCount = boardActions.filter((a) => a.type === 'sticky').length;
                    const drawingsCount = boardActions.filter((a) => a.type === 'pencil' || a.type === 'highlighter').length;
                    const shapesCount = boardActions.filter((a) => a.type === 'rect' || a.type === 'circle' || a.type === 'arrow').length;
                    const textCount = boardActions.filter((a) => a.type === 'text').length;
                    const isActive = board.id === activeBoardId;

                    return (
                      <div
                        key={board.id}
                        className={`h-64 rounded-2xl border flex flex-col justify-between p-5 transition-all duration-200 relative group shadow-xl ${
                          isActive
                            ? 'bg-slate-900 border-indigo-500/80 shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                            : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Header inside Card */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 pr-2">
                            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                            {editingBoardId === board.id ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingBoardName}
                                onChange={(e) => setEditingBoardName(e.target.value)}
                                onBlur={() => handleRenameBoard(board.id, editingBoardName)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameBoard(board.id, editingBoardName);
                                  if (e.key === 'Escape') setEditingBoardId(null);
                                }}
                                className="px-2 py-0.5 text-xs bg-slate-950 text-white rounded border border-indigo-500 focus:outline-none w-full font-bold"
                              />
                            ) : (
                              <div className="flex items-center space-x-1 min-w-0">
                                <h3 className="text-sm font-bold text-white truncate">{board.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBoardId(board.id);
                                    setEditingBoardName(board.name);
                                  }}
                                  className="text-slate-500 hover:text-slate-300 p-0.5 rounded shrink-0"
                                  title="تعديل الاسم"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Active badge */}
                          {isActive && (
                            <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span>النشطة</span>
                            </span>
                          )}
                        </div>

                        {/* Card Body / Preview Summary */}
                        <div
                          onClick={() => {
                            setActiveBoardId(board.id);
                            setViewMode('canvas');
                          }}
                          className="my-3 flex-1 rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 flex flex-col justify-center cursor-pointer hover:border-indigo-500/40 transition-all relative overflow-hidden group/canvas"
                        >
                          {/* Mini Grid pattern bg */}
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px]" />

                          {boardActions.length === 0 ? (
                            <div className="text-center relative z-10">
                              <p className="text-xs text-slate-400 font-medium">سبورة فارغة</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">اضغط لدخول اللوحة والبدء بالرسم</p>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 relative z-10">
                              {drawingsCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  ✏️ {drawingsCount} رسم
                                </span>
                              )}
                              {stickiesCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  🟡 {stickiesCount} ملاحظات
                                </span>
                              )}
                              {shapesCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                  🟦 {shapesCount} أشكال
                                </span>
                              )}
                              {textCount > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  📝 {textCount} نصوص
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-400">
                            {boardActions.length} {boardActions.length === 1 ? 'عنصر' : 'عناصر'}
                          </span>

                          <div className="flex items-center space-x-1.5">
                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateBoard(board.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="نسخ هذه السبورة"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            {boards.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBoard(board.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="حذف هذه السبورة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Enter Board CTA */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveBoardId(board.id);
                                setViewMode('canvas');
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1"
                            >
                              <span>دخول</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= CANVAS VIEW FOR ACTIVE BOARD ================= */
        <>
          {/* Multiple Whiteboards Pages Control Bar (Top Left) */}
          <div className="absolute top-4 left-4 flex items-center space-x-1.5 p-1.5 rounded-2xl border shadow-xl z-30 pointer-events-auto backdrop-blur-xl bg-slate-900/90 border-slate-700/80 text-slate-100 max-w-[420px]">
            {/* Cards Gallery View Toggle Button (Exit Board to Cards) */}
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md flex items-center space-x-1.5 text-xs font-bold"
              title="العودة لجميع السبورات كبطاقات / View All Boards as Cards"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">السبورات</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700/80 mx-0.5" />

            {/* Board Name */}
            <div className="flex items-center space-x-1 px-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              {editingBoardId === activeBoardId ? (
                <input
                  type="text"
                  autoFocus
                  value={editingBoardName}
                  onChange={(e) => setEditingBoardName(e.target.value)}
                  onBlur={() => handleRenameBoard(activeBoardId, editingBoardName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameBoard(activeBoardId, editingBoardName);
                    if (e.key === 'Escape') setEditingBoardId(null);
                  }}
                  className="px-2 py-0.5 text-xs bg-slate-950 text-white rounded border border-indigo-500 focus:outline-none w-24 font-bold"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const b = boards.find((p) => p.id === activeBoardId);
                    setEditingBoardId(activeBoardId);
                    setEditingBoardName(b ? b.name : 'Board');
                  }}
                  className="text-xs font-bold text-slate-200 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 flex items-center space-x-1"
                  title="Click to rename board"
                >
                  <span className="truncate max-w-[80px]">
                    {boards.find((b) => b.id === activeBoardId)?.name || 'Board 1'}
                  </span>
                  <Edit3 className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Switch Board Pages */}
            <div className="flex items-center space-x-0.5 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const idx = boards.findIndex((b) => b.id === activeBoardId);
                  if (idx > 0) setActiveBoardId(boards[idx - 1].id);
                }}
                disabled={boards.findIndex((b) => b.id === activeBoardId) <= 0}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                title="Previous Board Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-extrabold text-indigo-400 px-1">
                {boards.findIndex((b) => b.id === activeBoardId) + 1} / {boards.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const idx = boards.findIndex((b) => b.id === activeBoardId);
                  if (idx < boards.length - 1) setActiveBoardId(boards[idx + 1].id);
                }}
                disabled={boards.findIndex((b) => b.id === activeBoardId) >= boards.length - 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                title="Next Board Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add New Whiteboard */}
            <button
              type="button"
              onClick={() => handleAddBoard(true)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md flex items-center justify-center"
              title="Create New Whiteboard Page (+)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Delete Active Whiteboard Page */}
            {boards.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteBoard(activeBoardId)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Delete Current Board Page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="w-[1px] h-4 bg-slate-700/80 mx-0.5" />

            {/* Share Snapshot directly in Meeting Chat */}
            <button
              type="button"
              onClick={handleShareToChat}
              className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all flex items-center space-x-1 text-xs font-bold"
              title="Share Whiteboard Image Snapshot in Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

      {/* Dynamic Dockable, Collapsible & Multi-Size Whiteboard Toolbar */}
      {isToolbarCollapsed ? (
        /* ================= COLLAPSED TOOLBAR STATE ================= */
        <div
          className={`absolute z-30 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl bg-slate-900/95 border-indigo-500/60 text-slate-100 animate-in fade-in duration-200 ${
            toolbarPosition === 'left'
              ? 'top-1/2 -translate-y-1/2 left-3 flex-col'
              : toolbarPosition === 'right'
              ? 'top-1/2 -translate-y-1/2 right-3 flex-col'
              : 'top-3 left-1/2 -translate-x-1/2 flex-row'
          }`}
        >
          {/* Active Tool Badge */}
          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(false)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md flex items-center justify-center transition-all"
            title="انقر لفتح شريط الأدوات الكامل"
          >
            {activeTool === 'select' && <MousePointer className="w-3.5 h-3.5" />}
            {activeTool === 'pan' && <Hand className="w-3.5 h-3.5" />}
            {activeTool === 'pen' && <Pen className="w-3.5 h-3.5" />}
            {activeTool === 'highlighter' && <Highlighter className="w-3.5 h-3.5" />}
            {activeTool === 'eraser' && <Eraser className="w-3.5 h-3.5" />}
            {activeTool === 'line' && <Minus className="w-3.5 h-3.5" />}
            {activeTool === 'rect' && <Square className="w-3.5 h-3.5" />}
            {activeTool === 'circle' && <Circle className="w-3.5 h-3.5" />}
            {activeTool === 'arrow' && <ArrowRight className="w-3.5 h-3.5" />}
            {activeTool === 'sticky' && <StickyNote className="w-3.5 h-3.5" />}
            {activeTool === 'text' && <Type className="w-3.5 h-3.5" />}
            {activeTool === 'laser' && <Zap className="w-3.5 h-3.5" />}
          </button>

          {/* Active Color Dot */}
          <div
            className="w-3.5 h-3.5 rounded-full border border-white shadow-sm cursor-pointer"
            style={{ backgroundColor: activeColor }}
            onClick={() => setIsToolbarCollapsed(false)}
            title="اللون النشط الحالي"
          />

          {/* Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsToolbarCollapsed(false)}
            className="p-1.5 text-indigo-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="توسيع شريط الأدوات (Expand Toolbar)"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ================= EXPANDED TOOLBAR STATE ================= */
        <div
          className={`absolute z-30 pointer-events-auto flex p-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200 bg-slate-900/95 border-slate-700/80 text-slate-100 max-w-[95%] overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            toolbarPosition === 'left'
              ? 'top-1/2 -translate-y-1/2 left-3 flex-col items-center gap-1 max-h-[50vh]'
              : toolbarPosition === 'right'
              ? 'top-1/2 -translate-y-1/2 right-3 flex-col items-center gap-1 max-h-[50vh]'
              : 'top-3 left-1/2 -translate-x-1/2 flex-row items-center gap-1'
          }`}
        >
          {/* Header Controls: Collapse Button & Layout / Size Config */}
          <div
            className={`flex items-center gap-0.5 ${
              toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-col' : 'flex-row'
            }`}
          >
            {/* Collapse Button */}
            <button
              type="button"
              onClick={() => setIsToolbarCollapsed(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 rounded-lg transition-colors"
              title="تقليص طي الشريط (Collapse Toolbar)"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>

            {/* Layout / Size / Position Options Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveGroupOpen(activeGroupOpen === 'layout' ? null : 'layout')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeGroupOpen === 'layout' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="إعدادات موضع وشكل شريط الأدوات (Dock & Size)"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {/* Layout / Dock & Size Popup */}
              {activeGroupOpen === 'layout' && (
                <div
                  className={`absolute z-50 p-2.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl text-xs space-y-2.5 w-48 text-slate-100 backdrop-blur-xl animate-in fade-in zoom-in-95 ${
                    toolbarPosition === 'left'
                      ? 'left-10 top-0'
                      : toolbarPosition === 'right'
                      ? 'right-10 top-0'
                      : 'top-10 left-0'
                  }`}
                >
                  {/* Dock Position Switcher */}
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                      موقع الشريط (Dock Position)
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setToolbarPosition('left')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarPosition === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        يسار
                      </button>
                      <button
                        type="button"
                        onClick={() => setToolbarPosition('top')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarPosition === 'top' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        أعلى
                      </button>
                      <button
                        type="button"
                        onClick={() => setToolbarPosition('right')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarPosition === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        يمين
                      </button>
                    </div>
                  </div>

                  {/* Size Mode Switcher */}
                  <div>
                    <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                      نمط الحجم (Toolbar Size)
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setToolbarSize('full')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarSize === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="عرض كامل لكافة الأدوات"
                      >
                        كامل
                      </button>
                      <button
                        type="button"
                        onClick={() => setToolbarSize('compact')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarSize === 'compact' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="تجميع الأدوات في قوائم مدمجة"
                      >
                        مدمج
                      </button>
                      <button
                        type="button"
                        onClick={() => setToolbarSize('minimal')}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all ${
                          toolbarSize === 'minimal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="عرض الأدوات الأساسية فقط"
                      >
                        بسيط
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={
              toolbarPosition === 'left' || toolbarPosition === 'right'
                ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
            }
          />

          {/* ================= TOOLBAR TOOLS IMPLEMENTATION ================= */}
          {toolbarSize === 'minimal' ? (
            /* --- MINIMAL SIZE MODE --- */
            <div
              className={`flex items-center gap-0.5 ${
                toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-col' : 'flex-row'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="القلم (Pen)"
              >
                <Pen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="التحديد والتعديل (Select)"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="الممحاة (Eraser)"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : toolbarSize === 'compact' ? (
            /* --- COMPACT GROUPED SIZE MODE --- */
            <div
              className={`flex items-center gap-0.5 ${
                toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-col' : 'flex-row'
              }`}
            >
              {/* Select & Pan */}
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="تحديد"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('pan')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'pan' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="تحريك"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <div
                className={
                  toolbarPosition === 'left' || toolbarPosition === 'right'
                    ? 'w-5 h-[1px] bg-slate-700/60'
                    : 'w-[1px] h-5 bg-slate-700/60'
                }
              />

              {/* Grouped Drawing Tools (Pen, Highlighter, Eraser) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveGroupOpen(activeGroupOpen === 'draw' ? null : 'draw')}
                  className={`p-1.5 rounded-lg transition-all flex items-center space-x-0.5 ${
                    activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="أدوات الرسم (Pen, Highlighter, Eraser)"
                >
                  {activeTool === 'highlighter' ? (
                    <Highlighter className="w-3.5 h-3.5" />
                  ) : activeTool === 'eraser' ? (
                    <Eraser className="w-3.5 h-3.5" />
                  ) : (
                    <Pen className="w-3.5 h-3.5" />
                  )}
                  <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
                </button>

                {activeGroupOpen === 'draw' && (
                  <div
                    className={`absolute z-50 p-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex gap-1 ${
                      toolbarPosition === 'left'
                        ? 'left-10 top-0 flex-col'
                        : toolbarPosition === 'right'
                        ? 'right-10 top-0 flex-col'
                        : 'top-10 left-0 flex-row'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveTool('pen');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Pen className="w-3.5 h-3.5" />
                      <span>قلم</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool('highlighter');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Highlighter className="w-3.5 h-3.5" />
                      <span>تمييز</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool('eraser');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>ممحاة</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grouped Shapes (Rect, Circle, Line, Arrow) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveGroupOpen(activeGroupOpen === 'shapes' ? null : 'shapes')}
                  className={`p-1.5 rounded-lg transition-all flex items-center space-x-0.5 ${
                    activeTool === 'rect' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title="الأشكال الهندسية (Shapes)"
                >
                  {activeTool === 'circle' ? (
                    <Circle className="w-3.5 h-3.5" />
                  ) : activeTool === 'line' ? (
                    <Minus className="w-3.5 h-3.5" />
                  ) : activeTool === 'arrow' ? (
                    <ArrowRight className="w-3.5 h-3.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
                </button>

                {activeGroupOpen === 'shapes' && (
                  <div
                    className={`absolute z-50 p-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex gap-1 ${
                      toolbarPosition === 'left'
                        ? 'left-10 top-0 flex-col'
                        : toolbarPosition === 'right'
                        ? 'right-10 top-0 flex-col'
                        : 'top-10 left-0 flex-row'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveTool('rect');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>مستطيل</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool('circle');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Circle className="w-3.5 h-3.5" />
                      <span>دائرة</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool('line');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>خط</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTool('arrow');
                        setActiveGroupOpen(null);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                        activeTool === 'arrow' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>سهم</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sticky & Text */}
              <button
                type="button"
                onClick={() => setActiveTool('sticky')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'sticky' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:bg-slate-800'
                }`}
                title="ملاحظة لاصقة"
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
                title="نص"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* --- FULL DETAILED SIZE MODE --- */
            <div
              className={`flex items-center gap-0.5 ${
                toolbarPosition === 'left' || toolbarPosition === 'right' ? 'flex-col' : 'flex-row'
              }`}
            >
              {/* Select Tool */}
              <button
                type="button"
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'select' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Select & Move / Edit (V)"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>

              {/* Pan Hand Tool */}
              <button
                type="button"
                onClick={() => setActiveTool('pan')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'pan' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Pan Canvas Hand (H)"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <div
                className={
                  toolbarPosition === 'left' || toolbarPosition === 'right'
                    ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                    : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
                }
              />

              {/* Pen Tool */}
              <button
                type="button"
                onClick={() => setActiveTool('pen')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'pen' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Pen (P)"
              >
                <Pen className="w-3.5 h-3.5" />
              </button>

              {/* Highlighter */}
              <button
                type="button"
                onClick={() => setActiveTool('highlighter')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'highlighter' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Highlighter Marker"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              {/* Eraser */}
              <button
                type="button"
                onClick={() => setActiveTool('eraser')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'eraser' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Eraser (E)"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>

              <div
                className={
                  toolbarPosition === 'left' || toolbarPosition === 'right'
                    ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                    : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
                }
              />

              {/* Line Shape */}
              <button
                type="button"
                onClick={() => setActiveTool('line')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'line' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Straight Line"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Rectangle Shape */}
              <button
                type="button"
                onClick={() => setActiveTool('rect')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'rect' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Rectangle"
              >
                <Square className="w-3.5 h-3.5" />
              </button>

              {/* Circle Shape */}
              <button
                type="button"
                onClick={() => setActiveTool('circle')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'circle' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Circle"
              >
                <Circle className="w-3.5 h-3.5" />
              </button>

              {/* Arrow Shape */}
              <button
                type="button"
                onClick={() => setActiveTool('arrow')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'arrow' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Arrow"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div
                className={
                  toolbarPosition === 'left' || toolbarPosition === 'right'
                    ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                    : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
                }
              />

              {/* Sticky Note */}
              <button
                type="button"
                onClick={() => setActiveTool('sticky')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'sticky' ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105' : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/80'
                }`}
                title="Sticky Note (S)"
              >
                <StickyNote className="w-3.5 h-3.5" />
              </button>

              {/* Text Tool */}
              <button
                type="button"
                onClick={() => setActiveTool('text')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'text' ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                title="Text Label (T)"
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              {/* Laser Pointer */}
              <button
                type="button"
                onClick={() => setActiveTool('laser')}
                className={`p-1.5 rounded-lg transition-all ${
                  activeTool === 'laser' ? 'bg-red-600 text-white shadow-md scale-105' : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/80'
                }`}
                title="Live Laser Pointer (L)"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div
            className={
              toolbarPosition === 'left' || toolbarPosition === 'right'
                ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
            }
          />

          {/* Color Palette Selector */}
          <div
            className={`flex items-center gap-1 ${
              toolbarPosition === 'left' || toolbarPosition === 'right' ? 'grid grid-cols-2 gap-1 py-0.5' : 'flex-row px-0.5'
            }`}
          >
            {COLOR_PALETTE.slice(0, 4).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setActiveColor(col)}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  activeColor === col
                    ? 'scale-110 ring-2 ring-indigo-500 border border-white'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}

            {/* Custom Color Input */}
            <label className="relative cursor-pointer w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
              <Palette className="w-2 h-2 text-slate-300" />
              <input
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>

          <div
            className={
              toolbarPosition === 'left' || toolbarPosition === 'right'
                ? 'w-5 h-[1px] bg-slate-700/60 my-0.5'
                : 'w-[1px] h-5 bg-slate-700/60 mx-0.5'
            }
          />

          {/* Prominent Main Delete Button */}
          <button
            type="button"
            onClick={() => {
              if (selectedActionId) {
                handleDeleteSelected();
              } else {
                setShowClearConfirmModal(true);
              }
            }}
            className={`p-1.5 rounded-lg transition-all flex items-center space-x-1 font-bold text-xs ${
              selectedActionId
                ? 'bg-red-500/25 hover:bg-red-500/40 text-red-400 border border-red-500/40 shadow-sm animate-pulse'
                : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={selectedActionId ? 'Delete Selected Item (Del / Backspace)' : 'Clear Active Board Page'}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline text-[11px]">{selectedActionId ? 'Delete' : 'Clear'}</span>
          </button>

          {/* Stroke & Style Settings Toggle */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-all ${
              showSettings ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
            }`}
            title="Stroke & Custom Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Close Whiteboard */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-colors"
              title="Close Whiteboard"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Floating Selected Element Context Toolbar (Hidden automatically while dragging/moving/resizing/drawing) */}
      {selectedAction && selectedScreenPos && !isDraggingSelected && !activeResizeHandle && !isDrawing && !isPanning && (
        <div
          className="absolute z-40 flex items-center space-x-1 p-1.5 rounded-2xl border shadow-2xl bg-slate-900/95 border-indigo-500/60 text-slate-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: selectedScreenPos.x,
            top: selectedScreenPos.y,
          }}
        >
          {/* Color Switcher for Selected */}
          <div className="flex items-center space-x-1 px-1">
            {COLOR_PALETTE.slice(0, 4).map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => handleChangeSelectedColor(col)}
                className={`w-4 h-4 rounded-full transition-all ${
                  selectedAction.color === col ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-80'
                }`}
                style={{ backgroundColor: col }}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Sticky Note Background Switcher */}
          {selectedAction.type === 'sticky' && (
            <div className="flex items-center space-x-1 px-1">
              {STICKY_COLORS.slice(0, 4).map((st) => (
                <button
                  key={st.bg}
                  type="button"
                  onClick={() => handleChangeStickyBg(st.bg)}
                  className={`w-4 h-4 rounded-md transition-all ${
                    selectedAction.stickyBg === st.bg ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: st.bg }}
                />
              ))}
            </div>
          )}

          {/* Edit Text Button */}
          {(selectedAction.type === 'text' || selectedAction.type === 'sticky') && (
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-xs font-semibold"
              title="Edit Text"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit</span>
            </button>
          )}

          {/* Duplicate Element */}
          <button
            type="button"
            onClick={handleDuplicateSelected}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5 text-slate-300" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Delete Element */}
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-bold"
            title="Delete Selected Item (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Settings Menu Dropdown */}
      {showSettings && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 p-4 rounded-2xl border shadow-2xl z-40 bg-slate-900/95 border-slate-700 text-slate-200 backdrop-blur-xl w-80 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Stroke Thickness</label>
            <div className="grid grid-cols-4 gap-1.5">
              {STROKE_SIZES.map((sz) => (
                <button
                  key={sz.value}
                  type="button"
                  onClick={() => setStrokeWidth(sz.value)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    strokeWidth === sz.value ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {activeTool === 'sticky' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Sticky Note Color</label>
              <div className="flex items-center gap-2">
                {STICKY_COLORS.map((st) => (
                  <button
                    key={st.bg}
                    type="button"
                    onClick={() => setActiveStickyBg(st.bg)}
                    className={`w-7 h-7 rounded-lg border transition-transform ${
                      activeStickyBg === st.bg ? 'scale-110 border-indigo-500 ring-2 ring-indigo-500/50' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: st.bg }}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeTool === 'rect' || activeTool === 'circle') && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Fill Shape Background</span>
              <button
                type="button"
                onClick={() => setIsFilled(!isFilled)}
                className={`w-10 h-6 rounded-full transition-colors relative ${isFilled ? 'bg-indigo-600' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${isFilled ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom Left Control Bar (Zoom & Pan Navigation) */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-1 p-1.5 rounded-xl border shadow-lg z-30 pointer-events-auto backdrop-blur-xl bg-slate-900/90 border-slate-700 text-slate-200">
        <button
          type="button"
          onClick={() => handleZoom(-0.1)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="px-2.5 py-1 hover:bg-slate-800 rounded-lg text-xs font-bold text-indigo-400 transition-colors"
          title="Reset Zoom (100%)"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          type="button"
          onClick={() => handleZoom(0.1)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-1" />

        {/* Background Grid Pattern Switcher */}
        <button
          type="button"
          onClick={() => {
            const patterns: ('dots' | 'grid' | 'lines' | 'blank')[] = ['dots', 'grid', 'lines', 'blank'];
            const nextIdx = (patterns.indexOf(bgPattern) + 1) % patterns.length;
            setBgPattern(patterns[nextIdx]);
          }}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
          title="Grid Background Pattern"
        >
          <Grid className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] uppercase font-bold text-slate-400">{bgPattern}</span>
        </button>
      </div>

      {/* Top Right Action Buttons (Undo, Redo, Download, Clear) */}
      <div className="absolute top-4 right-4 flex items-center space-x-1.5 p-1.5 rounded-xl border shadow-lg z-30 pointer-events-auto backdrop-blur-xl bg-slate-900/90 border-slate-700 text-slate-200">
        <button
          type="button"
          onClick={handleUndo}
          disabled={localHistory.length === 0}
          className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-2 hover:bg-slate-800 disabled:opacity-40 rounded-lg text-slate-300 hover:text-white transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

        <button
          type="button"
          onClick={handleDownloadSnapshot}
          className="p-2 hover:bg-slate-800 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
          title="Export Image"
        >
          <Download className="w-4 h-4" />
        </button>

        {selectedActionId && (
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center space-x-1 text-xs font-bold"
            title="Delete Selected Item (Del / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleClearAll}
          className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
          title="Clear Whiteboard"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onWheel={handleWheel}
        className={`w-full h-full touch-none ${
          activeTool === 'select'
            ? isDraggingSelected
              ? 'cursor-grabbing'
              : 'cursor-default'
            : activeTool === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'laser'
            ? 'cursor-crosshair'
            : activeTool === 'text' || activeTool === 'sticky'
            ? 'cursor-text'
            : 'cursor-crosshair'
        }`}
      />

      {/* Inline Floating Text Label Creation Modal */}
      {textInputPos && (
        <div
          className="absolute z-50 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex items-center space-x-2"
          style={{
            left: Math.min(window.innerWidth - 250, textInputPos.x * scale + panOffset.x),
            top: Math.min(window.innerHeight - 120, textInputPos.y * scale + panOffset.y),
          }}
        >
          <input
            type="text"
            autoFocus
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInsertText();
              if (e.key === 'Escape') setTextInputPos(null);
            }}
            placeholder="Type text label..."
            className="px-3 py-2 text-sm bg-slate-950 text-white rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleInsertText}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Inline Floating Sticky Note Creation Modal */}
      {stickyInputPos && (
        <div
          className="absolute z-50 p-4 border rounded-2xl shadow-2xl flex flex-col space-y-3 w-64"
          style={{
            backgroundColor: activeStickyBg,
            borderColor: 'rgba(0,0,0,0.15)',
            left: Math.min(window.innerWidth - 300, stickyInputPos.x * scale + panOffset.x),
            top: Math.min(window.innerHeight - 220, stickyInputPos.y * scale + panOffset.y),
          }}
        >
          <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">New Sticky Note</h4>
          <textarea
            autoFocus
            rows={3}
            value={stickyContent}
            onChange={(e) => setStickyContent(e.target.value)}
            placeholder="Type sticky note text..."
            className="w-full p-2.5 text-sm bg-white/70 text-slate-900 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setStickyInputPos(null)}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-black/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertSticky}
              className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Place Sticky
            </button>
          </div>
        </div>
      )}

      {/* Edit Content Modal for Existing Text / Sticky */}
      {editingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Edit {editingAction.type === 'sticky' ? 'Sticky Note' : 'Text Label'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              autoFocus
              rows={4}
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="w-full p-3 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Active Board Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Clear Board Page</h3>
                <p className="text-xs text-slate-400">Are you sure you want to clear this board?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              This action will remove all drawings and elements on <strong className="text-indigo-400">{boards.find((b) => b.id === activeBoardId)?.name || 'this board'}</strong> for all meeting participants.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  actions
                    .filter((act) => act.boardId === activeBoardId || (!act.boardId && activeBoardId === 'board_1'))
                    .forEach((act) => {
                      onEmitAction({
                        ...act,
                        type: 'delete',
                        isDeleted: true,
                        userId: currentUser.id,
                        userName: currentUser.name,
                        timestamp: Date.now(),
                      });
                    });
                  setSelectedActionId(null);
                  setShowClearConfirmModal(false);
                  setToastMessage('Board cleared');
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Live Remote Collaborator Cursors */}
      {Array.from(remoteCursors.values()).map((cur: WhiteboardCursor) => (
        <div
          key={cur.socketId}
          className="absolute pointer-events-none transition-all duration-75 flex items-center space-x-1.5 z-20"
          style={{
            left: cur.x * scale + panOffset.x,
            top: cur.y * scale + panOffset.y,
          }}
        >
          <div
            className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md animate-pulse"
            style={{ backgroundColor: cur.color }}
          />
          <span
            className="px-2 py-0.5 rounded-md text-[10px] text-white font-bold shadow-md tracking-tight"
            style={{ backgroundColor: cur.color }}
          >
            {cur.userName}
          </span>
        </div>
      ))}
        </>
      )}
    </div>
  );
};
