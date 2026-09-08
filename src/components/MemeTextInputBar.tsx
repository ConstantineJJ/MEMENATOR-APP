import React from 'react';
import { TextBox } from '../types';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';

interface MemeTextInputBarProps {
  textBoxes: TextBox[];
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onUpdateTextBox: (id: string, updates: Partial<TextBox>) => void;
  onAddTextBox: () => void;
  onRemoveTextBox: (id: string) => void;
  onResetPositions: () => void;
}

export const MemeTextInputBar: React.FC<MemeTextInputBarProps> = ({
  textBoxes,
  selectedBoxId,
  onSelectBox,
  onUpdateTextBox,
  onAddTextBox,
  onRemoveTextBox,
  onResetPositions,
}) => {
  const topBox = textBoxes[0];
  const bottomBox = textBoxes[1];
  const extraBoxes = textBoxes.slice(2);
  const activeBox = textBoxes.find((b) => b.id === selectedBoxId) || textBoxes[0];

  return (
    <div className="w-full bg-neutral-900/95 border border-neutral-800/90 rounded-2xl p-2 sm:p-2.5 backdrop-blur shadow-md shrink-0 space-y-2">
      {/* Top row: Label & Quick Actions */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <span>✍️</span>
            <span>Текст мема</span>
          </span>
          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            (введите реплики или перетаскивайте на холсте)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAddTextBox}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-amber-400/50 transition cursor-pointer"
            title="Добавить дополнительную строку текста"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>+ Строка</span>
          </button>

          <button
            type="button"
            onClick={onResetPositions}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-800 transition cursor-pointer"
            title="Сбросить позиции текста по умолчанию (верх и низ)"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Сброс</span>
          </button>
        </div>
      </div>

      {/* Inputs in Horizontal Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* LINE 1: TOP TEXT */}
        {topBox && (
          <div
            onClick={() => onSelectBox(topBox.id)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
              activeBox?.id === topBox.id
                ? 'bg-neutral-950 border-amber-400/90 shadow-sm ring-1 ring-amber-400/40'
                : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 whitespace-nowrap">
                Верхний
              </span>
              {activeBox?.id === topBox.id && (
                <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase hidden sm:inline">
                  АКТИВЕН
                </span>
              )}
            </div>

            <div className="relative flex-1 flex items-center min-w-0">
              <input
                type="text"
                value={topBox.text}
                onFocus={() => onSelectBox(topBox.id)}
                onChange={(e) => onUpdateTextBox(topBox.id, { text: e.target.value })}
                placeholder="Верхний текст мема..."
                className="w-full bg-transparent border-none text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none pr-6 truncate"
              />
              {topBox.text && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTextBox(topBox.id, { text: '' });
                  }}
                  className="absolute right-0 text-neutral-500 hover:text-white text-xs cursor-pointer p-0.5"
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
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
              activeBox?.id === bottomBox.id
                ? 'bg-neutral-950 border-amber-400/90 shadow-sm ring-1 ring-amber-400/40'
                : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 whitespace-nowrap">
                Нижний
              </span>
              {activeBox?.id === bottomBox.id && (
                <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-neutral-950 uppercase hidden sm:inline">
                  АКТИВЕН
                </span>
              )}
            </div>

            <div className="relative flex-1 flex items-center min-w-0">
              <input
                type="text"
                value={bottomBox.text}
                onFocus={() => onSelectBox(bottomBox.id)}
                onChange={(e) => onUpdateTextBox(bottomBox.id, { text: e.target.value })}
                placeholder="Нижний текст мема..."
                className="w-full bg-transparent border-none text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none pr-6 truncate"
              />
              {bottomBox.text && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTextBox(bottomBox.id, { text: '' });
                  }}
                  className="absolute right-0 text-neutral-500 hover:text-white text-xs cursor-pointer p-0.5"
                  title="Очистить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Extra Lines if any */}
      {extraBoxes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-neutral-800/60">
          {extraBoxes.map((box, idx) => (
            <div
              key={box.id}
              onClick={() => onSelectBox(box.id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                activeBox?.id === box.id
                  ? 'bg-neutral-950 border-amber-400/90 shadow-sm ring-1 ring-amber-400/40'
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span className="text-[10px] font-bold text-neutral-400 shrink-0">
                #{idx + 3}
              </span>
              <input
                type="text"
                value={box.text}
                onFocus={() => onSelectBox(box.id)}
                onChange={(e) => onUpdateTextBox(box.id, { text: e.target.value })}
                placeholder="Дополнительный текст..."
                className="w-full bg-transparent border-none text-xs text-neutral-100 placeholder:text-neutral-500 font-semibold focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTextBox(box.id);
                }}
                className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer shrink-0"
                title="Удалить строку"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
