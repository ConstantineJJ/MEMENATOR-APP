import React, { useEffect } from 'react';
import { useUiPreferences, type UiLanguage } from './uiPreferences';

/**
 * Final compatibility cleanup for legacy JSX where React splits a visible
 * sentence into several text nodes around expressions (for example
 * `Вариант #{index + 1}`). The main localization layer intentionally works
 * with complete strings, so these fragments need a tiny second pass until the
 * remaining legacy components are migrated to tr().
 *
 * Keep this list narrow: user-authored meme/canvas text is never translated.
 */
const EXACT_PARTISAN_TRANSLATIONS: Record<string, string> = {
  // AI caption cards / modal
  'Вариант #': 'Variant #',
  'предложений': 'suggestions',
  'отобранных варианта от ИИ:': 'curated AI ideas:',
  '🎯 Механика:': '🎯 Mechanic:',
  '⚡ Противоречие:': '⚡ Contradiction:',
  '🔍 Деталь:': '🔍 Detail:',
  '🎭 Настроение:': '🎭 Mood:',

  // Composition safe-zone cards
  'Область': 'Area',
  'Верхняя область (Сетап)': 'Upper area (Setup)',
  'Нижняя область (Панчлайн)': 'Lower area (Punchline)',
  'Контраст:': 'Contrast:',
  'Отличный': 'Excellent',
  'Хороший': 'Good',
  'Рекомендуемый цвет:': 'Recommended color:',
  'обводка': 'stroke',
  'Направление взгляда:': 'Gaze direction:',
  'Вправо →': 'Right →',
  '← Влево': '← Left',
  'Прямо на зрителя 👁️': 'Directly at viewer 👁️',
  'Вверх ↑': 'Up ↑',
  'Вниз ↓': 'Down ↓',

  // Composition recommendations / footer
  'Общие рекомендации по композиции': 'General composition recommendations',
  'Рекомендации арт-директора по доработке': 'Art director recommendations',
  'Анализ еще не проведен или возникла задержка сети.':
    'Analysis has not run yet or the network is delayed.',
  'Запустить анализ': 'Run analysis',
  'Обновить анализ': 'Refresh analysis',
  'Автоматически выровнять текст': 'Auto-align text',
};

const originalText = new WeakMap<Text, string>();

function shouldIgnoreNode(node: Text) {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(
    parent.closest(
      'canvas, input, textarea, [contenteditable="true"], [data-no-i18n], script, style'
    )
  );
}

function translatePartisanText(value: string): string {
  const trimmed = value.trim();
  const exact = EXACT_PARTISAN_TRANSLATIONS[trimmed];
  if (exact) return value.replace(trimmed, exact);

  const variant = trimmed.match(/^Вариант #(\d+)$/i);
  if (variant) return value.replace(trimmed, `Variant #${variant[1]}`);

  const suggestions = trimmed.match(/^(\d+) предложени(?:е|я|й)$/i);
  if (suggestions) return value.replace(trimmed, `${suggestions[1]} suggestions`);

  const curated = trimmed.match(/^(\d+) отобранных варианта? от ИИ:$/i);
  if (curated) return value.replace(trimmed, `${curated[1]} curated AI ideas:`);

  const area = trimmed.match(/^Область\s+(.+)$/i);
  if (area) return value.replace(trimmed, `Area ${area[1]}`);

  return value;
}

function translateNode(node: Text, language: UiLanguage) {
  if (shouldIgnoreNode(node)) return;

  const current = node.nodeValue || '';
  let source = originalText.get(node);

  if (source === undefined) {
    source = current;
    originalText.set(node, source);
  } else {
    const knownEnglish = translatePartisanText(source);
    if (current !== source && current !== knownEnglish) {
      // React reused the text node for different content; remember the new
      // source instead of restoring stale text on the next language switch.
      source = current;
      originalText.set(node, source);
    }
  }

  const next = language === 'en' ? translatePartisanText(source) : source;
  if (current !== next) node.nodeValue = next;
}

function translateTree(root: ParentNode, language: UiLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateNode(node as Text, language);
    node = walker.nextNode();
  }
}

export const PartisanLocalizationCleanup: React.FC = () => {
  const { language } = useUiPreferences();

  useEffect(() => {
    translateTree(document.body, language);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          translateNode(mutation.target as Text, language);
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateNode(node as Text, language);
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
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
};
