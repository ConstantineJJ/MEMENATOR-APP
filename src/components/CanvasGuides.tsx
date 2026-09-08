import React from 'react';
import { CompositionAnalysis, CompositionGuideType } from '../types';

export interface SnappingGuideState {
  vertical: boolean;
  horizontal: boolean;
  top: boolean;
  bottom: boolean;
}

interface CanvasGuidesProps {
  guideType: CompositionGuideType;
  compositionAnalysis: CompositionAnalysis | null;
  activeGuides: SnappingGuideState;
}

/** Static composition overlays plus transient snapping guides. Extracting these
 * keeps the interactive viewport focused on pointer state rather than a large
 * block of decorative JSX. */
export const CanvasGuides: React.FC<CanvasGuidesProps> = ({
  guideType,
  compositionAnalysis,
  activeGuides,
}) => (
  <>
    {guideType === 'thirds' && (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 left-[33.333%] w-px border-l-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
        <div className="absolute inset-y-0 left-[66.667%] w-px border-l-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
        <div className="absolute inset-x-0 top-[33.333%] h-px border-t-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
        <div className="absolute inset-x-0 top-[66.667%] h-px border-t-2 border-dashed border-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
        {[33.333, 66.667].flatMap((x) => [33.333, 66.667].map((y) => (
          <div
            key={`${x}-${y}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-200 bg-cyan-400/40 ring-4 ring-cyan-400/30 animate-pulse shadow-md"
          />
        )))}
        <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-cyan-500/40 shadow-lg">
          📐 Правило третей (3×3)
        </div>
      </div>
    )}

    {guideType === 'golden' && (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
        <div className="absolute inset-y-0 left-[38.2%] w-px border-l-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        <div className="absolute inset-y-0 left-[61.8%] w-px border-l-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        <div className="absolute inset-x-0 top-[38.2%] h-px border-t-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        <div className="absolute inset-x-0 top-[61.8%] h-px border-t-2 border-dashed border-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        <svg className="absolute inset-0 w-full h-full text-amber-400/80" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M 0,100 A 100,100 0 0,1 100,0 A 61.8,61.8 0 0,1 100,61.8 A 38.2,38.2 0 0,1 61.8,61.8 A 23.6,23.6 0 0,1 61.8,38.2 A 14.6,14.6 0 0,1 76.4,38.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeDasharray="3,3"
          />
        </svg>
        <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/40 shadow-lg">
          🌀 Золотое сечение (φ = 1.618)
        </div>
      </div>
    )}

    {guideType === 'focal' && compositionAnalysis?.focalSubjects && (
      <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl">
        {compositionAnalysis.focalSubjects.map((subject, index) => (
          <div
            key={`${subject.name}-${index}`}
            style={{
              left: `${subject.box.x}%`,
              top: `${subject.box.y}%`,
              width: `${subject.box.width}%`,
              height: `${subject.box.height}%`,
            }}
            className="absolute border-2 border-dashed border-rose-400 bg-rose-500/15 rounded-xl shadow-lg shadow-rose-500/30 p-1 flex flex-col justify-between"
          >
            <span className="bg-rose-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow self-start">
              🎯 {subject.name}
            </span>
            <span className="text-[9px] bg-neutral-950/90 text-rose-300 font-medium px-1.5 py-0.5 rounded self-start">
              Не перекрывать текстом
            </span>
          </div>
        ))}
        <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-500/40 shadow-lg">
          🎯 Ключевые фокусные фигуры
        </div>
      </div>
    )}

    {guideType === 'zones' && compositionAnalysis?.safeZones && (
      <div className="absolute inset-0 pointer-events-none z-30 rounded-2xl">
        {compositionAnalysis.safeZones.map((zone, index) => (
          <div
            key={`${zone.area}-${index}`}
            style={{
              left: `${zone.box.x}%`,
              top: `${zone.box.y}%`,
              width: `${zone.box.width}%`,
              height: `${zone.box.height}%`,
            }}
            className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/20 rounded-xl shadow-lg shadow-emerald-500/30 p-1.5 flex items-center justify-between"
          >
            <span className="bg-emerald-400 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">
              🟩 {zone.area === 'top' ? 'Зона завязки (Сетап)' : 'Зона панчлайна'}
            </span>
            <span className="text-[9px] text-emerald-300 font-black bg-neutral-950/90 px-1.5 py-0.5 rounded">
              Контраст: {zone.contrastQuality === 'excellent' ? '100%' : '80%'}
            </span>
          </div>
        ))}
        <div className="absolute bottom-2 right-2 bg-neutral-950/85 backdrop-blur text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-500/40 shadow-lg">
          🟩 Безопасные зоны для текста
        </div>
      </div>
    )}

    {activeGuides.vertical && (
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none z-40">
        <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-cyan-400 text-neutral-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          Центр 50%
        </span>
      </div>
    )}
    {activeGuides.horizontal && (
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 border-t-2 border-dashed border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] pointer-events-none z-40">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-cyan-400 text-neutral-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          Центр Y 50%
        </span>
      </div>
    )}
    {activeGuides.top && (
      <div className="absolute inset-x-0 top-[12%] -translate-y-1/2 h-0.5 border-t-2 border-dashed border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none z-40">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-400 text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          Верхний текст
        </span>
      </div>
    )}
    {activeGuides.bottom && (
      <div className="absolute inset-x-0 top-[88%] -translate-y-1/2 h-0.5 border-t-2 border-dashed border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] pointer-events-none z-40">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-amber-400 text-neutral-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          Нижний текст
        </span>
      </div>
    )}
  </>
);
