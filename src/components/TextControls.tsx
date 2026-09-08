import React, { useState } from 'react';
import { TextBox } from '../types';
import {
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  RotateCcw,
  Sparkles,
  SunMedium,
  Check,
  Palette,
} from 'lucide-react';

interface TextControlsProps {
  textBoxes: TextBox[];
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onUpdateTextBox: (id: string, updates: Partial<TextBox>) => void;
  onAddTextBox: () => void;
  onRemoveTextBox: (id: string) => void;
  onResetPositions: () => void;
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
  { color: '#4ade80', label: 'Зеленый' },
  { color: '#fb923c', label: 'Оранжевый' },
  { color: '#c084fc', label: 'Фиолетовый' },
  { color: '#000000', label: 'Черный' },
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
  badge: string;
  apply: () => Partial<TextBox>;
}

const STYLE_PRESETS: MemeStylePreset[] = [
  {
    id: 'classic',
    name: 'Классика',
    badge: 'CLASSIC',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeWidth: 0,
      shadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      shadowBlur: 14,
      isUppercase: true,
      hasBackground: false,
      isBold: true,
    }),
  },
  {
    id: 'neon',
    name: 'Неон',
    badge: 'NEON',
    apply: () => ({
      fontFamily: 'Bebas Neue',
      color: '#22d3ee',
      strokeWidth: 0,
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
    badge: 'FIRE',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#fef08a',
      strokeWidth: 0,
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
    badge: 'GOLD',
    apply: () => ({
      fontFamily: 'Anton',
      color: '#ffffff',
      strokeWidth: 0,
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
    badge: 'SUBS',
    apply: () => ({
      fontFamily: 'Rubik',
      color: '#facc15',
      strokeWidth: 0,
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
    badge: 'TIKTOK',
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
    badge: 'PIXEL',
    apply: () => ({
      fontFamily: 'VT323',
      color: '#4ade80',
      strokeWidth: 0,
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

export const TextControls: React.FC<TextControlsProps> = ({
  textBoxes,
  selectedBoxId,
  onSelectBox,
  onUpdateTextBox,
  onAddTextBox,
  onRemoveTextBox,
  onResetPositions,
}) => {
  const activeBox = textBoxes.find((b) => b.id === selectedBoxId) || textBoxes[0];

  // Helper to apply preset to all text boxes or the active one
  const handleApplyPresetToAll = (preset: MemeStylePreset) => {
    textBoxes.forEach((box) => {
      onUpdateTextBox(box.id, preset.apply());
    });
  };

  // Helper to apply updates to all boxes or currently selected
  const [applyToBoth, setApplyToBoth] = useState(false);

  const applyUpdate = (updates: Partial<TextBox>) => {
    if (applyToBoth) {
      textBoxes.forEach((b) => onUpdateTextBox(b.id, updates));
    } else if (activeBox) {
      onUpdateTextBox(activeBox.id, updates);
    }
  };

  // Primary top and bottom boxes (guaranteed index 0 and 1, or fallback)
  const topBox = textBoxes[0];
  const bottomBox = textBoxes[1];
  const extraBoxes = textBoxes.slice(2);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-3.5 sm:p-4 backdrop-blur space-y-3.5 shadow-xl w-full">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-bold text-xs">
            ✍️
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Текст мема
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAddTextBox}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-amber-400/50 transition cursor-pointer"
            title="Добавить дополнительную строку"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>+ Строка</span>
          </button>
          <button
            onClick={onResetPositions}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
            title="Сбросить позиции текста по умолчанию"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* DUAL TEXT EDITING: BOTH LINES VISIBLE SIMULTANEOUSLY */}
      <div className="space-y-2.5">
        {/* LINE 1: TOP TEXT */}
        {topBox && (
          <div
            onClick={() => onSelectBox(topBox.id)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              activeBox?.id === topBox.id
                ? 'bg-neutral-950 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Верхний текст
              </span>
              {activeBox?.id === topBox.id ? (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase tracking-wider">
                  Редактируется
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500">Клик для выбора</span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={topBox.text}
                onFocus={() => onSelectBox(topBox.id)}
                onChange={(e) => onUpdateTextBox(topBox.id, { text: e.target.value })}
                placeholder="Введите верхний текст мема..."
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none focus:border-amber-400/80 transition pr-7"
              />
              {topBox.text && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTextBox(topBox.id, { text: '' });
                  }}
                  className="absolute right-2 text-neutral-400 hover:text-white text-xs cursor-pointer p-0.5"
                  title="Очистить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* LINE 2: BOTTOM TEXT */}
        {bottomBox && (
          <div
            onClick={() => onSelectBox(bottomBox.id)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              activeBox?.id === bottomBox.id
                ? 'bg-neutral-950 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Нижний текст
              </span>
              {activeBox?.id === bottomBox.id ? (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase tracking-wider">
                  Редактируется
                </span>
              ) : (
                <span className="text-[10px] text-neutral-500">Клик для выбора</span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                value={bottomBox.text}
                onFocus={() => onSelectBox(bottomBox.id)}
                onChange={(e) => onUpdateTextBox(bottomBox.id, { text: e.target.value })}
                placeholder="Введите нижний текст мема..."
                className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none focus:border-amber-400/80 transition pr-7"
              />
              {bottomBox.text && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTextBox(bottomBox.id, { text: '' });
                  }}
                  className="absolute right-2 text-neutral-400 hover:text-white text-xs cursor-pointer p-0.5"
                  title="Очистить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* ADDITIONAL CUSTOM LINES (IF ANY) */}
        {extraBoxes.map((box, idx) => (
          <div
            key={box.id}
            onClick={() => onSelectBox(box.id)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              activeBox?.id === box.id
                ? 'bg-neutral-950 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-300">
                Строка #{idx + 3}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTextBox(box.id);
                }}
                className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                title="Удалить строку"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              type="text"
              value={box.text}
              onFocus={() => onSelectBox(box.id)}
              onChange={(e) => onUpdateTextBox(box.id, { text: e.target.value })}
              placeholder="Дополнительный текст..."
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none focus:border-amber-400/80 transition"
            />
          </div>
        ))}
      </div>

      {/* QUICK STYLE PRESETS */}
      <div className="space-y-1.5 pt-1 border-t border-neutral-800/70">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-400 font-bold uppercase">Пресеты оформления:</span>
          <button
            type="button"
            onClick={() => setApplyToBoth(!applyToBoth)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
              applyToBoth
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {applyToBoth ? '✓ Ко всем строкам' : 'Применять к обеим'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPresetToAll(p)}
              className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-400/70 hover:text-amber-300 text-neutral-300 transition whitespace-nowrap cursor-pointer font-bold"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* TYPOGRAPHY, FONT SIZE & ALIGNMENT */}
      {activeBox && (
        <div className="space-y-3 pt-2 border-t border-neutral-800/70">
          <div className="grid grid-cols-2 gap-2">
            {/* Font dropdown */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                Шрифт:
              </label>
              <select
                value={activeBox.fontFamily}
                onChange={(e) => applyUpdate({ fontFamily: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-400 transition cursor-pointer"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-neutral-900">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font size stepper */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 block mb-1">
                Кегль:
              </label>
              <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => applyUpdate({ fontSize: Math.max(16, activeBox.fontSize - 4) })}
                  className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer font-bold text-sm"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-amber-400">
                  {activeBox.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() => applyUpdate({ fontSize: Math.min(80, activeBox.fontSize + 4) })}
                  className="w-5 h-5 flex items-center justify-center rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* COLOR AND READABILITY: FONT COLOR (ЦВЕТНОЙ ШРИФТ) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Цвет шрифта:
              </span>
              <span className="text-[10px] font-mono text-neutral-400 uppercase">
                {activeBox.color}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {TEXT_COLOR_PALETTE.map((c) => (
                <button
                  key={c.color}
                  onClick={() => applyUpdate({ color: c.color })}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    activeBox.color.toLowerCase() === c.color.toLowerCase()
                      ? 'ring-2 ring-amber-400 scale-110 border-white'
                      : 'border-neutral-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                >
                  {activeBox.color.toLowerCase() === c.color.toLowerCase() && (
                    <Check
                      className={`w-3 h-3 ${
                        c.color === '#ffffff' || c.color === '#facc15' || c.color === '#4ade80'
                          ? 'text-neutral-950'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              ))}

              <div className="relative flex items-center">
                <input
                  type="color"
                  value={activeBox.color.startsWith('#') ? activeBox.color : '#ffffff'}
                  onChange={(e) => applyUpdate({ color: e.target.value })}
                  className="w-6 h-6 rounded-full border border-neutral-700 bg-transparent cursor-pointer p-0 overflow-hidden"
                  title="Выбрать любой цвет текста"
                />
              </div>
            </div>
          </div>

          {/* COLORED SHADOW (ЦВЕТНАЯ ТЕНЬ): The user's preferred readable styling! */}
          <div className="space-y-1.5 p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => applyUpdate({ shadow: !activeBox.shadow })}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeBox.shadow
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <SunMedium className="w-3.5 h-3.5" />
                <span>Цветная тень</span>
                <span className="text-[10px] font-black opacity-80">
                  {activeBox.shadow ? 'ВКЛ' : 'ВЫКЛ'}
                </span>
              </button>

              {activeBox.shadow && (
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => applyUpdate({ shadowBlur: 8 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      (activeBox.shadowBlur || 14) <= 8
                        ? 'bg-amber-400/20 text-amber-300 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    Мягкая
                  </button>
                  <button
                    type="button"
                    onClick={() => applyUpdate({ shadowBlur: 14 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      (activeBox.shadowBlur || 14) > 8 && (activeBox.shadowBlur || 14) <= 16
                        ? 'bg-amber-400/20 text-amber-300 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    Сочная
                  </button>
                  <button
                    type="button"
                    onClick={() => applyUpdate({ shadowBlur: 22 })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      (activeBox.shadowBlur || 14) > 16
                        ? 'bg-amber-400/20 text-amber-300 font-bold'
                        : 'text-neutral-400'
                    }`}
                  >
                    Неон
                  </button>
                </div>
              )}
            </div>

            {/* Colored Shadow Presets */}
            {activeBox.shadow && (
              <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold border transition cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shadow-sm"
                        style={{ backgroundColor: sh.hex }}
                      />
                      <span>{sh.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORMATTING ROW: Alignment, Uppercase (AA), Banner (Плашка) */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Alignment buttons */}
            <div className="flex items-center bg-neutral-950 rounded-xl border border-neutral-800 p-0.5">
              <button
                type="button"
                onClick={() => applyUpdate({ textAlign: 'left' })}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  activeBox.textAlign === 'left' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
                title="По левому краю"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyUpdate({ textAlign: 'center' })}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  activeBox.textAlign === 'center' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
                title="По центру"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyUpdate({ textAlign: 'right' })}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  activeBox.textAlign === 'right' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400'
                }`}
                title="По правому краю"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Caps & Banner toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyUpdate({ isUppercase: !activeBox.isUppercase })}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeBox.isUppercase
                    ? 'border-amber-400/80 bg-amber-500/15 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                }`}
                title="ЗАГЛАВНЫЕ БУКВЫ"
              >
                АА
              </button>

              <button
                type="button"
                onClick={() => applyUpdate({ hasBackground: !activeBox.hasBackground })}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
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
        </div>
      )}
    </div>
  );
};
