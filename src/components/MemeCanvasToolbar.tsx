import React from 'react';
import {
  Check,
  Copy,
  Crop,
  Download,
  Grid,
  Redo2,
  Target,
  Undo2,
} from 'lucide-react';
import { CompositionAnalysis, CompositionGuideType } from '../types';
import { MemeDownloadFormat } from '../hooks/useCanvasExport';

interface MemeCanvasToolbarProps {
  onOpenCrop: () => void;
  compositionAnalysis: CompositionAnalysis | null;
  isAnalyzingComposition: boolean;
  onOpenCompositionAnalysis?: () => void;
  guideType: CompositionGuideType;
  onSetGuideType?: (type: CompositionGuideType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  copied: boolean;
  onCopy: () => void;
  downloadFormat: MemeDownloadFormat;
  onDownloadFormatChange: (format: MemeDownloadFormat) => void;
  onDownload: () => void;
}

const GUIDE_CYCLE: Record<CompositionGuideType, CompositionGuideType> = {
  none: 'thirds',
  thirds: 'golden',
  golden: 'focal',
  focal: 'zones',
  zones: 'none',
};

function guideLabel(guideType: CompositionGuideType) {
  switch (guideType) {
    case 'thirds': return 'Трети';
    case 'golden': return 'Спираль';
    case 'focal': return 'Объекты';
    case 'zones': return 'Зоны';
    default: return 'Сетка';
  }
}

/**
 * Pure toolbar for the meme viewport. Deliberately exposes only proportional
 * Fit semantics: the old stretch-based Fill switch was removed because it
 * could never match the source-aspect-ratio export.
 */
export const MemeCanvasToolbar: React.FC<MemeCanvasToolbarProps> = ({
  onOpenCrop,
  compositionAnalysis,
  isAnalyzingComposition,
  onOpenCompositionAnalysis,
  guideType,
  onSetGuideType,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  copied,
  onCopy,
  downloadFormat,
  onDownloadFormatChange,
  onDownload,
}) => (
  <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-1.5 bg-neutral-900/90 p-2 sm:p-2.5 rounded-2xl border border-neutral-800 shadow-sm backdrop-blur shrink-0">
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        id="crop-zoom-btn"
        onClick={onOpenCrop}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 hover:border-amber-400/40 transition active:scale-95 cursor-pointer"
        title="Обрезать или увеличить фрагмент"
      >
        <Crop className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Зум / Обрезка</span>
      </button>

      {onOpenCompositionAnalysis && (
        <button
          id="composition-analysis-btn"
          onClick={onOpenCompositionAnalysis}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
            compositionAnalysis
              ? 'bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border-neutral-700 hover:border-cyan-400/50'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700 hover:text-white'
          }`}
          title="Интеллектуальный анализ композиции и безопасных зон"
        >
          <Target className={`w-3.5 h-3.5 text-cyan-400 ${isAnalyzingComposition ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Композиция</span>
          {compositionAnalysis ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/10 text-cyan-300 font-black border border-cyan-400/20">
              {compositionAnalysis.overallScore}
            </span>
          ) : isAnalyzingComposition ? (
            <span className="text-[10px] text-cyan-300">...</span>
          ) : null}
        </button>
      )}

      {onSetGuideType && (
        <button
          onClick={() => onSetGuideType(GUIDE_CYCLE[guideType])}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            guideType !== 'none'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border-neutral-700'
          }`}
          title="Сетка композиции (Трети, Золотое сечение, Объекты, Зоны)"
        >
          <Grid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline text-[11px]">{guideLabel(guideType)}</span>
        </button>
      )}

      <div className="flex items-center bg-neutral-950/80 rounded-xl border border-neutral-800 p-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Отменить (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Повторить (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        onClick={onCopy}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
          copied
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
        }`}
        title="Скопировать картинку в буфер обмена"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
        <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать'}</span>
      </button>

      <div className="flex items-center rounded-xl bg-neutral-950 border border-neutral-800 p-0.5">
        <button
          onClick={() => onDownloadFormatChange('png')}
          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
            downloadFormat === 'png' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          PNG
        </button>
        <button
          onClick={() => onDownloadFormatChange('jpeg')}
          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
            downloadFormat === 'jpeg' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          JPG
        </button>
      </div>

      <button
        id="download-meme-btn"
        onClick={onDownload}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition active:scale-95 shadow cursor-pointer"
        title="Скачать готовый мем в высоком качестве"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Скачать</span>
      </button>
    </div>
  </div>
);
