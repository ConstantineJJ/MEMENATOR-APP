import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Languages, Moon, Sun } from 'lucide-react';

export type UiLanguage = 'ru' | 'en';
export type UiTheme = 'dark' | 'light';

interface UiPreferencesValue {
  language: UiLanguage;
  theme: UiTheme;
  setLanguage: (language: UiLanguage) => void;
  setTheme: (theme: UiTheme) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  tr: (ru: string, en: string) => string;
}

const LANGUAGE_KEY = 'memenator:language';
const THEME_KEY = 'memenator:theme';

const UiPreferencesContext = createContext<UiPreferencesValue | null>(null);

const EXACT_TRANSLATIONS: Record<string, string> = {
  'Автосохранение активно': 'Autosave active',
  'Холст в центре • ИИ справа': 'Canvas centered • AI on the right',
  'СЛУЧАЙНЫЕ МЕМЫ': 'RANDOM MEMES',
  'Случайные мемы': 'Random memes',
  'Случайные': 'Random',
  'История': 'History',
  'Избранное': 'Favorites',
  'Фильтры': 'Filters',
  'Наклейки': 'Stickers',
  'Водяной знак': 'Watermark',
  'Очистить все': 'Clear all',
  'Загрузить свое фото': 'Upload your photo',
  'Выбрать файл': 'Choose file',
  'Сбросить': 'Reset',
  'ТЕКСТ МЕМА': 'MEME TEXT',
  'ВЕРХНИЙ': 'TOP',
  'НИЖНИЙ': 'BOTTOM',
  'АКТИВЕН': 'ACTIVE',
  'Активен': 'Active',
  '+ Строка': '+ Line',
  'Композиция': 'Composition',
  'Сетка': 'Grid',
  'Трети': 'Thirds',
  'Спираль': 'Spiral',
  'Объекты': 'Subjects',
  'Зоны': 'Zones',
  'Копировать': 'Copy',
  'Скопировано!': 'Copied!',
  'Скачать': 'Download',
  'Черновик сохранен': 'Draft saved',
  'СТИЛЬ:': 'STYLE:',
  'Стиль:': 'Style:',
  'Шрифт:': 'Font:',
  'Кегль:': 'Size:',
  'Цвет:': 'Color:',
  'ОБВОДКА:': 'STROKE:',
  'Обводка:': 'Stroke:',
  'Внешняя': 'Outer',
  'Внутренняя': 'Inner',
  'Выкл': 'Off',
  'Тень: ВКЛ': 'Shadow: ON',
  'Плашка': 'Plate',
  'ЗАМЕНИТЬ С ИИ': 'REPLACE WITH AI',
  'СТИЛЬ ЮМОРА:': 'HUMOR STYLE:',
  'Еще 5 вариантов': '5 more variants',
  'Клик для применения': 'Click to apply',
  'Выбрать': 'Choose',
  'ВЕРХ:': 'TOP:',
  'НИЗ:': 'BOTTOM:',
  'Механика': 'Mechanic',
  'Наблюдение': 'Observation',
  'Контраст': 'Contrast',
  'Сарказм': 'Sarcasm',
  'Тренды': 'Trends',
  'Подкол / Прожарка': 'Roast',
  'Жиза / Бытовуха': 'Relatable',
  'Work (Офис/IT)': 'Work (Office/IT)',
  'Миллениалы': 'Millennials',
  'Зумеры': 'Gen Z',
  'Добро и милота': 'Wholesome',
  'Ночные мысли': 'Late-night thoughts',
  'Гейминг': 'Gaming',
  'Отношения': 'Relationships',
  'Кино': 'Cinema',
  'Оригинал': 'Original',
  'Винтаж': 'Vintage',
  'Теплый': 'Warm',
  'Драма': 'Drama',
  'Виньетка': 'Vignette',
  'На холсте:': 'On canvas:',
  'Найти': 'Search',
  'Открыть': 'Open',
  'Удалить': 'Delete',
  'Добавить в избранное': 'Add to favorites',
  'Удалить из избранного': 'Remove from favorites',
  'Применить обрезку': 'Apply crop',
  'Отмена': 'Cancel',
  'Обрезка и зум фрагмента': 'Crop and zoom',
  'Пропорции:': 'Aspect ratio:',
  'Свободно': 'Free',
  'Зум детали:': 'Detail zoom:',
  'Вернуть исходное фото': 'Restore original photo',
  'Правило третей (3×3)': 'Rule of thirds (3×3)',
  'Ключевые фокусные фигуры': 'Key focal subjects',
  'Безопасные зоны для текста': 'Safe text zones',
};

const ATTRIBUTE_TRANSLATIONS: Record<string, string> = {
  'Поиск мемов по названию...': 'Search memes by title...',
  'Поиск по Reddit, Imgflip, Meme_Api...': 'Search Reddit, Imgflip, Meme_Api...',
  'Введите реплики или перетаскивайте на холсте': 'Enter captions or drag them on the canvas',
  'Укажите тему (например, “понедельник”, “сессия”, “дедлайн”)...': 'Specify a topic (for example, “Monday”, “exam”, “deadline”)...',
  'Обрезать или увеличить фрагмент': 'Crop or zoom into a detail',
  'Интеллектуальный анализ композиции и безопасных зон': 'Smart composition and safe-zone analysis',
  'Скачать готовый мем в высоком качестве': 'Download the finished meme in high quality',
  'Скопировать картинку в буфер обмена': 'Copy the image to clipboard',
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

const translateDynamicText = (value: string): string => {
  const trimmed = value.trim();
  const exact = EXACT_TRANSLATIONS[trimmed];
  if (exact) return value.replace(trimmed, exact);

  const variant = trimmed.match(/^ВАРИАНТ #(\d+)$/i);
  if (variant) return value.replace(trimmed, `VARIANT #${variant[1]}`);

  const suggestions = trimmed.match(/^(\d+) предложени(?:е|я|й)$/i);
  if (suggestions) return value.replace(trimmed, `${suggestions[1]} suggestions`);

  return value;
};

const shouldIgnoreNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('canvas, input, textarea, [contenteditable="true"], [data-no-i18n], script, style'));
};

const resolveTextSource = (node: Text) => {
  const current = node.nodeValue || '';
  const saved = originalText.get(node);
  if (saved === undefined) {
    originalText.set(node, current);
    return current;
  }

  const savedTranslation = translateDynamicText(saved);
  if (current !== saved && current !== savedTranslation) {
    originalText.set(node, current);
    return current;
  }

  return saved;
};

const translateTextNode = (node: Text, language: UiLanguage) => {
  if (shouldIgnoreNode(node)) return;
  const source = resolveTextSource(node);
  const next = language === 'en' ? translateDynamicText(source) : source;
  if (node.nodeValue !== next) node.nodeValue = next;
};

const translateElementAttributes = (element: Element, language: UiLanguage) => {
  if (element.closest('[data-no-i18n]')) return;
  const attrs = ['placeholder', 'title', 'aria-label'] as const;
  let originals = originalAttributes.get(element);

  for (const attr of attrs) {
    const current = element.getAttribute(attr);
    if (!current) continue;

    if (!originals) {
      originals = new Map<string, string>();
      originalAttributes.set(element, originals);
    }

    const saved = originals.get(attr);
    if (saved === undefined) {
      originals.set(attr, current);
    } else {
      const savedTranslation = ATTRIBUTE_TRANSLATIONS[saved] || EXACT_TRANSLATIONS[saved] || saved;
      if (current !== saved && current !== savedTranslation) originals.set(attr, current);
    }

    const source = originals.get(attr) || current;
    const translated = language === 'en' ? ATTRIBUTE_TRANSLATIONS[source] || EXACT_TRANSLATIONS[source] || source : source;
    if (current !== translated) element.setAttribute(attr, translated);
  }
};

const translateTree = (root: ParentNode, language: UiLanguage) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node as Text, language);
    node = walker.nextNode();
  }

  if (root instanceof Element) translateElementAttributes(root, language);
  root.querySelectorAll?.('*').forEach((element) => translateElementAttributes(element, language));
};

export const UiPreferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguage] = useState<UiLanguage>(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === 'en' ? 'en' : 'ru';
  });
  const [theme, setTheme] = useState<UiTheme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;

    translateTree(document.body, language);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateTextNode(mutation.target as Text, language);
          continue;
        }

        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          translateElementAttributes(mutation.target, language);
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text, language);
          } else if (node instanceof Element) {
            translateTree(node, language);
          }
        });
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo<UiPreferencesValue>(() => ({
    language,
    theme,
    setLanguage,
    setTheme,
    toggleLanguage: () => setLanguage((prev) => (prev === 'ru' ? 'en' : 'ru')),
    toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    tr: (ru, en) => (language === 'ru' ? ru : en),
  }), [language, theme]);

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
};

export const useUiPreferences = () => {
  const context = useContext(UiPreferencesContext);
  if (!context) throw new Error('useUiPreferences must be used inside UiPreferencesProvider');
  return context;
};

export const GlobalPreferenceControls: React.FC = () => {
  const { language, theme, toggleLanguage, toggleTheme, tr } = useUiPreferences();

  return (
    <div
      data-no-i18n
      className="fixed top-2.5 right-3 sm:right-5 z-[60] flex items-center gap-1.5 rounded-xl border border-neutral-800/80 bg-neutral-900/85 p-1 shadow-xl backdrop-blur-md"
    >
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-neutral-200 transition hover:bg-neutral-800 hover:text-white active:scale-95"
        title={tr('Переключить язык на English', 'Switch language to Russian')}
        aria-label={tr('Переключить язык', 'Switch language')}
      >
        <Languages className="h-3.5 w-3.5 text-emerald-400" />
        <span>{language === 'ru' ? 'Русский' : 'English'}</span>
      </button>

      <div className="h-5 w-px bg-neutral-700/80" />

      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-neutral-200 transition hover:bg-neutral-800 hover:text-white active:scale-95"
        title={tr('Переключить тему', 'Switch theme')}
        aria-label={tr('Переключить тему', 'Switch theme')}
      >
        {theme === 'dark' ? (
          <Moon className="h-3.5 w-3.5 text-cyan-300" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span>{theme === 'dark' ? tr('Тёмная', 'Dark') : tr('Светлая', 'Light')}</span>
      </button>
    </div>
  );
};
