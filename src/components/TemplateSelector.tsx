import React, { useState } from 'react';
import { MemeTemplate } from '../types';
import { TRENDING_TEMPLATES } from '../data/templates';
import { Search, Image as ImageIcon } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelectTemplate: (template: MemeTemplate) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Все шаблоны' },
  { id: 'trending', label: '🔥 Тренды' },
  { id: 'classic', label: '👑 Классика' },
  { id: 'reactions', label: '😮 Реакции' },
  { id: 'animals', label: '🐕 Животные' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = TRENDING_TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      t.name.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-3 sm:p-3.5 backdrop-blur space-y-2.5 shadow-lg w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Каталог шаблонов</span>
              <span className="text-[10px] text-neutral-500">({TRENDING_TEMPLATES.length})</span>
            </h3>
          </div>
        </div>
        <span className="text-[10px] text-amber-400 font-medium">Классика</span>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск (дрейк, кот, доге, гигачад)..."
            className="w-full bg-neutral-950/70 border border-neutral-800 rounded-xl pl-7 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/80 transition"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-950/70 text-neutral-400 hover:text-neutral-200 border border-neutral-800/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-44 sm:max-h-52 overflow-y-auto pr-0.5">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`group relative flex flex-col aspect-square rounded-xl overflow-hidden border transition-all text-left cursor-pointer focus:outline-none ${
                isSelected
                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-95'
                  : 'border-neutral-800/90 hover:border-amber-400/60 hover:shadow-md'
              }`}
              title={template.name}
            >
              <img
                src={template.url}
                alt={template.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent p-1 pt-3">
                <span className="text-[9px] font-bold text-white line-clamp-1 leading-tight drop-shadow-sm">
                  {template.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
