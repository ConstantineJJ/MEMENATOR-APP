import React, { useState } from 'react';
import { TextBox } from '../types';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  SunMedium,
  Check,
  Spline,
} from 'lucide-react';

interface MemeTextStyleBarProps {
  textBoxes: TextBox[];
  selectedBoxId: string | null;
  onUpdateTextBox: (id: string, updates: Partial<TextBox>) => void;
}

const FONTS = [
  { id: 'Anton', label: 'Impact / Anton' },
  { id: 'Bebas Neue', label: 'Bebas Neue' },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Rubik', label: 'Rubik (Жирный)' },
  { id: 'Comic Neue', label: 'Comic Sans' },
  { id: 'Oswald', label: 'Oswald' },
  { id: 'Playfair Display', label: 'Playfair' },
  { id: 'VT323', label: '8-Bit Pixel' },
];

const TEXT_COLOR_PALETTE = [
  { color: '#ffffff', label: 'Белый' },
  { color: '#facc15', label: 'Желтый' },
  { color: '#22d3ee', label: 'Циан' },
  { color: '#f87171', label: 'Красный' },
  { color: '#4ade80', label: 'Салатовый' },
  { color: '#fb923c', label: 'Оранжевый' },
  { color: '#c084fc', label: 'Фиолетовый' },
  { color: '#000000', label: 'Черный' },
];

const STROKE_COLOR_PALETTE = [
  { color: '#000000', label: 'Черный' },
  { color: '#ffffff', label: 'Белый' },
  { color: '#ef4444', label: 'Красный' },
  { color: '#06b6d4', label: 'Неон' },
  { color: '#10b981', label: 'Изумруд' },
  { color: '#f59e0b', label: 'Золото' },
  { color: '#a855f7', label: 'Пурпур' },
];

const SHADOW_COLOR_PALETTE = [
  { color: 'rgba(0, 0, 0, 0.95)', name: 'Черная', hex: '#000000' },
  { color: 'rgba(239, 68, 68, 0.95)', name: 'Огонь', hex: '#ef4444' },
  { color: 'rgba(245, 158, 11, 0.95)', name: 'Золото', hex: '#f59e0b' },
  { color: 'rgba(6, 182, 212, 0.95)', name: 'Неон', hex: '#06b6d4' },
  { color: 'rgba(168, 85, 247, 0.95)', name: 'Пурпур', hex: '#a855f7' },
  { color: 'rgba(16, 185, 129, 0.95)', name: 'Изумруд', hex: '#10b981' },
];

interface MemeStylePreset {
  id: string;
  name: string;
  apply: () => Partial<TextBox>;
}

const STYLE_PRESETS: MemeStylePreset[] = [
  {
    id: 'classic',
    name: 'Классика',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeWidth: 3,
      strokeType: 'outer',
      strokeColor: '#000000',
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'meme-impact',
    name: 'Impact Мем',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeWidth: 4,
      strokeType: 'outer',
      strokeColor: '#000000',
      shadow: false,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'neon',
    name: 'Неон',
    apply: () => ({
      fontFamily: 'Bebas Neue',
      color: '#22d3ee',
      strokeWidth: 1.5,
      strokeType: 'inner',
      strokeColor: '#ffffff',
      shadow: true,
      shadowColor: 'rgba(6, 182, 212, 0.95)',
      shadowBlur: 18,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'fire',
    name: 'Огонь',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#fef08a',
      strokeWidth: 2.5,
      strokeType: 'outer',
      strokeColor: '#ef4444',
      shadow: true,
      shadowColor: 'rgba(239, 68, 68, 0.95)',
      shadowBlur: 18,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'gold',
    name: 'Золото',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeWidth: 2,
      strokeType: 'outer',
      strokeColor: '#b45309',
      shadow: true,
      shadowColor: 'rgba(245, 158, 11, 0.95)',
      shadowBlur: 18,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'subtitle',
    name: 'Субтитры',
    apply: () => ({
      fontFamily: 'Rubik',
      color: '#facc15',
      strokeWidth: 2,
      strokeType: 'outer',
      strokeColor: '#000000',
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 12,
      isUppercase: false,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    apply: () => ({
      fontFamily: 'Montserrat',
      color: '#ffffff',
      strokeWidth: 0,
      isUppercase: false,
      shadow: false,
      hasBackground: true,
      bgColor: 'rgba(0, 0, 0, 0.85)',
      isBold: true,
    }),
  },
  {
    id: 'arcade',
    name: '8-Bit',
    apply: () => ({
      fontFamily: 'VT323',
      color: '#4ade80',
      strokeWidth: 2,
      strokeType: 'outer',
      strokeColor: '#000000',
      shadow: true,
      shadowColor: 'rgba(16, 185, 129, 0.95)',
      shadowBlur: 14,
      isUppercase: true,
      hasBackground: false,
      fontSize: 42,
      isBold: true,
    }),
  },
];

export const MemeTextStyleBar: React.FC<MemeTextStyleBarProps> = ({
  textBoxes,
  selectedBoxId,
  onUpdateTextBox,
}) => {
  const [applyToBoth, setApplyToBoth] = useState(false);

  const activeBox =
    textBoxes.find((b) => b.id === selectedBoxId) || textBoxes[0] || null;

  if (!activeBox) return null;

  const applyUpdate = (updates: Partial<TextBox>) => {
    if (applyToBoth) {
      textBoxes.forEach((b) => onUpdateTextBox(b.id, updates));
    } else {
      onUpdateTextBox(activeBox.id, updates);
    }
  };

  const currentStrokeType = activeBox.strokeType || (activeBox.strokeWidth > 0 ? 'outer' : 'none');
  const currentStrokeWidth = activeBox.strokeWidth !== undefined ? activeBox.strokeWidth : 0;
  const currentStrokeColor = activeBox.strokeColor || '#000000';

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 backdrop-blur shadow-xl flex flex-col gap-2 z-20">
      {/* Row 1: Style Presets & Multi-box Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 shrink-0">
            Стиль:
          </span>
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyUpdate(p.apply())}
              className="px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-400/80 hover:text-amber-300 text-neutral-300 text-[11px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Global / single line toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setApplyToBoth(!applyToBoth)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              applyToBoth
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-neutral-800/60 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {applyToBoth ? '✓ Ко всем строкам' : 'Ко всем строкам'}
          </button>
        </div>
      </div>

      {/* Row 2: Typography, Size, Colors, Alignment */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800/60 text-xs">
        {/* Font Select */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold text-neutral-400">Шрифт:</span>
          <select
            value={activeBox.fontFamily}
            onChange={(e) => applyUpdate({ fontFamily: e.target.value })}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id} className="bg-neutral-900">
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size Stepper */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold text-neutral-400">Кегль:</span>
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => applyUpdate({ fontSize: Math.max(16, activeBox.fontSize - 4) })}
              className="w-4 h-4 flex items-center justify-center rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer font-bold text-xs"
            >
              -
            </button>
            <span className="font-mono text-xs font-bold text-amber-400 px-1.5">
              {activeBox.fontSize}
            </span>
            <button
              type="button"
              onClick={() => applyUpdate({ fontSize: Math.min(80, activeBox.fontSize + 4) })}
              className="w-4 h-4 flex items-center justify-center rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer font-bold text-xs"
            >
              +
            </button>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        {/* Text Color Swatches */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold text-neutral-400">Цвет:</span>
          <div className="flex items-center gap-1">
            {TEXT_COLOR_PALETTE.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => applyUpdate({ color: c.color })}
                className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  activeBox.color.toLowerCase() === c.color.toLowerCase()
                    ? 'ring-2 ring-amber-400 scale-110 border-white'
                    : 'border-neutral-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.label}
              >
                {activeBox.color.toLowerCase() === c.color.toLowerCase() && (
                  <Check
                    className={`w-2.5 h-2.5 ${
                      c.color === '#ffffff' || c.color === '#facc15' || c.color === '#4ade80'
                        ? 'text-neutral-950'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}

            <input
              type="color"
              value={activeBox.color.startsWith('#') ? activeBox.color : '#ffffff'}
              onChange={(e) => applyUpdate({ color: e.target.value })}
              className="w-5 h-5 rounded-full border border-neutral-700 bg-transparent cursor-pointer p-0 overflow-hidden"
              title="Произвольный цвет"
            />
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden lg:block" />

        {/* Alignment, Uppercase (AA), Banner (Плашка) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Alignment */}
          <div className="flex items-center bg-neutral-950 rounded-lg border border-neutral-800 p-0.5">
            <button
              type="button"
              onClick={() => applyUpdate({ textAlign: 'left' })}
              className={`p-1 rounded transition cursor-pointer ${
                activeBox.textAlign === 'left' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
              title="По левому краю"
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => applyUpdate({ textAlign: 'center' })}
              className={`p-1 rounded transition cursor-pointer ${
                activeBox.textAlign === 'center' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
              title="По центру"
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => applyUpdate({ textAlign: 'right' })}
              className={`p-1 rounded transition cursor-pointer ${
                activeBox.textAlign === 'right' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
              }`}
              title="По правому краю"
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>

          {/* Caps (AA) */}
          <button
            type="button"
            onClick={() => applyUpdate({ isUppercase: !activeBox.isUppercase })}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              activeBox.isUppercase
                ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400'
            }`}
            title="ЗАГЛАВНЫЕ БУКВЫ"
          >
            АА
          </button>

          {/* Banner (Плашка) */}
          <button
            type="button"
            onClick={() => applyUpdate({ hasBackground: !activeBox.hasBackground })}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              activeBox.hasBackground
                ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400'
            }`}
            title="Контрастная фоновая плашка"
          >
            Плашка
          </button>
        </div>
      </div>

      {/* Row 3: ОБВОДКА (ВНЕШНЯЯ / ВНУТРЕННЯЯ) & ТЕНЬ */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-neutral-800/60 text-xs">
        {/* ОБВОДКА СЕКЦИЯ */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Обводка:
            </span>

            {/* Type selector: Внешняя, Внутренняя, Выкл */}
            <div className="flex items-center bg-neutral-950 rounded-lg border border-neutral-800 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() =>
                  applyUpdate({
                    strokeType: 'outer',
                    strokeWidth: currentStrokeWidth > 0 ? currentStrokeWidth : 3,
                  })
                }
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  currentStrokeWidth > 0 && currentStrokeType === 'outer'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Внешняя обводка вокруг букв (классический мемный стиль)"
              >
                Внешняя
              </button>
              <button
                type="button"
                onClick={() =>
                  applyUpdate({
                    strokeType: 'inner',
                    strokeWidth: currentStrokeWidth > 0 ? currentStrokeWidth : 2,
                  })
                }
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  currentStrokeWidth > 0 && currentStrokeType === 'inner'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Внутренняя обводка по внутреннему контуру текста"
              >
                Внутренняя
              </button>
              <button
                type="button"
                onClick={() => applyUpdate({ strokeWidth: 0 })}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                  currentStrokeWidth === 0
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Без обводки"
              >
                Выкл
              </button>
            </div>
          </div>

          {/* Stroke Width Stepper / Presets if active */}
          {currentStrokeWidth > 0 && (
            <>
              {/* Width Presets */}
              <div className="flex items-center bg-neutral-950 rounded-lg border border-neutral-800 p-0.5 text-[10px] font-mono">
                {[1, 2, 3, 4, 6].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => applyUpdate({ strokeWidth: w })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                      currentStrokeWidth === w
                        ? 'bg-amber-400/25 text-amber-300 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              {/* Stroke Colors */}
              <div className="flex items-center gap-1">
                {STROKE_COLOR_PALETTE.map((sc) => {
                  const isCur = currentStrokeColor.toLowerCase() === sc.color.toLowerCase();
                  return (
                    <button
                      key={sc.color}
                      type="button"
                      onClick={() => applyUpdate({ strokeColor: sc.color })}
                      className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                        isCur
                          ? 'ring-2 ring-amber-400 scale-110 border-white'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sc.color }}
                      title={`Цвет обводки: ${sc.label}`}
                    />
                  );
                })}

                <input
                  type="color"
                  value={currentStrokeColor.startsWith('#') ? currentStrokeColor : '#000000'}
                  onChange={(e) => applyUpdate({ strokeColor: e.target.value })}
                  className="w-4 h-4 rounded-full border border-neutral-700 bg-transparent cursor-pointer p-0 overflow-hidden"
                  title="Свой цвет обводки"
                />
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden md:block" />

        {/* ТЕНЬ СЕКЦИЯ */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => applyUpdate({ shadow: !activeBox.shadow })}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeBox.shadow
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Переключить цветную тень"
          >
            <SunMedium className="w-3 h-3" />
            <span>Тень: {activeBox.shadow ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </button>

          {activeBox.shadow && (
            <>
              {/* Blur levels */}
              <div className="flex items-center bg-neutral-950 rounded-lg border border-neutral-800 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => applyUpdate({ shadowBlur: 8 })}
                  className={`px-1.5 py-0.2 rounded cursor-pointer ${
                    (activeBox.shadowBlur || 14) <= 8
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  Мягк
                </button>
                <button
                  type="button"
                  onClick={() => applyUpdate({ shadowBlur: 14 })}
                  className={`px-1.5 py-0.2 rounded cursor-pointer ${
                    (activeBox.shadowBlur || 14) > 8 && (activeBox.shadowBlur || 14) <= 16
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  Сочн
                </button>
                <button
                  type="button"
                  onClick={() => applyUpdate({ shadowBlur: 22 })}
                  className={`px-1.5 py-0.2 rounded cursor-pointer ${
                    (activeBox.shadowBlur || 14) > 16
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-neutral-400'
                  }`}
                >
                  Неон
                </button>
              </div>

              {/* Shadow Colors */}
              <div className="flex items-center gap-1">
                {SHADOW_COLOR_PALETTE.map((sh) => {
                  const isCurrent = activeBox.shadowColor === sh.color;
                  return (
                    <button
                      key={sh.name}
                      type="button"
                      onClick={() =>
                        applyUpdate({
                          shadow: true,
                          shadowColor: sh.color,
                          shadowBlur: activeBox.shadowBlur || 14,
                        })
                      }
                      className={`w-4 h-4 rounded-full border transition cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-amber-400 scale-110 border-white'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sh.hex }}
                      title={`Тень: ${sh.name}`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
