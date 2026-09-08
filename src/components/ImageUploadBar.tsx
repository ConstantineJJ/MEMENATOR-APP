import React, { useCallback, useRef, useState } from 'react';
import { Upload, RefreshCw, LoaderCircle } from 'lucide-react';
import { normalizeImageFileForWorkingCanvas } from '../utils/imageHelper';

interface ImageUploadBarProps {
  onUploadImage: (file: File) => void;
  isCustomUploaded: boolean;
  onResetOriginal?: () => void;
}

export const ImageUploadBar: React.FC<ImageUploadBarProps> = ({
  onUploadImage,
  isCustomUploaded,
  onResetOriginal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const submitImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') || isPreparing) return;
    setIsPreparing(true);
    try {
      const normalizedFile = await normalizeImageFileForWorkingCanvas(file);
      onUploadImage(normalizedFile);
    } finally {
      setIsPreparing(false);
    }
  }, [isPreparing, onUploadImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isPreparing) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void submitImage(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void submitImage(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-busy={isPreparing}
      className={`w-full rounded-2xl border transition-all px-3 py-1.5 backdrop-blur flex items-center justify-between gap-2.5 ${
        isDragging
          ? 'border-amber-400 bg-amber-500/20 shadow-lg'
          : 'border-dashed border-neutral-800 bg-neutral-900/80 hover:border-neutral-700'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
          {isPreparing ? (
            <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="text-left min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            <span>Загрузить свое фото</span>
            {isCustomUploaded && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium whitespace-nowrap">
                Активно
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isCustomUploaded && onResetOriginal && (
          <button
            onClick={onResetOriginal}
            disabled={isPreparing}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            title="Сбросить к исходному шаблону"
          >
            <RefreshCw className="w-3 h-3 text-neutral-400" />
            <span className="hidden sm:inline">Сбросить</span>
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isPreparing}
          className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-neutral-950 transition active:scale-95 shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
          title={isPreparing ? 'Preparing image for editing' : undefined}
        >
          {isPreparing ? (
            <LoaderCircle className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          <span>Выбрать файл</span>
        </button>
      </div>
    </div>
  );
};
