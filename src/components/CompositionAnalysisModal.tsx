import React from 'react';
import {
  Sparkles,
  X,
  Target,
  CheckCircle2,
  Sliders,
  Grid,
  Zap,
  Eye,
  RefreshCw,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { CompositionAnalysis, CompositionGuideType } from '../types';

interface CompositionAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: CompositionAnalysis | null;
  isLoading: boolean;
  onReAnalyze: () => void;
  onApplyOptimization: () => void;
  guideType: CompositionGuideType;
  onSetGuideType: (type: CompositionGuideType) => void;
}

export const CompositionAnalysisModal: React.FC<CompositionAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onReAnalyze,
  onApplyOptimization,
  guideType,
  onSetGuideType,
}) => {
  if (!isOpen) return null;

  const score = analysis?.overallScore ?? 85;
  const scoreColor =
    score >= 85 ? 'text-emerald-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg =
    score >= 85 ? 'bg-emerald-500/10 border-emerald-500/30' : score >= 70 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-neutral-950 shadow-md">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Интеллектуальный анализ композиции
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  AI Vision
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Оценка баланса, фокусных точек, безопасных зон и читаемости мема
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-800 border-t-amber-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Анализируем композицию кадра...</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Нейросеть определяет ключевые объекты, направление взглядов, зоны контраста и баланс по правилу третей.
                </p>
              </div>
            </div>
          ) : analysis ? (
            <>
              {/* Score & Balance Overview Card */}
              <div className={`p-4 rounded-2xl border ${scoreBg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Оценка композиции
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-300 font-medium">
                      {analysis.ruleOfThirdsAlignment === 'strong'
                        ? 'Правило третей: Отлично'
                        : analysis.ruleOfThirdsAlignment === 'moderate'
                        ? 'Правило третей: Умеренно'
                        : 'Правило третей: Центрировано'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {analysis.balanceAssessment}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Стиль кадра: <span className="text-neutral-200">{analysis.detectedStyle}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <div className={`text-3xl font-black ${scoreColor}`}>
                      {score}
                      <span className="text-sm font-bold text-neutral-500">/100</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-medium">
                      {score >= 85 ? 'Высокий потенциал' : 'Хороший баланс'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Composition Metric Bars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Метрики гармонии и читаемости
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400 text-[11px]">Баланс веса</span>
                      <span className="font-bold text-white">{analysis.metrics.visualBalance}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.metrics.visualBalance}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400 text-[11px]">Чистое место</span>
                      <span className="font-bold text-white">{analysis.metrics.negativeSpace}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.metrics.negativeSpace}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400 text-[11px]">Контраст</span>
                      <span className="font-bold text-white">{analysis.metrics.contrastReadability}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.metrics.contrastReadability}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-400 text-[11px]">Фокус мема</span>
                      <span className="font-bold text-white">{analysis.metrics.comedicFocus}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.metrics.comedicFocus}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Guide Switcher (Rule of Thirds, Golden Spiral, Safe Zones) */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-cyan-400" />
                    Отобразить сетку композиции на холсте:
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Интерактивные направляющие
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    onClick={() => onSetGuideType('none')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      guideType === 'none'
                        ? 'bg-neutral-800 text-white border-neutral-600'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Скрыть сетку
                  </button>
                  <button
                    onClick={() => onSetGuideType('thirds')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      guideType === 'thirds'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>📐 1/3 Трети</span>
                  </button>
                  <button
                    onClick={() => onSetGuideType('golden')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      guideType === 'golden'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>🌀 Золотое сеч.</span>
                  </button>
                  <button
                    onClick={() => onSetGuideType('focal')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      guideType === 'focal'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>🎯 Объекты</span>
                  </button>
                  <button
                    onClick={() => onSetGuideType('zones')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                      guideType === 'zones'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>🟩 Зоны текста</span>
                  </button>
                </div>
              </div>

              {/* Focal Subjects & Safe Zones Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Focal Subjects */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Обнаруженные ключевые объекты</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {analysis.focalSubjects.map((subj, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>{subj.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                            X: {Math.round(subj.box.x)}% Y: {Math.round(subj.box.y)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">
                          {subj.description}
                        </p>
                        {subj.gazeDirection && subj.gazeDirection !== 'none' && (
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                            <span>Направление взгляда:</span>
                            <span className="text-neutral-300 font-semibold">
                              {subj.gazeDirection === 'right'
                                ? 'Вправо →'
                                : subj.gazeDirection === 'left'
                                ? '← Влево'
                                : subj.gazeDirection === 'direct'
                                ? 'Прямо на зрителя 👁️'
                                : subj.gazeDirection === 'up'
                                ? 'Вверх ↑'
                                : 'Вниз ↓'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safe Zones */}
                <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Безопасные зоны для текста</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {analysis.safeZones.map((zone, idx) => (
                      <div
                        key={idx}
                        className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>
                            {zone.area === 'top'
                              ? 'Верхняя область (Сетап)'
                              : zone.area === 'bottom'
                              ? 'Нижняя область (Панчлайн)'
                              : `Область ${zone.area}`}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                            Контраст: {zone.contrastQuality === 'excellent' ? 'Отличный' : 'Хороший'}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">
                          {zone.reason}
                        </p>
                        <div className="text-[10px] text-neutral-500">
                          Рекомендуемый цвет:{' '}
                          <span className="text-neutral-300 font-bold">{zone.recommendedTextColor}</span> +{' '}
                          <span className="text-neutral-300 font-bold">{zone.recommendedStrokeColor} обводка</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Рекомендации арт-директора по доработке</span>
                </div>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-neutral-400 space-y-3">
              <HelpCircle className="w-10 h-10 mx-auto text-neutral-600" />
              <p className="text-sm">Анализ еще не проведен или возникла задержка сети.</p>
              <button
                onClick={onReAnalyze}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs cursor-pointer transition"
              >
                Запустить анализ
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer with 1-Click Auto-Optimize Button */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={onReAnalyze}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Обновить анализ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                onApplyOptimization();
                onClose();
              }}
              disabled={!analysis || isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-neutral-950 hover:brightness-110 active:scale-95 transition shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>Автоматически выровнять текст</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
