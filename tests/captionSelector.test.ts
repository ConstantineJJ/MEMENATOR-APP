import assert from 'node:assert/strict';
import test from 'node:test';
import { captionSimilarity, selectBestCaptionSuggestions } from '../src/utils/captionSelector';
import { CaptionSuggestion } from '../src/types';

function caption(overrides: Partial<CaptionSuggestion>): CaptionSuggestion {
  return {
    headline: 'Тест',
    topText: 'ВЕРХНИЙ ТЕКСТ',
    bottomText: 'НИЖНИЙ ПАНЧЛАЙН',
    style: 'Тест',
    explanation: 'Шутка работает за счет детали в кадре.',
    humorMechanic: 'Наблюдение',
    imageConnection: 'Шутка прямо использует заметную деталь изображения.',
    spottedDetail: 'характерный взгляд',
    visualContradiction: 'серьезная поза в нелепой ситуации',
    ...overrides,
  };
}

test('captionSimilarity detects near-duplicate caption concepts', () => {
  const a = caption({ topText: 'КОГДА ПЕРЕМАТЫВАЕШЬ КАССЕТУ КАРАНДАШОМ', bottomText: 'ЭКОНОМИМ БАТАРЕЙКИ' });
  const b = caption({ topText: 'ПЕРЕМАТЫВАЮ КАССЕТУ КАРАНДАШОМ', bottomText: 'БАТАРЕЙКИ НАДО БЕРЕЧЬ' });
  const c = caption({ topText: 'СТОЮ У АВТОБУСА ПОД ДОЖДЕМ', bottomText: 'А ОН ПРОЕХАЛ МИМО' });

  assert.ok(captionSimilarity(a, b) > captionSimilarity(a, c));
});

test('selector returns at most three diverse candidates', () => {
  const input = [
    caption({ headline: 'Кассета 1', topText: 'ПЕРЕМАТЫВАЮ КАССЕТУ КАРАНДАШОМ', humorMechanic: 'Наблюдение' }),
    caption({ headline: 'Кассета 2', topText: 'СНОВА КАССЕТА И КАРАНДАШ', humorMechanic: 'Наблюдение' }),
    caption({ headline: 'Двор', topText: 'МЯЧ УЛЕТЕЛ ЗА ГАРАЖИ', bottomText: 'ЭКСПЕДИЦИЯ НАЧАЛАСЬ', humorMechanic: 'Контраст' }),
    caption({ headline: 'Телефон', topText: 'ДОМАШНИЙ ТЕЛЕФОН ЗАЗВОНИЛ', bottomText: 'ВСЯ СЕМЬЯ УЖЕ ЗНАЕТ НОВОСТИ', humorMechanic: 'Диалог' }),
    caption({ headline: 'Фото', topText: '24 КАДРА НА ПЛЕНКЕ', bottomText: 'НИ ОДНОГО ПРЕВЬЮ', humorMechanic: 'Абсурд' }),
  ];

  const selected = selectBestCaptionSuggestions(input, { limit: 3 });
  assert.equal(selected.length, 3);
  assert.equal(new Set(selected.map((item) => item.humorMechanic)).size, 3);
});

test('recent captions are penalized in favor of fresh concepts', () => {
  const recent = [caption({ topText: 'ПЕРЕМАТЫВАЮ КАССЕТУ КАРАНДАШОМ', bottomText: 'БЕРЕГУ БАТАРЕЙКИ' })];
  const repetitive = caption({ headline: 'Кассета снова', topText: 'КАССЕТА И КАРАНДАШ СНОВА В ДЕЛЕ', bottomText: 'БАТАРЕЙКИ ЦЕЛЫ' });
  const fresh = caption({ headline: 'Дискета', topText: 'СОХРАНИЛ ФАЙЛ НА ДИСКЕТУ', bottomText: '1.44 МБ КАЗАЛИСЬ БЕСКОНЕЧНОСТЬЮ', humorMechanic: 'Контраст' });

  const selected = selectBestCaptionSuggestions([repetitive, fresh], {
    limit: 1,
    recentCaptions: recent,
  });

  assert.equal(selected[0].headline, 'Дискета');
});
