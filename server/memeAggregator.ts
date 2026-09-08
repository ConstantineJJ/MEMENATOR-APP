import { WebMemeItem, MemeProvider } from '../src/types';

interface ProviderCacheEntry {
  timestamp: number;
  items: WebMemeItem[];
}

// In-memory cache with 5-minute TTL to reduce upstream requests and speed up response times
const providerCache: Record<string, ProviderCacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000;

// Helper to normalize title for deduplication
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple deterministic hash for deduplication across different URLs pointing to same title/file
export function computeImageSignature(title: string, url: string): string {
  const normTitle = normalizeTitle(title);
  // Extract filename or last path component
  const cleanUrl = url.split('?')[0].toLowerCase();
  const filename = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
  return `${normTitle.substring(0, 30)}_${filename}`;
}

// Curated high-res viral meme templates pool for zero-failure fallback
const CURATED_MEME_TEMPLATES: WebMemeItem[] = [
  {
    id: 'curated-drake',
    provider: 'curated',
    sourceId: '30b1gx',
    title: 'Дрейк одобряет (Drake Hotline Bling)',
    imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
    thumbnailUrl: 'https://i.imgflip.com/30b1gx.jpg',
    sourcePage: 'https://imgflip.com/meme/Drake-Hotline-Bling',
    hash: 'drake_hotline_bling',
    tags: ['дрейк', 'сравнение', 'классика', 'выбор'],
    defaultTopText: 'ТО, ЧТО НАДО СДЕЛАТЬ СЕЙЧАС',
    defaultBottomText: 'ТО, ЧТО Я ДЕЛАЮ ВЕСЬ ДЕНЬ',
  },
  {
    id: 'curated-distracted',
    provider: 'curated',
    sourceId: '1ur9b0',
    title: 'Неверный парень (Distracted Boyfriend)',
    imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    thumbnailUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    sourcePage: 'https://imgflip.com/meme/Distracted-Boyfriend',
    hash: 'distracted_boyfriend',
    tags: ['парень', 'девушка', 'ревность', 'соблазн'],
    defaultTopText: 'НОВОЕ ХОББИ НА ДВА ДНЯ',
    defaultBottomText: 'МОИ ВАЖНЫЕ ДЕЛА И РАБОТА',
  },
  {
    id: 'curated-two-buttons',
    provider: 'curated',
    sourceId: '1g8my4',
    title: 'Две кнопки и дилемма',
    imageUrl: 'https://i.imgflip.com/1g8my4.jpg',
    thumbnailUrl: 'https://i.imgflip.com/1g8my4.jpg',
    sourcePage: 'https://imgflip.com/meme/Two-Buttons',
    hash: 'two_buttons_dilemma',
    tags: ['кнопки', 'выбор', 'пот', 'паника'],
    defaultTopText: 'ЛЕЧЬ СПАТЬ В 23:00',
    defaultBottomText: 'СМОТРЕТЬ РИЛСЫ ДО 4 УТРА',
  },
  {
    id: 'curated-woman-cat',
    provider: 'curated',
    sourceId: '345v97',
    title: 'Женщина кричит на кота за столом',
    imageUrl: 'https://i.imgflip.com/345v97.jpg',
    thumbnailUrl: 'https://i.imgflip.com/345v97.jpg',
    sourcePage: 'https://imgflip.com/meme/Woman-Yelling-At-Cat',
    hash: 'woman_yelling_at_cat',
    tags: ['кот', 'женщина', 'крик', 'скандал'],
    defaultTopText: 'ТЫ ОБЕЩАЛ БОЛЬШЕ НЕ ТРАТИТЬ ДЕНЬГИ!',
    defaultBottomText: 'Я И МОЯ НОВАЯ ПОКУПКА ЗА ПОЛЗАРПЛАТЫ',
  },
  {
    id: 'curated-gigachad',
    provider: 'curated',
    sourceId: '65x3zk',
    title: 'Гигачад (Gigachad)',
    imageUrl: 'https://i.imgflip.com/65x3zk.jpg',
    thumbnailUrl: 'https://i.imgflip.com/65x3zk.jpg',
    sourcePage: 'https://imgflip.com/meme/Gigachad',
    hash: 'gigachad_sigma',
    tags: ['гигачад', 'база', 'сигма', 'уверенность'],
    defaultTopText: 'ДА, Я СПЛЮ ПО 8 ЧАСОВ И ПЬЮ ВОДУ',
    defaultBottomText: 'КАК ТЫ УЗНАЛ?',
  },
  {
    id: 'curated-harold',
    provider: 'curated',
    sourceId: 'gk5el',
    title: 'Гарольд, скрывающий боль (Hide the Pain Harold)',
    imageUrl: 'https://i.imgflip.com/gk5el.jpg',
    thumbnailUrl: 'https://i.imgflip.com/gk5el.jpg',
    sourcePage: 'https://imgflip.com/meme/Hide-the-Pain-Harold',
    hash: 'hide_the_pain_harold',
    tags: ['гарольд', 'боль', 'улыбка', 'работа'],
    defaultTopText: 'КОГДА КЛИЕНТ ВНЕС 48-Ю ПРАВКУ',
    defaultBottomText: '«ДА, КОНЕЧНО, СЕЙЧАС ПЕРЕДЕЛАЕМ»',
  },
  {
    id: 'curated-panik-kalm',
    provider: 'curated',
    sourceId: '392xtq',
    title: 'Panik / Kalm / Panik',
    imageUrl: 'https://i.imgflip.com/392xtq.jpg',
    thumbnailUrl: 'https://i.imgflip.com/392xtq.jpg',
    sourcePage: 'https://imgflip.com/meme/Panik-Kalm-Panik',
    hash: 'panik_kalm_panik',
    tags: ['паника', 'меммен', 'успокоение'],
    defaultTopText: 'ДЕДЛАЙН ЧЕРЕЗ ЧАС',
    defaultBottomText: 'НО ЧАСЫ ПЕРЕВЕЛИ НАЗАД / А НЕТ, ВПЕРЕД',
  },
  {
    id: 'curated-exit-ramp',
    provider: 'curated',
    sourceId: '26am5w',
    title: 'Резкий съезд с трассы',
    imageUrl: 'https://i.imgflip.com/26am5w.jpg',
    thumbnailUrl: 'https://i.imgflip.com/26am5w.jpg',
    sourcePage: 'https://imgflip.com/meme/Left-Exit-12-Off-Ramp',
    hash: 'left_exit_off_ramp',
    tags: ['машина', 'дрифт', 'съезд', 'решение'],
    defaultTopText: 'ЛОГИЧНЫЙ ПУТЬ',
    defaultBottomText: 'МОЙ РЕЗКИЙ ПОВОРОТ В БЕЗУМИЕ',
  },
  {
    id: 'curated-buff-doge',
    provider: 'curated',
    sourceId: '261o3j',
    title: 'Качок Доге против Чимса',
    imageUrl: 'https://i.imgflip.com/261o3j.jpg',
    thumbnailUrl: 'https://i.imgflip.com/261o3j.jpg',
    sourcePage: 'https://imgflip.com/meme/Buff-Doge-vs-Cheems',
    hash: 'buff_doge_cheems',
    tags: ['доге', 'чимс', 'собаки', 'сравнение'],
    defaultTopText: 'Я В 2010: ГУЛЯЮ ВЕСЬ ДЕНЬ НА МОРОЗЕ',
    defaultBottomText: 'Я СЕЙЧАС: ПРОДУЛО ОТ ФОРТОЧКИ',
  },
  {
    id: 'curated-disaster-girl',
    provider: 'curated',
    sourceId: '1otk96',
    title: 'Девочка и горящий дом (Disaster Girl)',
    imageUrl: 'https://i.imgflip.com/1otk96.jpg',
    thumbnailUrl: 'https://i.imgflip.com/1otk96.jpg',
    sourcePage: 'https://imgflip.com/meme/Disaster-Girl',
    hash: 'disaster_girl_fire',
    tags: ['девочка', 'пожар', 'улыбка', 'хаос'],
    defaultTopText: 'ОТПРАВИЛ ПИСЬМО БЕЗ ВЛОЖЕНИЯ',
    defaultBottomText: 'И СРАЗУ ВЫКЛЮЧИЛ КОМПЬЮТЕР',
  },
  {
    id: 'curated-monkey-puppet',
    provider: 'curated',
    sourceId: '2fm6x0',
    title: 'Обезьянка отводит взгляд',
    imageUrl: 'https://i.imgflip.com/2fm6x0.jpg',
    thumbnailUrl: 'https://i.imgflip.com/2fm6x0.jpg',
    sourcePage: 'https://imgflip.com/meme/Monkey-Puppet',
    hash: 'monkey_puppet_look',
    tags: ['обезьяна', 'взгляд', 'неловкость', 'стыд'],
    defaultTopText: 'КТО СЪЕЛ ПОСЛЕДНИЙ КУСОК ПИЦЦЫ?',
    defaultBottomText: 'Я, КОТОРЫЙ ЕЩЕ ДОЖЕВЫВАЕТ:',
  },
  {
    id: 'curated-think-about-it',
    provider: 'curated',
    sourceId: '1h7in3',
    title: 'Палец у виска (Roll Safe)',
    imageUrl: 'https://i.imgflip.com/1h7in3.jpg',
    thumbnailUrl: 'https://i.imgflip.com/1h7in3.jpg',
    sourcePage: 'https://imgflip.com/meme/Roll-Safe-Think-About-It',
    hash: 'roll_safe_think',
    tags: ['мозг', 'лайфхак', 'палец', 'логика'],
    defaultTopText: 'ТЕБЯ НЕ СМОГУТ УВОЛИТЬ',
    defaultBottomText: 'ЕСЛИ ТЫ НЕ БУДЕШЬ УСТРАИВАТЬСЯ НА РАБОТУ',
  },
  {
    id: 'curated-change-mind',
    provider: 'curated',
    sourceId: '24y43o',
    title: 'Переубеди меня (Change My Mind)',
    imageUrl: 'https://i.imgflip.com/24y43o.jpg',
    thumbnailUrl: 'https://i.imgflip.com/24y43o.jpg',
    sourcePage: 'https://imgflip.com/meme/Change-My-Mind',
    hash: 'change_my_mind',
    tags: ['стол', 'кофе', 'дискуссия', 'мнение'],
    defaultTopText: 'ПЯТНИЦА ЛУЧШЕ СУББОТЫ',
    defaultBottomText: 'ПЕРЕУБЕДИ МЕНЯ',
  },
  {
    id: 'curated-anakin-padme',
    provider: 'curated',
    sourceId: '5c7lwq',
    title: 'Анакин и Падме («Ведь так?..»)',
    imageUrl: 'https://i.imgflip.com/5c7lwq.jpg',
    thumbnailUrl: 'https://i.imgflip.com/5c7lwq.jpg',
    sourcePage: 'https://imgflip.com/meme/Anakin-Padme-4-Panel',
    hash: 'anakin_padme_for_the_better',
    tags: ['анакин', 'падме', 'тревога', 'взгляд'],
    defaultTopText: 'МЫ ЖЕ ПРОСТО ПОШУТИЛИ, ДА?',
    defaultBottomText: 'ТЫ ЖЕ НЕ СДЕЛАЛ ЭТО НА САМОМ ДЕЛЕ?..',
  },
  {
    id: 'curated-trade-offer',
    provider: 'curated',
    sourceId: '3si4be',
    title: 'Выгодная сделка (Trade Offer)',
    imageUrl: 'https://i.imgflip.com/3si4be.jpg',
    thumbnailUrl: 'https://i.imgflip.com/3si4be.jpg',
    sourcePage: 'https://imgflip.com/meme/Trade-Offer',
    hash: 'trade_offer_suit',
    tags: ['сделка', 'костюм', 'обмен', 'бизнес'],
    defaultTopText: 'Я ПОЛУЧАЮ: ТВОЮ ЗАРПЛАТУ',
    defaultBottomText: 'ТЫ ПОЛУЧАЕШЬ: КОФЕ И КРУАССАН',
  },
  {
    id: 'curated-clown',
    provider: 'curated',
    sourceId: '2ybua0',
    title: 'Превращение в клоуна',
    imageUrl: 'https://i.imgflip.com/2ybua0.jpg',
    thumbnailUrl: 'https://i.imgflip.com/2ybua0.jpg',
    sourcePage: 'https://imgflip.com/meme/Putting-On-Clown-Makeup',
    hash: 'putting_on_clown_makeup',
    tags: ['клоун', 'наивность', 'разочарование'],
    defaultTopText: '«ОН ОБЯЗАТЕЛЬНО ИСПРАВИТСЯ»',
    defaultBottomText: 'ПОЛНЫЙ КЛОУНСКИЙ ГРИМ',
  },
  {
    id: 'curated-spiderman',
    provider: 'curated',
    sourceId: '1ihzfe',
    title: 'Человек-паук указывает на Человека-паука',
    imageUrl: 'https://i.imgflip.com/1ihzfe.jpg',
    thumbnailUrl: 'https://i.imgflip.com/1ihzfe.jpg',
    sourcePage: 'https://imgflip.com/meme/Spider-Man-Pointing-at-Spider-Man',
    hash: 'spiderman_pointing',
    tags: ['человек-паук', 'стрелка', 'обвинение'],
    defaultTopText: 'Я В 2 ЧАСА НОЧИ',
    defaultBottomText: 'Я УТРОМ НА РАБОТЕ',
  },
  {
    id: 'curated-pikachu',
    provider: 'curated',
    sourceId: '26jxvz',
    title: 'Шокированный Пикачу',
    imageUrl: 'https://i.imgflip.com/26jxvz.jpg',
    thumbnailUrl: 'https://i.imgflip.com/26jxvz.jpg',
    sourcePage: 'https://imgflip.com/meme/Surprised-Pikachu',
    hash: 'surprised_pikachu',
    tags: ['пикачу', 'шок', 'удивление', 'рот'],
    defaultTopText: 'ТРАЧУ ВСЕ ДЕНЬГИ В ПЕРВЫЙ ДЕНЬ',
    defaultBottomText: 'Я ВЕСЬ ОСТАВШИЙСЯ МЕСЯЦ:',
  },
];

// 1. Meme_Api Provider (Reddit Meme Aggregator)
async function fetchFromMemeApi(): Promise<WebMemeItem[]> {
  const cacheKey = 'meme_api';
  const now = Date.now();
  if (providerCache[cacheKey] && now - providerCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return providerCache[cacheKey].items;
  }

  const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl', 'ProgrammerHumor'];
  const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
  const url = `https://meme-api.com/gimme/${randomSub}/20`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent': 'MemenatorApp/2.0 (web meme studio aggregator)',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data || !Array.isArray(data.memes)) return [];

    const items: WebMemeItem[] = [];
    for (const m of data.memes) {
      if (m.nsfw || m.spoiler || !m.url) continue;
      const lower = m.url.toLowerCase();
      if (!lower.match(/\.(jpg|jpeg|png|webp|gif)$/i) && !lower.includes('i.redd.it') && !lower.includes('i.imgur.com')) {
        continue;
      }

      const sig = computeImageSignature(m.title || 'Meme', m.url);
      items.push({
        id: `memeapi-${m.author || 'post'}-${m.ups || Math.random().toString(36).slice(2, 7)}`,
        provider: 'meme_api',
        sourceId: m.postLink || m.url,
        title: m.title || 'Популярный мем',
        imageUrl: m.url,
        thumbnailUrl: m.url,
        sourcePage: m.postLink,
        author: m.author,
        nsfw: false,
        hash: sig,
        tags: [m.subreddit || 'reddit', 'meme'],
      });
    }

    if (items.length > 0) {
      providerCache[cacheKey] = { timestamp: now, items };
    }
    return items;
  } catch (_err) {
    return [];
  }
}

// 2. Imgflip Official API Provider (Templates)
async function fetchFromImgflip(): Promise<WebMemeItem[]> {
  const cacheKey = 'imgflip';
  const now = Date.now();
  if (providerCache[cacheKey] && now - providerCache[cacheKey].timestamp < CACHE_TTL_MS * 4) {
    return providerCache[cacheKey].items;
  }

  try {
    const res = await fetch('https://api.imgflip.com/get_memes', {
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.success || !Array.isArray(data?.data?.memes)) return [];

    const items: WebMemeItem[] = data.data.memes.map((m: any) => {
      const sig = computeImageSignature(m.name, m.url);
      return {
        id: `imgflip-${m.id}`,
        provider: 'imgflip' as MemeProvider,
        sourceId: String(m.id),
        title: m.name,
        imageUrl: m.url,
        thumbnailUrl: m.url,
        sourcePage: `https://imgflip.com/meme/${m.id}`,
        nsfw: false,
        hash: sig,
        tags: ['шаблон', 'imgflip', m.name.toLowerCase()],
      };
    });

    if (items.length > 0) {
      providerCache[cacheKey] = { timestamp: now, items };
    }
    return items;
  } catch (_err) {
    return [];
  }
}

// 3. Reddit API Direct Provider (hot & rising from subreddits)
async function fetchFromReddit(): Promise<WebMemeItem[]> {
  const cacheKey = 'reddit';
  const now = Date.now();
  if (providerCache[cacheKey] && now - providerCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return providerCache[cacheKey].items;
  }

  const subreddits = ['memes', 'dankmemes', 'me_irl', 'wholesomememes', 'ProgrammerHumor'];
  const chosenSub = subreddits[Math.floor(Math.random() * subreddits.length)];
  const sortModes = ['hot', 'rising', 'new'];
  const chosenSort = sortModes[Math.floor(Math.random() * sortModes.length)];

  const url = `https://www.reddit.com/r/${chosenSub}/${chosenSort}.json?limit=25`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (MemenatorApp/2.0)',
      },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children;
    if (!Array.isArray(posts)) return [];

    const items: WebMemeItem[] = [];
    for (const post of posts) {
      const p = post.data;
      if (!p || p.over_18 || p.spoiler || p.stickied || p.is_video) continue;

      const imgUrl = p.url_overridden_by_dest || p.url;
      if (!imgUrl) continue;

      const lower = imgUrl.toLowerCase();
      const isDirectImage =
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.webp') ||
        lower.includes('i.redd.it') ||
        lower.includes('i.imgur.com');

      if (!isDirectImage) continue;

      // Extract high quality thumbnail if available
      let thumbUrl = imgUrl;
      if (p.preview?.images?.[0]?.resolutions?.length) {
        const resList = p.preview.images[0].resolutions;
        const suitable = resList[Math.min(resList.length - 1, 2)];
        if (suitable?.url) {
          thumbUrl = suitable.url.replace(/&amp;/g, '&');
        }
      }

      const sig = computeImageSignature(p.title, imgUrl);
      items.push({
        id: `reddit-${p.id}`,
        provider: 'reddit',
        sourceId: p.id,
        title: p.title || 'Мем из Reddit',
        imageUrl: imgUrl,
        thumbnailUrl: thumbUrl,
        sourcePage: `https://reddit.com${p.permalink}`,
        author: p.author,
        createdAt: p.created_utc ? p.created_utc * 1000 : undefined,
        nsfw: false,
        hash: sig,
        tags: [p.subreddit, 'reddit', chosenSort],
      });
    }

    if (items.length > 0) {
      providerCache[cacheKey] = { timestamp: now, items };
    }
    return items;
  } catch (_err) {
    return [];
  }
}

// 4. Curated / Fallback Provider
function getCuratedTemplates(): WebMemeItem[] {
  return [...CURATED_MEME_TEMPLATES];
}

export interface AggregatorOptions {
  query?: string;
  limit?: number;
  excludeIds?: string[];
  excludeHashes?: string[];
}

export interface AggregatorResult {
  items: WebMemeItem[];
  totalPoolSize: number;
  sourcesUsed: MemeProvider[];
  isFallback: boolean;
  timestamp: string;
}

// Main Aggregator Function
export async function getAggregatedWebMemes(options: AggregatorOptions): Promise<AggregatorResult> {
  const limit = Math.max(1, Math.min(options.limit || 3, 12));
  const query = (options.query || '').trim().toLowerCase();
  const excludeIdsSet = new Set((options.excludeIds || []).map((id) => id.toLowerCase()));
  const excludeHashesSet = new Set((options.excludeHashes || []).map((h) => h.toLowerCase()));

  // Fetch concurrently from independent providers with individual timeout protection
  const [memeApiRes, imgflipRes, redditRes] = await Promise.allSettled([
    fetchFromMemeApi(),
    fetchFromImgflip(),
    fetchFromReddit(),
  ]);

  const memeApiItems = memeApiRes.status === 'fulfilled' ? memeApiRes.value : [];
  const imgflipItems = imgflipRes.status === 'fulfilled' ? imgflipRes.value : [];
  const redditItems = redditRes.status === 'fulfilled' ? redditRes.value : [];
  const curatedItems = getCuratedTemplates();

  const sourcesUsed: MemeProvider[] = [];
  if (memeApiItems.length) sourcesUsed.push('meme_api');
  if (imgflipItems.length) sourcesUsed.push('imgflip');
  if (redditItems.length) sourcesUsed.push('reddit');
  if (curatedItems.length) sourcesUsed.push('curated');

  // Combine into a multi-source pool with balanced variety
  let fullPool: WebMemeItem[] = [
    ...redditItems,
    ...memeApiItems,
    ...imgflipItems,
    ...curatedItems,
  ];

  // Optional Query Filter
  if (query) {
    const matched = fullPool.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(query));
      return matchTitle || matchTags;
    });
    if (matched.length > 0) {
      fullPool = matched;
    }
  }

  // Deduplication Phase:
  // 1. Filter out items in the client's exclude list (shown recently)
  // 2. Filter out duplicates inside the current batch (by ID, Hash, Image URL, or Normalized Title)
  const seenIds = new Set<string>();
  const seenHashes = new Set<string>();
  const seenImageUrls = new Set<string>();
  const seenNormTitles = new Set<string>();

  // Filter out recent history
  const uniquePool: WebMemeItem[] = [];
  for (const item of fullPool) {
    const normTitle = normalizeTitle(item.title);
    const itemHash = (item.hash || computeImageSignature(item.title, item.imageUrl)).toLowerCase();
    const itemId = item.id.toLowerCase();
    const imgUrl = item.imageUrl.toLowerCase().split('?')[0];

    // Check against client's exclude list
    if (excludeIdsSet.has(itemId) || excludeHashesSet.has(itemHash)) {
      continue;
    }

    // Check intra-pool duplicates
    if (seenIds.has(itemId) || seenHashes.has(itemHash) || seenImageUrls.has(imgUrl) || seenNormTitles.has(normTitle)) {
      continue;
    }

    seenIds.add(itemId);
    seenHashes.add(itemHash);
    seenImageUrls.add(imgUrl);
    if (normTitle.length > 5) {
      seenNormTitles.add(normTitle);
    }
    uniquePool.push(item);
  }

  // If uniquePool is smaller than limit due to strict exclusion, loosen exclusion of client history
  let finalSelectionPool = uniquePool;
  if (finalSelectionPool.length < limit) {
    const backupPool: WebMemeItem[] = [];
    for (const item of fullPool) {
      const itemHash = (item.hash || computeImageSignature(item.title, item.imageUrl)).toLowerCase();
      const imgUrl = item.imageUrl.toLowerCase().split('?')[0];
      if (!seenHashes.has(itemHash) && !seenImageUrls.has(imgUrl)) {
        seenHashes.add(itemHash);
        seenImageUrls.add(imgUrl);
        backupPool.push(item);
      }
    }
    finalSelectionPool = backupPool;
  }

  // Balanced selection: try to pick diverse providers across the output
  const shuffled = [...finalSelectionPool].sort(() => 0.5 - Math.random());
  const selected: WebMemeItem[] = [];

  // Group by provider to avoid showing 3 of the exact same provider if multiple are available
  const byProvider: Record<string, WebMemeItem[]> = {};
  for (const item of shuffled) {
    if (!byProvider[item.provider]) byProvider[item.provider] = [];
    byProvider[item.provider].push(item);
  }

  const providerKeys = Object.keys(byProvider);
  let providerIdx = 0;
  while (selected.length < limit && selected.length < shuffled.length) {
    const currentProv = providerKeys[providerIdx % providerKeys.length];
    const provList = byProvider[currentProv];
    if (provList && provList.length > 0) {
      const item = provList.shift()!;
      selected.push(item);
    } else {
      // Pick any remaining item from shuffled
      const remaining = shuffled.find((it) => !selected.includes(it));
      if (remaining) selected.push(remaining);
      else break;
    }
    providerIdx++;
  }

  const isFallback = memeApiItems.length === 0 && redditItems.length === 0;

  return {
    items: selected,
    totalPoolSize: finalSelectionPool.length,
    sourcesUsed,
    isFallback,
    timestamp: new Date().toISOString(),
  };
}
