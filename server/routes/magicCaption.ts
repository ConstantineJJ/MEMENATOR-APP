import { Type } from '@google/genai';
import type { Express } from 'express';
import { callWithRetry, getGeminiClient } from '../gemini';
import {
  buildMagicCaptionPrompt,
  getHumorProfile,
  type CompositionPromptContext,
  type RecentCaptionIdea,
} from '../humorPrompts';

interface CaptionResult {
  headline: string;
  topText: string;
  bottomText: string;
  style: string;
  humorMechanic: string;
  imageConnection: string;
  explanation: string;
  visualContradiction: string;
  spottedDetail: string;
  detectedMood: string;
}

type FallbackSeed = [headline: string, topText: string, bottomText: string];

const FALLBACKS: Record<string, FallbackSeed[]> = {
  trending: [
    ['Секунда до решения', 'КОГДА УЖЕ ПОНЯЛ, ЧТО ИДЕЯ БЫЛА СОМНИТЕЛЬНОЙ', 'НО ОТСТУПАТЬ ПОЗДНО — ВСЕ СМОТРЯТ'],
    ['План был хороший', 'В ТЕОРИИ ЭТО ВЫГЛЯДЕЛО ОЧЕНЬ УБЕДИТЕЛЬНО', 'ПРАКТИКА ПРИШЛА БЕЗ ПРЕДУПРЕЖДЕНИЯ'],
    ['Главный свидетель', 'КОГДА ДЕЛАЕШЬ ВИД, ЧТО ВСЕ ПОД КОНТРОЛЕМ', 'А ЛИЦО УЖЕ ДАЛО ПОКАЗАНИЯ'],
  ],
  roast: [
    ['Пафос отменяется', 'КОГДА ВОШЕЛ В КАДР КАК ФИНАЛЬНЫЙ БОСС', 'А ПОЗА ВЫДАЛА ПОБОЧНЫЙ КВЕСТ'],
    ['Уверенность 4K', 'ВЗГЛЯД ГОВОРИТ: Я ТОЧНО ЗНАЮ, ЧТО ДЕЛАЮ', 'ОСТАЛЬНОЙ КАДР КАТЕГОРИЧЕСКИ НЕ СОГЛАСЕН'],
    ['Ни капли сомнений', 'ТАК ВЫГЛЯДИТ ЧЕЛОВЕК ЗА СЕКУНДУ ДО ГЕНИАЛЬНОГО РЕШЕНИЯ', 'И ЗА ДВЕ — ДО ОБЪЯСНИТЕЛЬНОЙ'],
  ],
  relatable: [
    ['Бытовой квест', 'КОГДА ПРИШЕЛ СДЕЛАТЬ ОДНУ ПРОСТУЮ ВЕЩЬ', 'И ВНЕЗАПНО У НЕЕ ОКАЗАЛОСЬ ПЯТЬ ПОДЗАДАЧ'],
    ['Неловкая пауза', 'КОГДА УЖЕ НАЧАЛ УВЕРЕННО ДЕЙСТВОВАТЬ', 'А ПОТОМ ПОНЯЛ, ЧТО НЕ ТУДА'],
    ['Экономия сил', 'Я: СЕЙЧАС БЫСТРО РАЗБЕРУСЬ', 'ТАКЖЕ Я ЧЕРЕЗ СОРОК МИНУТ:'],
  ],
  work: [
    ['По инструкции', 'КОГДА РЕГЛАМЕНТ ГОВОРИТ ДЕЛАТЬ ИМЕННО ТАК', 'А ЗДРАВЫЙ СМЫСЛ ТИХО ВЫШЕЛ ИЗ СМЕНЫ'],
    ['Мастер на месте', 'КЛИЕНТ: ТАМ НА ПЯТЬ МИНУТ РАБОТЫ', 'МАСТЕР, КОТОРЫЙ УЖЕ УВИДЕЛ ПРИЧИНУ:'],
    ['Контроль качества', 'КОГДА ПРОВЕРЯЕШЬ РАБОТУ ПОСЛЕ ФРАЗЫ И ТАК СОЙДЕТ', 'И ПОНИМАЕШЬ, ЧТО НЕ СОШЛО'],
  ],
  millennials: [
    ['Пленка на 24 кадра', 'КОГДА ФОТО УЖЕ СДЕЛАНО, НО ПРОВЕРИТЬ НЕЛЬЗЯ', 'УЗНАЕШЬ ЧЕРЕЗ НЕДЕЛЮ, БЫЛ ЛИ У ТЕБЯ ПАЛЕЦ НА ОБЪЕКТИВЕ'],
    ['Ночной интернет', 'КОГДА КАРТИНКА ЗАГРУЗИЛАСЬ УЖЕ НАПОЛОВИНУ', 'И КТО-ТО В ДОМЕ СНЯЛ ТРУБКУ ТЕЛЕФОНА'],
    ['Компьютерный клуб', 'МЫ ЗАШЛИ НА ЧАС ПОСЛЕ ШКОЛЫ', 'ВЫШЛИ, КОГДА УЛИЦА УЖЕ СМЕНИЛА ВРЕМЯ ГОДА'],
  ],
  genz: [
    ['POV без бюджета', 'POV: ТЫ УВЕРЕННО ЗАШЕЛ В СИТУАЦИЮ', 'СЮЖЕТ УЖЕ ПЕРЕПИСЫВАЕТ ТЕБЯ КАК ВТОРОСТЕПЕННОГО'],
    ['Вайб проверен', 'КОГДА КАРТИНКА ГОВОРИТ ВСЕ РАНЬШЕ ТЕБЯ', 'КОММЕНТАРИИ МОЖНО ЗАКРЫВАТЬ'],
    ['Арка персонажа', 'Я ДУМАЛ, ЭТО БУДЕТ МОМЕНТ РОСТА', 'ОКАЗАЛОСЬ — ДЕМОНСТРАЦИОННЫЙ МАТЕРИАЛ'],
  ],
  sarcastic: [
    ['Безупречно', 'ДА, ИМЕННО ТАК ВСЕ И БЫЛО ЗАДУМАНО', 'ОСОБЕННО ВОТ ЭТА ЧАСТЬ КАТАСТРОФЫ'],
    ['Потрясающий расчет', 'РЕШЕНИЕ ПРИНЯТО С ХОЛОДНОЙ ГОЛОВОЙ', 'ГОЛОВА ПРОСТО НЕ БЫЛА В КУРСЕ'],
    ['Спокойствие', 'НИЧЕГО НЕОБЫЧНОГО НЕ ПРОИСХОДИТ', 'ПРОДОЛЖАЕМ ИГНОРИРОВАТЬ ОЧЕВИДНОЕ'],
  ],
  wholesome: [
    ['Серьезная миссия', 'КОГДА ОЧЕНЬ СТАРАЕШЬСЯ ВЫГЛЯДЕТЬ ПРОФЕССИОНАЛЬНО', 'А ПОЛУЧАЕТСЯ ПРОСТО ОЧЕНЬ МИЛО'],
    ['Маленькая победа', 'СЕГОДНЯ МЫ СДЕЛАЛИ ХОТЬ ОДНУ ВЕЩЬ НОРМАЛЬНО', 'И ЭТО УЖЕ ДОСТОЙНО ТОРЖЕСТВЕННОГО ВЗГЛЯДА'],
    ['Команда поддержки', 'КОГДА ДРУГ ЯВНО НЕ ЗНАЕТ, ЧТО ДЕЛАЕТ', 'НО ТЫ ВСЕ РАВНО СТОИШЬ РЯДОМ С ВИДОМ ЭКСПЕРТА'],
  ],
  philosophy: [
    ['Форма и содержание', 'ЕСЛИ ВЫГЛЯДЕТЬ УВЕРЕННО ДОСТАТОЧНО ДОЛГО', 'СТАНЕТ ЛИ РЕШЕНИЕ ПРАВИЛЬНЫМ?'],
    ['Время наблюдателя', 'ОДНА СЕКУНДА ДО СОБЫТИЯ', 'МОЖЕТ ДЛИТЬСЯ ДОЛЬШЕ ВСЕГО ПРЕДЫДУЩЕГО ДНЯ'],
    ['Свобода выбора', 'МЫ СВОБОДНЫ ВЫБИРАТЬ СВОЙ ПУТЬ', 'НО КАДР УЖЕ ЗНАЕТ, ЧЕМ ЭТО ЗАКОНЧИТСЯ'],
  ],
  gaming: [
    ['Проверка хитбокса', 'КОГДА РЕШИЛ ПРОЙТИ ЭТОТ УЧАСТОК БЕЗ ГАЙДА', 'ФИЗИКА ИГРЫ РЕШИЛА ПРОВЕСТИ СОБЕСЕДОВАНИЕ'],
    ['Инвентарь полон', 'НАШЕЛ РОВНО ТО, ЧТО НУЖНО ДЛЯ КВЕСТА', 'МЕСТА НЕТ, ПОТОМУ ЧТО Я НОШУ 47 БЕСПОЛЕЗНЫХ ПРЕДМЕТОВ'],
    ['Диалоговая опция', 'ИГРА ПРЕДЛАГАЕТ: ОТВЕТИТЬ СПОКОЙНО', 'МОЕ ЛИЦО УЖЕ ВЫБРАЛО СКРЫТУЮ ЧЕТВЕРТУЮ РЕПЛИКУ'],
  ],
  dating: [
    ['Считывание сигнала', 'КОГДА ЧЕЛОВЕК СКАЗАЛ ВСЕ НОРМАЛЬНО', 'НО ПОЗА УЖЕ ОТПРАВИЛА ТЕБЕ ПОЛНУЮ ВЕРСИЮ СООБЩЕНИЯ'],
    ['Компромисс', 'МЫ РЕШИЛИ ВЫБРАТЬ ВМЕСТЕ', 'ТЕПЕРЬ ОБА ЗАЩИЩАЕМ ВАРИАНТ, КОТОРЫЙ НЕ ХОЧЕТ НИКТО'],
    ['Общий быт', 'РОМАНТИКА — ЭТО КОГДА ВЫ ПОНИМАЕТЕ ДРУГ ДРУГА БЕЗ СЛОВ', 'ОСОБЕННО КТО СЕГОДНЯ ИДЕТ РАЗБИРАТЬСЯ С ЭТИМ'],
  ],
  cinema: [
    ['Неудачный дубль', 'РЕЖИССЕР: НУЖНА ЕСТЕСТВЕННАЯ РЕАКЦИЯ', 'ЖИЗНЬ: С ПЕРВОГО ДУБЛЯ, БЕЗ РЕПЕТИЦИИ'],
    ['Бюджетный эпик', 'СЦЕНА ПОСТАВЛЕНА КАК ФИНАЛ БЛОКБАСТЕРА', 'БЮДЖЕТ ВСЕ ЕЩЕ ИЗ КАРМАННЫХ РАСХОДОВ'],
    ['Статист украл сцену', 'ГЛАВНЫЙ ГЕРОЙ СТАРАТЕЛЬНО ИГРАЕТ ДРАМУ', 'ОДНА ДЕТАЛЬ НА ЗАДНЕМ ПЛАНЕ: МОЙ ФИЛЬМ ТЕПЕРЬ'],
  ],
  absurd: [
    ['Служебная записка', 'ПРЕДМЕТЫ В КАДРЕ ПРОВЕЛИ СОБРАНИЕ', 'И РЕШИЛИ, ЧТО ЧЕЛОВЕК СЕГОДНЯ ЛИШНИЙ'],
    ['Научный результат', 'ЭКСПЕРИМЕНТ ДОКАЗАЛ, ЧТО ЛОГИКА СУЩЕСТВУЕТ', 'НО В ЭТОЙ ЗОНЕ ОНА НЕ ЛОВИТ СЕТЬ'],
    ['Неверная классификация', 'УЧЕНЫЕ ДОЛГО СПОРИЛИ, ЧТО ПРОИСХОДИТ НА ФОТО', 'ПОТОМ ЗАПИСАЛИ ЭТО КАК ПОГОДНОЕ ЯВЛЕНИЕ'],
  ],
};

function fallbackMechanic(index: number): string {
  switch (index % 3) {
    case 1:
      return 'Контраст';
    case 2:
      return 'Неожиданная интерпретация';
    default:
      return 'Наблюдение';
  }
}

function normalizeCaption(value: unknown, styleId: string, index: number): CaptionResult | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const topText = typeof raw.topText === 'string' ? raw.topText.trim() : '';
  const bottomText = typeof raw.bottomText === 'string' ? raw.bottomText.trim() : '';
  if (!topText && !bottomText) return null;

  const profile = getHumorProfile(styleId);
  return {
    headline: typeof raw.headline === 'string' && raw.headline.trim() ? raw.headline.trim() : `Вариант ${index + 1}`,
    topText,
    bottomText,
    style: typeof raw.style === 'string' && raw.style.trim() ? raw.style.trim() : profile.nameRu,
    humorMechanic: typeof raw.humorMechanic === 'string' && raw.humorMechanic.trim() ? raw.humorMechanic.trim() : fallbackMechanic(index),
    imageConnection: typeof raw.imageConnection === 'string' ? raw.imageConnection.trim() : 'Шутка опирается на заметную деталь текущего изображения.',
    explanation: typeof raw.explanation === 'string' ? raw.explanation.trim() : 'Сетап и панчлайн сталкивают ожидание с визуальной реальностью кадра.',
    visualContradiction: typeof raw.visualContradiction === 'string' ? raw.visualContradiction.trim() : 'Серьезная подача контрастирует с комичностью ситуации.',
    spottedDetail: typeof raw.spottedDetail === 'string' ? raw.spottedDetail.trim() : 'Выразительная поза или деталь в центре внимания.',
    detectedMood: typeof raw.detectedMood === 'string' ? raw.detectedMood.trim() : 'Сдержанная комическая напряженность.',
  };
}

function buildFallbackCaptions(styleId: string, customContext = ''): CaptionResult[] {
  const profile = getHumorProfile(styleId);
  const seeds = FALLBACKS[styleId] ?? FALLBACKS.trending ?? [];
  const context = customContext.trim();

  return seeds.slice(0, 3).map(([headline, topText, bottomText], index) => ({
    headline: context && index === 0 ? `${headline}: ${context}` : headline,
    topText,
    bottomText,
    style: profile.nameRu,
    humorMechanic: fallbackMechanic(index),
    imageConnection: 'Локальный резервный вариант: после восстановления Gemini лучше перегенерировать подписи для точной привязки к фото.',
    explanation: 'Резервная подпись сохраняет работоспособность редактора при недоступности модели.',
    visualContradiction: 'Резервный режим не выполняет полноценный визуальный анализ.',
    spottedDetail: 'Точная визуальная деталь недоступна без модели.',
    detectedMood: 'Резервный режим.',
  }));
}

function finalizeCaptions(values: unknown[], styleId: string, customContext: string): CaptionResult[] {
  const normalized = values
    .map((value, index) => normalizeCaption(value, styleId, index))
    .filter((value): value is CaptionResult => Boolean(value));

  const unique: CaptionResult[] = [];
  const signatures = new Set<string>();
  for (const caption of normalized) {
    const signature = `${caption.topText}|${caption.bottomText}`.toLowerCase();
    if (signatures.has(signature)) continue;
    signatures.add(signature);
    unique.push(caption);
    if (unique.length === 3) break;
  }

  if (unique.length < 3) {
    for (const fallback of buildFallbackCaptions(styleId, customContext)) {
      const signature = `${fallback.topText}|${fallback.bottomText}`.toLowerCase();
      if (signatures.has(signature)) continue;
      signatures.add(signature);
      unique.push(fallback);
      if (unique.length === 3) break;
    }
  }

  return unique.slice(0, 3);
}

const captionSchema = {
  type: Type.ARRAY,
  description: 'Ровно три сильных, концептуально разных и визуально привязанных варианта мема.',
  minItems: 3,
  maxItems: 3,
  items: {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      topText: { type: Type.STRING },
      bottomText: { type: Type.STRING },
      style: { type: Type.STRING },
      humorMechanic: { type: Type.STRING },
      imageConnection: { type: Type.STRING },
      explanation: { type: Type.STRING },
      visualContradiction: { type: Type.STRING },
      spottedDetail: { type: Type.STRING },
      detectedMood: { type: Type.STRING },
    },
    required: [
      'headline',
      'topText',
      'bottomText',
      'style',
      'humorMechanic',
      'imageConnection',
      'explanation',
      'visualContradiction',
      'spottedDetail',
      'detectedMood',
    ],
  },
};

export function registerMagicCaptionRoute(app: Express) {
  app.post('/api/magic-caption', async (req, res) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      style = 'trending',
      customContext = '',
      compositionContext,
      recentCaptions = [],
    } = req.body || {};

    const safeStyle = typeof style === 'string' && style.trim() ? style.trim() : 'trending';
    const safeContext = typeof customContext === 'string' ? customContext.trim().slice(0, 300) : '';
    const safeRecent: RecentCaptionIdea[] = Array.isArray(recentCaptions)
      ? recentCaptions.slice(0, 9).filter((item) => item && typeof item === 'object')
      : [];

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    try {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const ai = getGeminiClient();
      const prompt = buildMagicCaptionPrompt({
        styleId: safeStyle,
        customContext: safeContext,
        compositionContext: compositionContext as CompositionPromptContext | undefined,
        recentCaptions: safeRecent,
      });

      const modelsToTry = [
        'gemini-3.1-pro-preview',
        'gemini-flash-latest',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ];

      for (const modelName of modelsToTry) {
        try {
          const response = await callWithRetry(
            () => ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  { text: prompt },
                ],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: captionSchema,
                temperature: 1.15,
              },
            }),
            1,
            700
          );

          if (!response?.text) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(response.text);
          } catch {
            const match = response.text.match(/\[[\s\S]*\]/);
            parsed = match ? JSON.parse(match[0]) : null;
          }

          if (Array.isArray(parsed) && parsed.length > 0) {
            return res.json({
              captions: finalizeCaptions(parsed, safeStyle, safeContext),
              modelUsed: modelName,
            });
          }
        } catch {
          // Try the next supported model.
        }
      }

      return res.json({
        captions: buildFallbackCaptions(safeStyle, safeContext),
        isFallback: true,
        notice: 'Gemini temporarily unavailable; loaded three local reserve captions.',
      });
    } catch {
      return res.json({
        captions: buildFallbackCaptions(safeStyle, safeContext),
        isFallback: true,
        notice: 'Gemini temporarily unavailable; loaded three local reserve captions.',
      });
    }
  });
}
