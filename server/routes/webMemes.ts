import type { Express } from 'express';
import { getAggregatedWebMemes } from '../memeAggregator';

const CURATED_TEMPLATES = [
  {
    id: 'web-drake',
    name: 'Дрейк одобряет',
    url: 'https://i.imgflip.com/30b1gx.jpg',
    trendReason: 'Классический формат сравнения плохого и хорошего',
    source: 'Imgflip',
    defaultTopText: 'ТО, ЧТО НАДО СДЕЛАТЬ СЕЙЧАС',
    defaultBottomText: 'ТО, ЧТО Я ДЕЛАЮ ВЕСЬ ДЕНЬ',
    tags: ['сравнение', 'классика', 'выбор'],
  },
  {
    id: 'web-distracted',
    name: 'Неверный парень',
    url: 'https://i.imgflip.com/1ur9b0.jpg',
    trendReason: 'Выбор нового вместо важного',
    source: 'Imgflip',
    defaultTopText: 'НОВОЕ ХОББИ НА ДВА ДНЯ',
    defaultBottomText: 'МОИ ВАЖНЫЕ ДЕЛА',
    tags: ['выбор', 'соблазн'],
  },
  {
    id: 'web-two-buttons',
    name: 'Две кнопки',
    url: 'https://i.imgflip.com/1g8my4.jpg',
    trendReason: 'Мучительная дилемма',
    source: 'Imgflip',
    defaultTopText: 'ЛОГИЧНЫЙ ВАРИАНТ',
    defaultBottomText: 'ТО, ЧТО Я ВЫБЕРУ',
    tags: ['кнопки', 'выбор', 'паника'],
  },
  {
    id: 'web-woman-cat',
    name: 'Женщина кричит на кота',
    url: 'https://i.imgflip.com/345v97.jpg',
    trendReason: 'Конфликт и взаимное непонимание',
    source: 'Imgflip',
    defaultTopText: 'ТЫ ЖЕ ОБЕЩАЛ!',
    defaultBottomText: 'Я: НЕ ПОМНЮ ТАКОГО',
    tags: ['кот', 'крик', 'спор'],
  },
  {
    id: 'web-harold',
    name: 'Гарольд, скрывающий боль',
    url: 'https://i.imgflip.com/gk5el.jpg',
    trendReason: 'Улыбка сквозь стресс',
    source: 'Imgflip',
    defaultTopText: 'ДА, КОНЕЧНО, ВСЕ ХОРОШО',
    defaultBottomText: 'АБСОЛЮТНО ВСЕ ХОРОШО',
    tags: ['улыбка', 'боль', 'стресс'],
  },
  {
    id: 'web-pikachu',
    name: 'Шокированный Пикачу',
    url: 'https://i.imgflip.com/26jxvz.jpg',
    trendReason: 'Шок от предсказуемого результата',
    source: 'Imgflip',
    defaultTopText: 'ДЕЛАЮ ОЧЕВИДНО СОМНИТЕЛЬНУЮ ВЕЩЬ',
    defaultBottomText: 'КОГДА ОНА ДАЕТ ОЧЕВИДНЫЙ РЕЗУЛЬТАТ:',
    tags: ['шок', 'удивление'],
  },
];

function readStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

export function registerWebMemeRoutes(app: Express) {
  app.get('/api/feed/web-memes', async (req, res) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
      const limit = Math.max(1, Math.min(24, Number.parseInt(String(req.query.limit || '3'), 10) || 3));
      const feed = await getAggregatedWebMemes({
        query,
        limit,
        excludeIds: readStringArray(req.query.excludeIds),
        excludeHashes: readStringArray(req.query.excludeHashes),
      });
      return res.json(feed);
    } catch (error) {
      console.warn('Web meme aggregator error:', error);
      return res.json({
        items: [],
        totalPoolSize: 0,
        sourcesUsed: [],
        isFallback: true,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Compatibility endpoint for older clients. New UI uses /api/feed/web-memes.
  app.get('/api/templates/trending-feed', async (req, res) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
      const limit = Math.max(1, Math.min(12, Number.parseInt(String(req.query.limit || '3'), 10) || 3));
      const feed = await getAggregatedWebMemes({ query, limit });
      const templates = feed.items.map((item) => ({
        id: item.id,
        name: item.title,
        url: item.imageUrl,
        trendReason:
          item.provider === 'reddit'
            ? 'Свежий пост из Reddit'
            : item.provider === 'imgflip'
              ? 'Популярный шаблон Imgflip'
              : 'Интернет-мем',
        source: item.provider.toUpperCase(),
        defaultTopText: item.defaultTopText || '',
        defaultBottomText: item.defaultBottomText || '',
        tags: item.tags || ['мем'],
      }));

      return res.json({
        templates,
        totalAvailable: feed.totalPoolSize,
        timestamp: feed.timestamp,
        sourcesUsed: feed.sourcesUsed,
      });
    } catch {
      return res.json({
        templates: CURATED_TEMPLATES.slice(0, 3),
        totalAvailable: CURATED_TEMPLATES.length,
        timestamp: new Date().toISOString(),
        sourcesUsed: ['curated'],
      });
    }
  });
}
