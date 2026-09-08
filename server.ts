import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getAggregatedWebMemes } from './server/memeAggregator';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const raw = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
  try {
    const parsed = typeof raw === 'string' && (raw.startsWith('{') || raw.includes('{"error"')) ? JSON.parse(raw) : null;
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {}
  return raw;
}

// Helper to delay for backoff
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to retry transient 503 / 429 errors silently
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 600): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = parseErrorMessage(err).toLowerCase();
      const isTransient = msg.includes('503') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('overloaded');
      if (isTransient && attempt < maxRetries) {
        await wait(delayMs * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Fallback composition analysis when AI is offline or rate-limited
function getFallbackCompositionAnalysis(width = 600, height = 600): any {
  const isLandscape = width > height;
  return {
    overallScore: 89,
    balanceAssessment: isLandscape
      ? 'Широкий горизонтальный кадр: идеальное разделение на визуальный центр и чистые зоны надписей'
      : 'Сбалансированная вертикально-центрированная композиция с чистыми зонами для панчлайна',
    ruleOfThirdsAlignment: 'strong',
    detectedStyle: 'Классический мем-формат с выразительным центрированным объектом',
    metrics: {
      visualBalance: 88,
      negativeSpace: 85,
      contrastReadability: 92,
      comedicFocus: 90,
    },
    focalSubjects: [
      {
        name: 'Главный персонаж / фокусная фигура',
        box: { x: 25, y: 22, width: 50, height: 56 },
        role: 'primary',
        gazeDirection: 'direct',
        description: 'Центральный фокус внимания зрителя. Сохраняйте эту область чистой от наложения текста.',
      },
    ],
    safeZones: [
      {
        area: 'top',
        box: { x: 5, y: 4, width: 90, height: 16 },
        recommendedTopY: 10,
        contrastQuality: 'excellent',
        bgLuminance: 'mixed',
        recommendedTextColor: '#FFFFFF',
        recommendedStrokeColor: '#000000',
        reason: 'Верхняя треть кадра свободна от лиц, обеспечивает максимальную читаемость завязки.',
      },
      {
        area: 'bottom',
        box: { x: 5, y: 82, width: 90, height: 16 },
        recommendedBottomY: 90,
        contrastQuality: 'excellent',
        bgLuminance: 'dark',
        recommendedTextColor: '#FFFFFF',
        recommendedStrokeColor: '#000000',
        reason: 'Нижняя треть кадра с высоким контрастом идеально подходит для ударного панчлайна.',
      },
    ],
    recommendations: [
      'Держите верхний сетап на уровне Y = 10-12%, чтобы не перекрывать лоб и взгляд персонажа.',
      'Нижний панчлайн размещайте на Y = 88-90% — это создает классический баланс по правилу третей.',
      'Используйте белые буквы с черной обводкой (толщина 4-5px) для 100% читаемости на любом фоне.',
      'Сохраняйте ширину строки не более 80% от ширины холста для комфортного восприятия.',
    ],
    suggestedTextPlacements: {
      topTextY: 10,
      bottomTextY: 90,
      align: 'center',
      suggestedFontSize: 36,
      fontRecommendation: 'Impact или Montserrat Black с контрастной обводкой',
      reason: 'Математически выверенное положение для классического мем-формата без загораживания фокуса.',
    },
    isFallback: true,
  };
}

// Fallback meme captions in case upstream AI has temporary service degradation
function getFallbackCaptions(style: string, customContext = ''): any[] {
  const topic = customContext.trim() ? customContext.trim() : 'ЖИЗНЬ';

  const styleMap: Record<string, any[]> = {
    roast: [
      {
        headline: 'Король самооценки',
        topText: 'КОГДА ПЫТАЕШЬСЯ ВЫГЛЯДЕТЬ ОПАСНО И ЗАГАДОЧНО',
        bottomText: 'НО ПОЛУЧАЕТСЯ ВЗГЛЯД ЧЕЛОВЕКА, ЗАБЫВШЕГО ВЫКЛЮЧИТЬ УТЮГ',
        style: 'Подкол',
        explanation: 'Безжалостное приземление пафосной позы в суровую бытовую нелепость.',
      },
      {
        headline: 'Пафос на миллион',
        topText: 'ЛИЦО В ТАКОЙ ПОЗЕ, БУДТО ТЫ КУПИЛ ЭТОТ МИР',
        bottomText: 'ХОТЯ НА БАЛАНСЕ КАРТЫ 48 РУБЛЕЙ И ЖВАЧКА ПО АКЦИИ',
        style: 'Подкол',
        explanation: 'Высмеивание чрезмерной важности при полном отсутствии повода.',
      },
      {
        headline: 'Экспертное мнение',
        topText: 'С НАСТОЛЬКО УМНЫМ И ВАЖНЫМ ВИДОМ ЕЩЕ НИКТО',
        bottomText: 'НЕ ДЕЛАЛ АБСОЛЮТНУЮ И БЕСПРОСВЕТНУЮ ГЛУПОСТЬ',
        style: 'Подкол',
        explanation: 'Язвительный комментарий к псевдоинтеллектуальному выражению лица.',
      },
      {
        headline: 'Гений конспирации',
        topText: 'КОГДА ДУМАЛ, ЧТО ЭТО ФОТО БУДЕТ СМОТРЕТЬСЯ СТИЛЬНО',
        bottomText: 'А ОНО ВЫГЛЯДИТ КАК ОРИЕНТИРОВКА В МЕСТНОМ ОТДЕЛЕ',
        style: 'Подкол',
        explanation: 'Резкое развенчание фотосессии в комичный полицейский протокол.',
      },
      {
        headline: 'Вершина эволюции',
        topText: 'МИЛЛИОНЫ ЛЕТ СЛОЖНЕЙШЕЙ ЭВОЛЮЦИИ ЧЕЛОВЕКА',
        bottomText: 'ЧТОБЫ ПРИЙТИ ВОТ К ЭТОМУ ВЫРАЖЕНИЮ ЛИЦА',
        style: 'Подкол',
        explanation: 'Космический масштаб подкола над мимикой персонажа.',
      },
      {
        headline: 'Двойные стандарты',
        topText: 'Я: «МНЕ СОВЕРШЕННО ВСЕ РАВНО НА ЧУЖОЕ МНЕНИЕ»',
        bottomText: 'МОЯ ПОЗА: ПЕРЕПРОВЕРЯЕТ ОТРАЖЕНИЕ В КАЖДОЙ ВИТРИНЕ',
        style: 'Подкол',
        explanation: 'Вскрытие нелепого позерства и показного безразличия.',
      },
    ],
    relatable: [
      {
        headline: 'Священный пакет с пакетами',
        topText: 'ОТКРЫВАЮ КУХОННЫЙ ШКАФЧИК',
        bottomText: 'А ТАМ ОН: ГИГАНТСКИЙ ПАКЕТ, ВНУТРИ КОТОРОГО ЕЩЕ 50 ПАКЕТОВ',
        style: 'Жиза / Бытовуха',
        explanation: 'Универсальный артефакт в каждой семье, знакомый любому человеку.',
      },
      {
        headline: 'Суббота ровно в 8:00 утра',
        topText: 'Я: СЕГОДНЯ НАКОНЕЦ-ТО ОТОСПЛЮСЬ ЗА ВСЮ НЕДЕЛЮ',
        bottomText: 'СОСЕД С ПЕРФОРАТОРОМ В СУББОТУ В 8:01: «ПОРА ТВАТИТЬ СТЕНУ»',
        style: 'Жиза / Бытовуха',
        explanation: 'Главный бытовой кошмар человечества — утренний перфоратор за стеной.',
      },
      {
        headline: 'Будильник-предатель',
        topText: 'ПРОСНУЛСЯ САМ В ПОЛНОЙ БОДРОСТИ В 6:58',
        bottomText: 'ЗАСНУЛ НА 2 МИНУТЫ ДО ЗВОНКА — ПРОСНУЛСЯ РАЗБИТЫМ ЗОМБИ',
        style: 'Жиза / Бытовуха',
        explanation: 'Физиологическая загадка утренних двух минут сна.',
      },
      {
        headline: 'Сковорода в раковине',
        topText: 'УЖЕ ЛЕГ В ТЕПЛУЮ КРОВАТЬ И НАКРЫЛСЯ ОДЕЯЛОМ',
        bottomText: 'МОЗГ: «А ТЫ ЗАМОЧИЛ ТУ ЖИРНУЮ СКОВОРОДУ В РАКОВИНЕ?»',
        style: 'Жиза / Бытовуха',
        explanation: 'Невыносимая бытовая совесть посреди ночи.',
      },
      {
        headline: 'Зашел в комнату',
        topText: 'РЕШИТЕЛЬНО ПРИШЕЛ В ДРУГУЮ КОМНАТУ',
        bottomText: 'И СТОЮ ПОСРЕДИ НЕЕ, ПЫТАЯСЬ ВСПОМНИТЬ, ЗАЧЕМ Я ЗДЕСЬ',
        style: 'Жиза / Бытовуха',
        explanation: 'Мгновенная очистка оперативной памяти мозга при смене дверного проема.',
      },
      {
        headline: '«Выходим через 5 минут»',
        topText: '«Я УЖЕ ГОТОВА, ВЫХОДИМ РОВНО ЧЕРЕЗ 5 МИНУТ»',
        bottomText: 'СПУСТЯ 45 МИНУТ: ОНА ДАЖЕ НЕ НАЧАЛА ВЫБИРАТЬ ОБУВЬ',
        style: 'Жиза / Бытовуха',
        explanation: 'Вечный закон относительности времени при совместных сборах.',
      },
      {
        headline: 'Оплата на кассе',
        topText: 'КАССИР: «ОПЛАТА НЕ ПРОШЛА, ПРИЛОЖИТЕ КАРТУ СНОВА»',
        bottomText: 'ВСЯ ОЧЕРЕДЬ СЗАДИ СМОТРИТ НА МЕНЯ КАК НА ГОСУДАРСТВЕННОГО ПРЕСТУПНИКА',
        style: 'Жиза / Бытовуха',
        explanation: 'Момент дичайшей бытовой неловкости перед людьми с покупками.',
      },
      {
        headline: 'Магия 1% зарядки',
        topText: 'С 100% ДО 10% РАЗРЯЖАЕТСЯ ЗА 20 МИНУТ',
        bottomText: 'ПОСЛЕДНИЙ 1% ДЕРЖИТСЯ 4 ЧАСА НА ЧИСТОЙ СИЛЕ ВОЛИ',
        style: 'Жиза / Бытовуха',
        explanation: 'Загадочный закон физики аккумуляторов всех смартфонов.',
      },
    ],
    work: [
      {
        headline: 'Пятница 17:59',
        topText: 'Я: В 17:59 ЗАКРЫВАЮ НОУТБУК И УХОЖУ В ЗАКАТ',
        bottomText: 'СООБЩЕНИЕ В СЛАКЕ: «КОЛЛЕГИ, ПРОД УПАЛ, СРОЧНО В ЗУМ»',
        style: 'Work (Офис & IT)',
        explanation: 'Универсальный ужас входящей катастрофы в последние секунды недели.',
      },
      {
        headline: 'Эффективность созвона',
        topText: 'ЭТОТ ПОЛУТОРАЧАСОВОЙ СТЕНДАП',
        bottomText: 'МОГ БЫТЬ ОДНИМ КОРОТКИМ СМС В ЧАТЕ',
        style: 'Work (Офис & IT)',
        explanation: 'Корпоративная бюрократия и бесконечные совещания ни о чем.',
      },
      {
        headline: 'Оценка таски',
        topText: 'Я СКАЗАЛ НА ПЛАНИРОВАНИИ: «ТУТ ДЕЛАТЬ НА 15 МИНУТ»',
        bottomText: 'ДЕНЬ 4: Я ВСЕ ЕЩЕ ДЕБАЖУ ОДНУ СТРОЧКУ КОДА',
        style: 'Work (Офис & IT)',
        explanation: 'Бесконечный оптимизм оценки задач разработчиками и менеджерами.',
      },
      {
        headline: 'Тест против прода',
        topText: 'НА МОЕМ КОМПЬЮТЕРЕ ВСЕ РАБОТАЛО ИДЕАЛЬНО',
        bottomText: 'РЕАЛЬНЫЙ СЕРВЕР В ЭТОТ МОМЕНТ ПЫЛАЕТ СИНИМ ПЛАМЕНЕМ',
        style: 'Work (Офис & IT)',
        explanation: 'Вечный разрыв между локальной средой разработки и боевым сервером.',
      },
      {
        headline: 'Статус на дейли',
        topText: '«ЧТО ТЫ СДЕЛАЛ ЗА ВЧЕРА? ЧТО ПЛАНИРУЕШЬ СЕГОДНЯ?»',
        bottomText: 'ВЧЕРА Я ПЫТАЛСЯ НЕ ВЫГОРАТЬ, СЕГОДНЯ ПЛАНИРУЮ ПРОДОЛЖИТЬ',
        style: 'Work (Офис & IT)',
        explanation: 'Предельная честность на утреннем созвоне в понедельник.',
      },
      {
        headline: 'Баг или фича',
        topText: 'ЗАЧЕМ ТРАТИТЬ НЕДЕЛЮ НА ИСПРАВЛЕНИЕ БАГА?',
        bottomText: 'КОГДА МОЖНО НАПИСАТЬ В ДОКУМЕНТАЦИИ, ЧТО ЭТО ФИЧА',
        style: 'Work (Офис & IT)',
        explanation: 'Инженерная мудрость и находчивость в условиях горящих сроков.',
      },
    ],
    millennials: [
      {
        headline: 'Химическая лаборатория 90-х',
        topText: 'НАШЛИ НА СТРОЙКЕ КУСОК КАРБИДА И ПЛАСТИКОВУЮ БУТЫЛКУ',
        bottomText: 'ВЕСЬ ДВОР С ДИКИМ ОРОМ И ВОСТОРГОМ РАЗБЕГАЕТСЯ В КУСТЫ',
        style: 'Миллениалы',
        explanation: 'Главное дворовое развлечение и взрывной адреналин детей 90-х.',
      },
      {
        headline: 'Трансформаторная валюта',
        topText: 'ДЕТИ СЕЙЧАС: «ЧТО ЭТО ЗА МЕТАЛЛИЧЕСКАЯ БУКВА Е?»',
        bottomText: 'ДЕТИ 90-Х: САМАЯ ЦЕННАЯ ПЛАСТИНА ДЛЯ МЕТАНИЯ В ДЕРЕВЯННЫЙ ЗАБОР',
        style: 'Миллениалы',
        explanation: 'Те самые загадочные металлические «еШки», которые валялись у каждого гаража.',
      },
      {
        headline: 'Зимний экстрим',
        topText: 'САНКИ И ТЮБИНГИ — ЭТО ДЛЯ НЕЖЕНАК',
        bottomText: 'НАСТОЯЩИЕ ЛЕГЕНДЫ ЛЕТЕЛИ С ГОРКИ НА КАРТОНКЕ ОТ ХОЛОДИЛЬНИКА',
        style: 'Миллениалы',
        explanation: 'Сверхзвуковая скорость на куске картона или линолеума с ледяной горы.',
      },
      {
        headline: 'Летний «курорт»',
        topText: 'РОДИТЕЛИ: «МЫ ЕДЕМ ОТДЫХАТЬ НА ПРИРОДУ!»',
        bottomText: 'ТЫ В 30-ГРАДУСНУЮ ЖАРУ СОБИРАЕШЬ ЖУКОВ В БАНКУ С КЕРОСИНОМ',
        style: 'Миллениалы',
        explanation: 'Беспощадная прополка грядок и сбор колорадских жуков на картофельном поле.',
      },
      {
        headline: 'Высшая медицина',
        topText: 'РАЗБИЛ КОЛЕНКУ В КРОВЬ ОБ АСФАЛЬТ И ГРАВИЙ',
        bottomText: 'ПОПЛЕВАЛ НА ПОДОРОЖНИК, ПРИЛЕПИЛ — И ПОБЕЖАЛ ИГРАТЬ ДАЛЬШЕ',
        style: 'Миллениалы',
        explanation: 'Непобедимое чудодейственное средство дворового выживания.',
      },
      {
        headline: 'Смертельная ловушка',
        topText: 'ХОЧЕШЬ ПИТЬ ТАК, ЧТО ВО РТУ ПУСТЫНЯ САХАРА',
        bottomText: 'НО ДОМОЙ НЕ ЗАХОДИШЬ, ПОТОМУ ЧТО ОБРАТНО МАМА УЖЕ НЕ ВЫПУСТИТ',
        style: 'Миллениалы',
        explanation: 'Дворовое правило железной выдержки: зашел домой — прогулке конец.',
      },
      {
        headline: 'Плейлист на карандаше',
        topText: 'СЕЛИ БАТАРЕЙКИ В КАССЕТНОМ ПЛЕЕРЕ',
        bottomText: 'ГРАНЕНЫЙ КАРАНДАШ ВКЛЮЧАЕТ РЕЖИМ СКОРОСТНОЙ ПЕРЕМОТКИ',
        style: 'Миллениалы',
        explanation: 'Механическая магия сохранения драгоценных батареек.',
      },
      {
        headline: 'Турнир века на подоконнике',
        topText: 'БИТВА НА ЗОЛОТУЮ СОТКУ С БИТОЙ CHUPA CHUPS',
        bottomText: 'НАПРЯЖЕНИЕ ВЫШЕ, ЧЕМ НА ФИНАЛЕ МИРОВОГО ЧЕМПИОНАТА',
        style: 'Миллениалы',
        explanation: 'Фишки, кэпсы и азартные состязания на каждой школьной перемене.',
      },
      {
        headline: 'Зов предков с балкона',
        topText: 'МАМА С БАЛКОНА 4-ГО ЭТАЖА ОРЕТ ТВОЕ ИМЯ НА ВЕСЬ КВАРТАЛ',
        bottomText: 'СИТУАЦИЯ: ИЛИ ТЫ МАКСИМАЛЬНО БЫСТРО БЕЖИШЬ ЕСТЬ СУП, ИЛИ ТЫ ТРУП',
        style: 'Миллениалы',
        explanation: 'Громче любого мобильного телефона: эхо материнского крика в сумерках.',
      },
    ],
    sarcastic: [
      {
        headline: 'Гениальный план',
        topText: 'БЛЕСТЯЩЕЕ РЕШЕНИЕ',
        bottomText: 'ЧТО ВООБЩЕ МОЖЕТ ПОЙТИ НЕ ТАК?',
        style: 'Сарказм / Ирония',
        explanation: 'Затишье перед неизбежной комедией ошибок.',
      },
      {
        headline: 'Конструктивный фидбек',
        topText: 'СПАСИБО ЗА ВАШЕ ЦЕННОЕ МНЕНИЕ',
        bottomText: 'ОНО УЖЕ БЛАГОПОЛУЧНО В КОРЗИНЕ',
        style: 'Сарказм / Ирония',
        explanation: 'Вежливое уклонение от непрошеных советов.',
      },
      {
        headline: 'Самостоятельная драма',
        topText: 'НАДО ЖЕ, КАКОЙ СЮРПРИЗ...',
        bottomText: 'ПОСЛЕДСТВИЯ МОИХ СОБСТВЕННЫХ ДЕЙСТВИЙ',
        style: 'Сарказм / Ирония',
        explanation: 'Когда прошлое «я» методично подставило текущее «я».',
      },
      {
        headline: 'Абсолютное спокойствие',
        topText: 'ВСЕ ИДЕТ СТРОГО ПО ПЛАНУ',
        bottomText: 'НЕ ОБРАЩАЙТЕ ВНИМАНИЯ НА СИРЕНУ',
        style: 'Сарказм / Ирония',
        explanation: 'Сохранение невозмутимости посреди полного хаоса.',
      },
      {
        headline: 'Глубокая мудрость',
        topText: 'Я УСЛЫШАЛ ТВОЕ ПРЕДЛОЖЕНИЕ',
        bottomText: 'И РЕШИЛ ЕГО ПОЛНОСТЬЮ ПРОИГНОРИРОВАТЬ',
        style: 'Сарказм / Ирония',
        explanation: 'Искренняя прямота под маской активного слушания.',
      },
    ],
    genz: [
      {
        headline: 'Диагностика вайба',
        topText: 'ВАЙБ МАКСИМАЛЬНО СОМНИТЕЛЬНЫЙ',
        bottomText: 'НИКАКОГО КЭПА, ЧИСТАЯ ПРАВДА',
        style: 'Зумеры / Пост-ирония',
        explanation: 'Точная передача текущего настроения.',
      },
      {
        headline: 'Обычный вторник',
        topText: 'ПОЛУЧИЛ МОРАЛЬНЫЙ УЩЕРБ',
        bottomText: 'ПРОСТО ПРОВЕРИВ БАЛАНС КАРТЫ',
        style: 'Зумеры / Пост-ирония',
        explanation: 'Повседневный экзистенциальный финансовый комментарий.',
      },
      {
        headline: 'Дефицит скилла',
        topText: 'СМОТРЮ ПРАВДЕ В ГЛАЗА:',
        bottomText: 'ЭТО ОПРЕДЕЛЕННО SKILL ISSUE',
        style: 'Зумеры / Пост-ирония',
        explanation: 'Смирение с собственной неловкостью.',
      },
      {
        headline: 'Просьба о тайм-тревеле',
        topText: 'Я НЕ СОЗДАН ДЛЯ ЭТОЙ ЭПОХИ',
        bottomText: 'ВЕРНИТЕ МЕНЯ ОБРАТНО В 2016 ГОД',
        style: 'Зумеры / Пост-ирония',
        explanation: 'Ностальгия по более простым временам в интернете.',
      },
      {
        headline: 'Арка главного героя',
        topText: 'ДУМАЛ, ЧТО Я ГЛАВНЫЙ ГЕРОЙ ЭТОЙ ЖИЗНИ',
        bottomText: 'ОКАЗАЛОСЬ, ПРОСТО ФОНОВЫЙ NPC #4',
        style: 'Зумеры / Пост-ирония',
        explanation: 'Комичное развенчание собственного эго.',
      },
    ],
    wholesome: [
      {
        headline: 'Напоминание на день',
        topText: 'ТЫ ДЕЛАЕШЬ ВСЕ, ЧТО МОЖЕШЬ',
        bottomText: 'И ЭТОГО УЖЕ БОЛЕЕ ЧЕМ ДОСТАТОЧНО',
        style: 'Добро и милота',
        explanation: 'Теплая поддержка для поднятия настроения.',
      },
      {
        headline: 'Проверка гидратации',
        topText: 'ОСТАНОВИСЬ НА СЕКУНДУ',
        bottomText: 'ВЫПЕЙ ВОДЫ И РАССЛАБЬ ПЛЕЧИ',
        style: 'Добро и милота',
        explanation: 'Мягкая забота о физическом и ментальном состоянии.',
      },
      {
        headline: 'Маленькие победы',
        topText: 'ПРАЗДНУЙ МАЛЕНЬКИЕ УСПЕХИ СЕГОДНЯ',
        bottomText: 'ДАЖЕ ЕСЛИ ТЫ ПРОСТО ВСТАЛ С КРОВАТИ',
        style: 'Добро и милота',
        explanation: 'Юмор с бережным отношением к себе.',
      },
      {
        headline: 'У тебя все получится',
        topText: 'ЕСЛИ ПУТЬ КАЖЕТСЯ СЛИШКОМ ТРУДНЫМ',
        bottomText: 'ВСПОМНИ, СКОЛЬКО ТЫ УЖЕ ПРОШЕЛ',
        style: 'Добро и милота',
        explanation: 'Вдохновение для преодоления сложных моментов.',
      },
      {
        headline: 'Раздача тепла',
        topText: 'ОТПРАВЛЯЮ ЭКСТРЕННУЮ ДОЗУ ПОЗИТИВА',
        bottomText: 'КАЖДОМУ, КОМУ ЭТО СЕЙЧАС НУЖНО',
        style: 'Добро и милота',
        explanation: 'Безусловная дружеская поддержка.',
      },
    ],
    trending: [
      {
        headline: `Опыт с ${topic}`,
        topText: `Я: ГОТОВЛЮСЬ К «${topic.toUpperCase()}»`,
        bottomText: 'МОИ ПОСЛЕДНИЕ 2 РАБОЧИЕ НЕЙРОНА',
        style: 'Тренды / Вирусный',
        explanation: 'Жизненный юмор на основе вашей ситуации.',
      },
      {
        headline: 'Ожидание против реальности',
        topText: 'КАК Я ПРЕДСТАВЛЯЛ СВОЙ ДЕНЬ',
        bottomText: 'КАК ОН ПРОХОДИТ НА САМОМ ДЕЛЕ',
        style: 'Тренды / Вирусный',
        explanation: 'Вечный контрапункт грандиозных планов и хаоса жизни.',
      },
      {
        headline: 'Тест на силу воли',
        topText: 'Я: СЕГОДНЯ ЛЯГУ СПАТЬ ВОВРЕМЯ',
        bottomText: '3:45 НОЧИ: СМОТРЮ ДОКУМЕНТАЛКУ ПРО СРЕДНЕВЕКОВЫЕ ЗАМКИ',
        style: 'Тренды / Вирусный',
        explanation: 'Классическое ночное залипание в интересное.',
      },
      {
        headline: 'Непрошеное мнение',
        topText: 'НИКТО НЕ СПРАШИВАЛ МОЕ МНЕНИЕ',
        bottomText: 'НО ВОТ ЭССЕ НА 40 МИНУТ',
        style: 'Тренды / Вирусный',
        explanation: 'Вся суть интернет-дискуссий в одной шутке.',
      },
      {
        headline: 'Внутренний конфликт',
        topText: 'ХОЧУ БЫТЬ УСПЕШНЫМ И ПРОДУКТИВНЫМ',
        bottomText: 'А ЕЩЕ ХОЧУ ПОСПАТЬ 14 ЧАСОВ ПОДРЯД',
        style: 'Тренды / Вирусный',
        explanation: 'Фундаментальная дилемма современного человека.',
      },
    ],
    philosophy: [
      {
        headline: 'Мысли в 3:15 ночи',
        topText: 'ПОЧЕМУ ВСЕЛЕННАЯ БЕСКОНЕЧНА?',
        bottomText: 'И ПОЧЕМУ В 2012 ГОДУ Я СКАЗАЛ ТУ ГЛУПОСТЬ?',
        style: 'Ночные мысли',
        explanation: 'Главные вопросы бытия перед сном.',
      },
      {
        headline: 'Парадокс взросления',
        topText: 'В ДЕТСТВЕ: ВОТ ВЫРАСТУ И БУДУ ДЕЛАТЬ ЧТО ХОЧУ',
        bottomText: 'СЕЙЧАС: ХОЧУ ПРОСТО ПОСПАТЬ ДНЕМ',
        style: 'Ночные мысли',
        explanation: 'Горькая правда о взрослой свободе.',
      },
      {
        headline: 'Суть времени',
        topText: '5 МИНУТ В ТИКТОКЕ = 3 ЧАСА В РЕАЛЬНОСТИ',
        bottomText: '5 МИНУТ НА ПЛАНКЕ = ЦЕЛАЯ ЭПОХА',
        style: 'Ночные мысли',
        explanation: 'Теория относительности Эйнштейна на практике.',
      },
      {
        headline: 'Человек и техника',
        topText: 'МЫ СОЗДАЛИ КВАНТОВЫЕ КОМПЬЮТЕРЫ',
        bottomText: 'ЧТОБЫ СМОТРЕТЬ НА СМЕШНЫХ КОТИКОВ',
        style: 'Ночные мысли',
        explanation: 'Вершина технологической эволюции человечества.',
      },
      {
        headline: 'В поисках смысла',
        topText: 'КТО Я И КУДА Я ИДУ?',
        bottomText: 'Я ИДУ К ХОЛОДИЛЬНИКУ В ТЕМНОТЕ',
        style: 'Ночные мысли',
        explanation: 'Приземление высоких размышлений в суровую реальность.',
      },
    ],
    gaming: [
      {
        headline: 'Сайд-квесты',
        topText: 'ГЛАВНЫЙ ЗЛОДЕЙ УНИЧТОЖАЕТ МИР',
        bottomText: 'Я: СОБИРАЮ 100 СИНИХ ЦВЕТОЧКОВ ДЛЯ СТАРИКА',
        style: 'Игры и гейминг',
        explanation: 'Приоритеты настоящего RPG-геймера.',
      },
      {
        headline: 'Еще одну катку и спать',
        topText: '«СЫГРАЮ ЕЩЕ ОДНУ И ТОЧНО В КРОВАТЬ»',
        bottomText: 'ЗА ОКНОМ НАЧИНАЮТ ПЕТЬ УТРЕННИЕ ПТИЦЫ',
        style: 'Игры и гейминг',
        explanation: 'Классическая ловушка ночного гейминга.',
      },
      {
        headline: 'Тиммейты в рейтинге',
        topText: 'ВРАЖЕСКАЯ КОМАНДА: КИБЕРСПОРТСМЕНЫ С ТРЕНЕРОМ',
        bottomText: 'МОЯ КОМАНДА: ИГРАЮТ НА ТОСТЕРЕ С ЗАКРЫТЫМИ ГЛАЗАМИ',
        style: 'Игры и гейминг',
        explanation: 'Суровый подбор игроков в рейтинговых матчах.',
      },
      {
        headline: 'Сложный босс',
        topText: 'УМИРАЮ 47 РАЗ ПОДРЯД',
        bottomText: '«ЭТО ВСЕ ИЗ-ЗА ПИНГА И ЛАГОВ, ЧЕСТНО»',
        style: 'Игры и гейминг',
        explanation: 'Универсальное оправдание любого проигрыша.',
      },
      {
        headline: 'Скидки в Steam',
        topText: 'КУПИЛ 25 ИГР СО СКИДКОЙ 80%',
        bottomText: 'И СНОВА ЗАПУСТИЛ ТО ЖЕ САМОЕ, ЧТО И 10 ЛЕТ НАЗАД',
        style: 'Игры и гейминг',
        explanation: 'Библиотека неигранных шедевров.',
      },
    ],
    dating: [
      {
        headline: 'Скрытые намеки',
        topText: 'ОНА: «ОЙ, ДА ВСЕ НОРМАЛЬНО»',
        bottomText: 'Я: ЗАПУСКАЮ МАТЕМАТИЧЕСКИЙ АНАЛИЗАТОР УГРОЗ',
        style: 'Отношения',
        explanation: 'Тайный шифр в повседневных диалогах.',
      },
      {
        headline: 'Ред флаги',
        topText: 'ВИЖУ 15 КРАСНЫХ ФЛАГОВ',
        bottomText: 'МОЙ МОЗГ: «ЗАТО У НЕГО КРАСИВЫЕ ГЛАЗА»',
        style: 'Отношения',
        explanation: 'Селективная слепота влюбленного человека.',
      },
      {
        headline: 'Выбор ресторана',
        topText: '«ГДЕ ПОУЖИНАЕМ СЕГОДНЯ?»',
        bottomText: '«МНЕ ВСЕ РАВНО, ВЫБИРАЙ САМ (НО НЕ ЭТО, НЕ ТО И НЕ ТАМ)»',
        style: 'Отношения',
        explanation: 'Сложнейший логистический квест пар.',
      },
      {
        headline: 'Сообщение без ответа',
        topText: 'НЕ ОТВЕЧАЕТ 4 МИНУТЫ',
        bottomText: 'Я: ПРИДУМАЛ 6 СЦЕНАРИЕВ СВОИХ ПОХОРОН',
        style: 'Отношения',
        explanation: 'Тревожность от статуса «прочитано».',
      },
      {
        headline: 'Первое свидание',
        topText: 'НА СВИДАНИИ: ВЕЖЛИВЫЙ ИНТЕЛЛИГЕНТ',
        bottomText: 'ДОМА В ТРУСАХ: КРИЧУ НА МИКРОВОЛНОВКУ',
        style: 'Отношения',
        explanation: 'Контраст светского образа и реального человека.',
      },
    ],
    cinema: [
      {
        headline: 'Драматическая пауза',
        topText: 'МОЙ ДРУГ РАССКАЗЫВАЕТ ИСТОРИЮ',
        bottomText: 'Я: СМОТРЮ В ОКНО КАК ГЕРОЙ ФРАНЦУЗСКОГО КИНО',
        style: 'Кино и драма',
        explanation: 'Непреодолимая тяга к пафосу в обычный день.',
      },
      {
        headline: 'Сюжетный поворот',
        topText: 'ДУМАЛ, ХУЖЕ УЖЕ НЕ БУДЕТ',
        bottomText: 'РЕЖИССЕР МОЕЙ ЖИЗНИ: «ПОДЕРЖИ МОЙ ПОПКОРН»',
        style: 'Кино и драма',
        explanation: 'Неожиданный твист в сценарии будней.',
      },
      {
        headline: 'Финальный босс года',
        topText: 'ПРОШЕЛ ЧЕРЕЗ ВСЕ ИСПЫТАНИЯ',
        bottomText: 'В ТИТРАХ: «ПРОДОЛЖЕНИЕ СЛЕДУЕТ...»',
        style: 'Кино и драма',
        explanation: 'Клиффхэнгер, которого никто не заказывал.',
      },
      {
        headline: 'Эпичная музыка в наушниках',
        topText: 'ИДУ В ПЯТЕРОЧКУ ПОД САУНДТРЕК ХАНСА ЦИММЕРА',
        bottomText: 'КАК БУДТО СПАСАЮ ВСЕЛЕННУЮ ОТ РАЗРУШЕНИЯ',
        style: 'Кино и драма',
        explanation: 'Сила правильной музыки при покупке хлеба.',
      },
      {
        headline: 'Разговор с зеркалом',
        topText: 'РЕПЕТИРУЮ ОТВЕТ В СПОРЕ С ДУШЕМ',
        bottomText: 'ОСКАР ЗА ЛУЧШУЮ МУЖСКУЮ РОЛЬ ПЕРВОГО ПЛАНА',
        style: 'Кино и драма',
        explanation: 'Победа в споре спустя трое суток.',
      },
    ],
    absurd: [
      {
        headline: 'Логика снов',
        topText: 'МОЙ СОН В 4 УТРА:',
        bottomText: 'Я ЕДУ НА БАТОНЕ С ПУШКИНЫМ СДАВАТЬ ЕГЭ ПО ФИЗИКЕ',
        style: 'Абсурд / Шитпостинг',
        explanation: 'Невероятная фантазия подсознания во сне.',
      },
      {
        headline: 'Чайник закипел',
        topText: 'ЧАЙНИК: *ИЗДАЕТ ЗВУК РЕАКТИВНОГО ИСТРЕБИТЕЛЯ*',
        bottomText: 'Я: СИЖУ И СМОТРЮ В ПУСТОТУ 40 МИНУТ',
        style: 'Абсурд / Шитпостинг',
        explanation: 'Зависшая оперативная память мозга.',
      },
      {
        headline: 'Случайная мысль',
        topText: 'ЕСЛИ ПИНГВИНЫ ПТИЦЫ',
        bottomText: 'ТО ПОЧЕМУ ОНИ В СМОКИНГАХ НА СЕВЕРЕ?',
        style: 'Абсурд / Шитпостинг',
        explanation: 'Бессмысленный и беспощадный поток мыслей.',
      },
      {
        headline: 'Беседа с котом',
        topText: 'КОТ: «МЯУ»',
        bottomText: 'Я: «ПОЛНОСТЬЮ С ТОБОЙ СОГЛАСЕН, БРАТ, ПОЛНЫЙ БРЕД»',
        style: 'Абсурд / Шитпостинг',
        explanation: 'Глубокое взаимопонимание человека и кота.',
      },
      {
        headline: 'Шитпост года',
        topText: 'УДАЛИ ЭТО СЕЙЧАС ЖЕ',
        bottomText: 'ПОКА ЭТО НЕ УВИДЕЛИ УЧЕНЫЕ ИЗ СКОЛКОВО',
        style: 'Абсурд / Шитпостинг',
        explanation: 'Максимальный градус интернет-абсурда.',
      },
    ],
  };

  const rawList = styleMap[style] || styleMap.trending;
  const defaultMechanics = [
    'Наблюдение',
    'Контраст',
    'Неожиданная интерпретация',
    'Внутренняя мысль',
    'Сарказм / Подкол',
  ];
  const defaultImageConnections = [
    'Подмечает характерную мимику, жест и взгляд персонажа в кадре',
    'Опирается на контраст между напряженной позой и комичным контекстом сцены',
    'Интерпретирует неожиданный скрытый мотив действий персонажа',
    'Озвучивает внутренний монолог героя с этим выражением лица',
    'Подкалывает очевидное визуальное несоответствие деталей и обстановки',
  ];

  return rawList.map((item, idx) => ({
    ...item,
    humorMechanic: (item as any).humorMechanic || defaultMechanics[idx % defaultMechanics.length],
    imageConnection: (item as any).imageConnection || defaultImageConnections[idx % defaultImageConnections.length],
    visualContradiction: (item as any).visualContradiction || [
      'Спокойный и невозмутимый вид на фоне нарастающего хаоса',
      'Попытка выглядеть профессионально при полном непонимании происходящего',
      'Уверенная поза, резко контрастирующая с нелепостью обстановки',
      'Внутренняя паника, тщательно замаскированная под вежливую улыбку',
      'Несоответствие серьезного выражения лица комичности ситуации',
    ][idx % 5],
    spottedDetail: (item as any).spottedDetail || [
      'Красноречивый взгляд в пустоту',
      'Специфическое напряжение в плечах и позе',
      'Немой вопрос, читаемый во взгляде',
      'Микро-ухмылка или подавленная эмоция',
      'Выразительный акцент на выражении лица',
    ][idx % 5],
    detectedMood: (item as any).detectedMood || [
      'Экзистенциальная усталость и ирония судьбы',
      'Фальшивая уверенность перед неизвестностью',
      'Внезапное озарение и принятие неизбежного',
      'Героическое преодоление бытовой бессмыслицы',
      'Тихий бунт против законов логики',
    ][idx % 5],
  }));
}

// Generate an expressive, high-contrast stylized SVG meme visual when API image quota is 0 on free tier
function generateStylizedMemeSvg(prompt: string, aspectRatio = '1:1'): string {
  let width = 800;
  let height = 800;

  if (aspectRatio === '16:9') {
    width = 1200;
    height = 675;
  } else if (aspectRatio === '9:16') {
    width = 675;
    height = 1200;
  } else if (aspectRatio === '4:3') {
    width = 960;
    height = 720;
  }

  const pLower = prompt.toLowerCase();
  const isCat = pLower.includes('cat') || pLower.includes('kitten') || pLower.includes('feline');
  const isDog = pLower.includes('dog') || pLower.includes('puppy') || pLower.includes('shiba');
  const isTech = pLower.includes('code') || pLower.includes('computer') || pLower.includes('office') || pLower.includes('laptop') || pLower.includes('programmer');
  const isSpace = pLower.includes('space') || pLower.includes('alien') || pLower.includes('moon') || pLower.includes('astronaut');

  const centerX = width / 2;
  const centerY = height / 2;

  // Render thematic comic graphic
  let characterArt = '';
  let badgeTitle = 'VIRAL MEME TEMPLATE';

  if (isCat) {
    badgeTitle = 'BUSINESS CAT MEME';
    characterArt = `
      <!-- Cat Head & Body -->
      <g transform="translate(${centerX}, ${centerY + 20})">
        <!-- Body & Tie -->
        <path d="M-120 180 C-100 80, -60 40, 0 40 C60 40, 100 80, 120 180 Z" fill="#1e1e24" stroke="#000" stroke-width="8"/>
        <!-- White Collar -->
        <polygon points="-40,40 0,90 40,40 25,35 0,60 -25,35" fill="#ffffff" stroke="#000" stroke-width="6"/>
        <!-- Red Business Tie -->
        <polygon points="-15,70 15,70 25,180 0,210 -25,180" fill="#e63946" stroke="#000" stroke-width="6"/>
        <!-- Head -->
        <ellipse cx="0" cy="-30" rx="120" ry="100" fill="#fb8500" stroke="#000" stroke-width="10"/>
        <!-- Ears -->
        <polygon points="-100,-70 -130,-170 -30,-100" fill="#fb8500" stroke="#000" stroke-width="10"/>
        <polygon points="-90,-80 -115,-150 -45,-100" fill="#ffb703"/>
        <polygon points="100,-70 130,-170 30,-100" fill="#fb8500" stroke="#000" stroke-width="10"/>
        <polygon points="90,-80 115,-150 45,-100" fill="#ffb703"/>
        <!-- Expressive Shocked Eyes -->
        <ellipse cx="-45" cy="-35" rx="35" ry="42" fill="#ffffff" stroke="#000" stroke-width="8"/>
        <circle cx="-40" cy="-35" r="18" fill="#000000"/>
        <circle cx="-35" cy="-42" r="7" fill="#ffffff"/>
        <ellipse cx="45" cy="-35" rx="35" ry="42" fill="#ffffff" stroke="#000" stroke-width="8"/>
        <circle cx="50" cy="-35" r="18" fill="#000000"/>
        <circle cx="55" cy="-42" r="7" fill="#ffffff"/>
        <!-- Nose & Whiskers -->
        <polygon points="-12,0 12,0 0,14" fill="#d90429"/>
        <line x1="-15" y1="5" x2="-85" y2="-5" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <line x1="-15" y1="12" x2="-90" y2="15" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <line x1="15" y1="5" x2="85" y2="-5" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <line x1="15" y1="12" x2="90" y2="15" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <!-- Stressed Open Mouth -->
        <ellipse cx="0" cy="24" rx="20" ry="14" fill="#000000"/>
        <!-- Sweat Drop -->
        <path d="M90 -70 C90 -70, 115 -40, 115 -25 C115 -10, 102 0, 90 0 C78 0, 65 -10, 65 -25 C65 -40, 90 -70, 90 -70 Z" fill="#00b4d8" stroke="#000" stroke-width="5"/>
      </g>
    `;
  } else if (isTech) {
    badgeTitle = 'DEVELOPER CRISIS MEME';
    characterArt = `
      <g transform="translate(${centerX}, ${centerY})">
        <!-- Glowing Monitor Screen -->
        <rect x="-180" y="-140" width="360" height="230" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="12"/>
        <rect x="-160" y="-120" width="320" height="190" fill="#020617"/>
        <!-- Matrix / Bug code lines -->
        <line x1="-140" y1="-90" x2="-20" y2="-90" stroke="#22c55e" stroke-width="8" stroke-linecap="round"/>
        <line x1="-140" y1="-65" x2="60" y2="-65" stroke="#ef4444" stroke-width="8" stroke-linecap="round"/>
        <line x1="-140" y1="-40" x2="110" y2="-40" stroke="#eab308" stroke-width="8" stroke-linecap="round"/>
        <line x1="-140" y1="-15" x2="-50" y2="-15" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
        <!-- Red ERROR Box on screen -->
        <rect x="-100" y="10" width="200" height="45" rx="8" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
        <text x="0" y="38" font-family="Impact, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">FATAL RUNTIME ERROR</text>
        <!-- Monitor Stand -->
        <polygon points="-30,90 30,90 45,150 -45,150" fill="#334155" stroke="#000" stroke-width="8"/>
        <rect x="-70" y="150" width="140" height="20" rx="6" fill="#1e293b" stroke="#000" stroke-width="6"/>
        <!-- Stressed Hands Grabbing Head Silhouette -->
        <circle cx="0" cy="190" r="60" fill="#000000"/>
        <path d="M-60 170 C-80 130, -50 100, -30 140" stroke="#f59e0b" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M60 170 C80 130, 50 100, 30 140" stroke="#f59e0b" stroke-width="14" stroke-linecap="round" fill="none"/>
      </g>
    `;
  } else if (isSpace) {
    badgeTitle = 'COSMIC DISCOVERY MEME';
    characterArt = `
      <g transform="translate(${centerX}, ${centerY})">
        <!-- Floating Flying Saucer -->
        <ellipse cx="0" cy="-40" rx="200" ry="60" fill="#64748b" stroke="#000" stroke-width="10"/>
        <ellipse cx="0" cy="-60" rx="100" ry="70" fill="#38bdf8" fill-opacity="0.8" stroke="#000" stroke-width="8"/>
        <!-- Cute Alien Pilot Inside -->
        <ellipse cx="0" cy="-70" rx="45" ry="40" fill="#a3e635" stroke="#000" stroke-width="6"/>
        <circle cx="-18" cy="-75" r="14" fill="#000000"/>
        <circle cx="18" cy="-75" r="14" fill="#000000"/>
        <circle cx="-15" cy="-78" r="4" fill="#ffffff"/>
        <circle cx="21" cy="-78" r="4" fill="#ffffff"/>
        <!-- Tractor Beam -->
        <polygon points="-60,-20 60,-20 180,240 -180,240" fill="#facc15" fill-opacity="0.4"/>
        <!-- Floating Rubber Duck or Object -->
        <ellipse cx="0" cy="160" rx="40" ry="30" fill="#eab308" stroke="#000" stroke-width="6"/>
        <circle cx="25" cy="140" r="22" fill="#eab308" stroke="#000" stroke-width="6"/>
        <polygon points="40,140 60,146 40,152" fill="#ea580c"/>
      </g>
    `;
  } else {
    // Classic Expressive Meme Character Silhouette with Dramatic Lightning / Comic Rays
    badgeTitle = 'DRAMATIC REACTION MEME';
    characterArt = `
      <g transform="translate(${centerX}, ${centerY + 40})">
        <!-- Dramatic Shocked Face Silhouette -->
        <ellipse cx="0" cy="-50" rx="110" ry="120" fill="#facc15" stroke="#000" stroke-width="12"/>
        <!-- Wide Eyes with Shock Pupils -->
        <ellipse cx="-45" cy="-60" rx="35" ry="40" fill="#ffffff" stroke="#000" stroke-width="8"/>
        <circle cx="-45" cy="-60" r="12" fill="#000000"/>
        <ellipse cx="45" cy="-60" rx="35" ry="40" fill="#ffffff" stroke="#000" stroke-width="8"/>
        <circle cx="45" cy="-60" r="12" fill="#000000"/>
        <!-- Agonized Eyebrows -->
        <path d="M-80 -115 Q-45 -90 -15 -115" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round"/>
        <path d="M80 -115 Q45 -90 15 -115" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round"/>
        <!-- Gasping Mouth -->
        <ellipse cx="0" cy="5" rx="35" ry="42" fill="#7f1d1d" stroke="#000" stroke-width="9"/>
        <!-- Hands on Cheeks (Home Alone pose) -->
        <ellipse cx="-110" cy="-20" rx="28" ry="45" fill="#facc15" stroke="#000" stroke-width="8"/>
        <ellipse cx="110" cy="-20" rx="28" ry="45" fill="#facc15" stroke="#000" stroke-width="8"/>
        <!-- Comic Exclamation Marks -->
        <text x="-130" y="-120" font-family="Impact, sans-serif" font-size="70" font-weight="900" fill="#ef4444" stroke="#000" stroke-width="4">?!</text>
        <text x="95" y="-120" font-family="Impact, sans-serif" font-size="70" font-weight="900" fill="#ef4444" stroke="#000" stroke-width="4">?!</text>
      </g>
    `;
  }

  const cleanPrompt = prompt.replace(/[<>&"]/g, '');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Comic Pop Art Background Gradient -->
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="55%" stop-color="#1d4ed8"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </radialGradient>
      <!-- Comic Dots Pattern -->
      <pattern id="halftone" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="3" fill="#ffffff" fill-opacity="0.12"/>
      </pattern>
    </defs>

    <!-- Background Base -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#halftone)"/>

    <!-- Comic Burst Rays -->
    <g opacity="0.15" stroke="#ffffff" stroke-width="40">
      <line x1="${centerX}" y1="${centerY}" x2="0" y2="0"/>
      <line x1="${centerX}" y1="${centerY}" x2="${width}" y2="0"/>
      <line x1="${centerX}" y1="${centerY}" x2="0" y2="${height}"/>
      <line x1="${centerX}" y1="${centerY}" x2="${width}" y2="${height}"/>
      <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="0"/>
      <line x1="${centerX}" y1="${centerY}" x2="${centerX}" y2="${height}"/>
      <line x1="${centerX}" y1="${centerY}" x2="0" y2="${centerY}"/>
      <line x1="${centerX}" y1="${centerY}" x2="${width}" y2="${centerY}"/>
    </g>

    <!-- Meme Badge Ribbon -->
    <g transform="translate(${centerX}, 55)">
      <rect x="-180" y="-22" width="360" height="44" rx="22" fill="#000000" fill-opacity="0.8" stroke="#f59e0b" stroke-width="4"/>
      <text x="0" y="8" font-family="'Impact', 'Arial Black', sans-serif" font-size="18" fill="#facc15" text-anchor="middle" letter-spacing="1.5">${badgeTitle}</text>
    </g>

    <!-- Character & Situation Visual Art -->
    ${characterArt}

    <!-- Prompt Caption Plaque at Bottom -->
    <g transform="translate(${centerX}, ${height - 50})">
      <rect x="-${Math.min(360, width / 2 - 30)}" y="-22" width="${Math.min(720, width - 60)}" height="44" rx="14" fill="#000000" fill-opacity="0.85" stroke="#ffffff" stroke-width="2"/>
      <text x="0" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#e2e8f0" text-anchor="middle">
        "${cleanPrompt.length > 55 ? cleanPrompt.substring(0, 52) + '...' : cleanPrompt}"
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function startServer() {
  const app = express();

  // Support up to 50MB for image base64 uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Proxy external images to prevent canvas CORS tainting
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: 'url query parameter is required.' });
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch external image.' });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (_err: any) {
      res.status(500).json({ error: 'Error proxying image.' });
    }
  });

  // Curated viral internet templates with verified high-res assets and tags
  const INTERNET_TRENDING_TEMPLATES = [
    {
      id: 'web-drake',
      name: 'Дрейк одобряет',
      url: 'https://i.imgflip.com/30b1gx.jpg',
      trendReason: 'Золотой стандарт сравнения плохого и хорошего',
      source: 'Twitter & Reddit',
      defaultTopText: 'ТО, ЧТО НАДО СДЕЛАТЬ СЕЙЧАС',
      defaultBottomText: 'ТО, ЧТО Я ДЕЛАЮ ВЕСЬ ДЕНЬ',
      tags: ['дрейк', 'сравнение', 'классика', 'выбор'],
    },
    {
      id: 'web-distracted',
      name: 'Неверный парень',
      url: 'https://i.imgflip.com/1ur9b0.jpg',
      trendReason: 'Вирусный тренд соблазна новым вместо важного',
      source: 'Imgflip Viral',
      defaultTopText: 'НОВОЕ ХОББИ НА ДВА ДНЯ',
      defaultBottomText: 'МОИ ВАЖНЫЕ ДЕЛА И РАБОТА',
      tags: ['парень', 'девушка', 'ревность', 'соблазн'],
    },
    {
      id: 'web-two-buttons',
      name: 'Две кнопки и дилемма',
      url: 'https://i.imgflip.com/1g8my4.jpg',
      trendReason: 'Мучительный выбор между двумя крайностями',
      source: 'Reddit MemeEconomy',
      defaultTopText: 'ЛЕЧЬ СПАТЬ В 23:00',
      defaultBottomText: 'СМОТРЕТЬ РИЛСЫ ДО 4 УТРА',
      tags: ['кнопки', 'выбор', 'пот', 'паника'],
    },
    {
      id: 'web-woman-cat',
      name: 'Женщина кричит на кота',
      url: 'https://i.imgflip.com/345v97.jpg',
      trendReason: 'Неутихающий мемный хит о беспочвенных претензиях',
      source: 'TikTok & VK',
      defaultTopText: 'ТЫ ОБЕЩАЛ БОЛЬШЕ НЕ ТРАТИТЬ ДЕНЬГИ!',
      defaultBottomText: 'Я И МОЯ НОВАЯ ПОКУПКА ЗА ПОЛЗАРПЛАТЫ',
      tags: ['кот', 'женщина', 'крик', 'скандал'],
    },
    {
      id: 'web-gigachad',
      name: 'Гигачад (Gigachad)',
      url: 'https://i.imgflip.com/65x3zk.jpg',
      trendReason: 'Символ абсолютной невозмутимости и уверенности',
      source: 'Reddit & Telegram',
      defaultTopText: 'ДА, Я СПЛЮ ПО 8 ЧАСОВ И ПЬЮ ВОДУ',
      defaultBottomText: 'КАК ТЫ УЗНАЛ?',
      tags: ['гигачад', 'база', 'сигма', 'уверенность'],
    },
    {
      id: 'web-harold',
      name: 'Гарольд, скрывающий боль',
      url: 'https://i.imgflip.com/gk5el.jpg',
      trendReason: 'Улыбка сквозь невыносимый стресс и усталость',
      source: 'Imgflip Hall of Fame',
      defaultTopText: 'КОГДА КЛИЕНТ ВНЕС 48-Ю ПРАВКУ',
      defaultBottomText: '«ДА, КОНЕЧНО, СЕЙЧАС ПЕРЕДЕЛАЕМ»',
      tags: ['гарольд', 'боль', 'улыбка', 'работа'],
    },
    {
      id: 'web-panik-kalm',
      name: 'Panik / Kalm / Panik',
      url: 'https://i.imgflip.com/392xtq.jpg',
      trendReason: 'Эмоциональные американские горки любого дня',
      source: 'Reddit Memes',
      defaultTopText: 'ДЕДЛАЙН ЧЕРЕЗ ЧАС',
      defaultBottomText: 'НО ЧАСЫ ПЕРЕВЕЛИ НАЗАД / А НЕТ, ВПЕРЕД',
      tags: ['паника', 'меммен', 'успокоение'],
    },
    {
      id: 'web-exit-ramp',
      name: 'Резкий съезд с трассы',
      url: 'https://i.imgflip.com/26am5w.jpg',
      trendReason: 'Импульсивные и абсурдные жизненные решения',
      source: 'Twitter Trends',
      defaultTopText: 'ЛОГИЧНЫЙ ПУТЬ',
      defaultBottomText: 'МОЙ РЕЗКИЙ ПОВОРОТ В БЕЗУМИЕ',
      tags: ['машина', 'дрифт', 'съезд', 'решение'],
    },
    {
      id: 'web-buff-doge',
      name: 'Качок Доге против Чимса',
      url: 'https://i.imgflip.com/261o3j.jpg',
      trendReason: 'Сравнение былого величия и нынешней слабости',
      source: 'Reddit r/dogelore',
      defaultTopText: 'Я В 2010: ГУЛЯЮ ВЕСЬ ДЕНЬ НА МОРОЗЕ',
      defaultBottomText: 'Я СЕЙЧАС: ПРОДУЛО ОТ ФОРТОЧКИ',
      tags: ['доге', 'чимс', 'собаки', 'сравнение'],
    },
    {
      id: 'web-disaster-girl',
      name: 'Девочка и горящий дом',
      url: 'https://i.imgflip.com/1otk96.jpg',
      trendReason: 'Коварное злорадство и хитрый план',
      source: 'Viral Classic',
      defaultTopText: 'ОТПРАВИЛ ПИСЬМО БЕЗ ВЛОЖЕНИЯ',
      defaultBottomText: 'И СРАЗУ ВЫКЛЮЧИЛ КОМПЬЮТЕР',
      tags: ['девочка', 'пожар', 'улыбка', 'хаос'],
    },
    {
      id: 'web-monkey-puppet',
      name: 'Обезьянка отводит взгляд',
      url: 'https://i.imgflip.com/2fm6x0.jpg',
      trendReason: 'Когда вспомнил свой косяк или притворился невидимкой',
      source: 'Meme Community',
      defaultTopText: 'КТО СЪЕЛ ПОСЛЕДНИЙ КУСОК ПИЦЦЫ?',
      defaultBottomText: 'Я, КОТОРЫЙ ЕЩЕ ДОЖЕВЫВАЕТ:',
      tags: ['обезьяна', 'взгляд', 'неловкость', 'стыд'],
    },
    {
      id: 'web-think-about-it',
      name: 'Палец у виска (Roll Safe)',
      url: 'https://i.imgflip.com/1h7in3.jpg',
      trendReason: 'Гениальные лайфхаки с сомнительной пользой',
      source: 'Twitter & YouTube',
      defaultTopText: 'ТЕБЯ НЕ СМОГУТ УВОЛИТЬ',
      defaultBottomText: 'ЕСЛИ ТЫ НЕ БУДЕШЬ УСТРАИВАТЬСЯ НА РАБОТУ',
      tags: ['мозг', 'лайфхак', 'палец', 'логика'],
    },
    {
      id: 'web-change-mind',
      name: 'Переубеди меня (Change My Mind)',
      url: 'https://i.imgflip.com/24y43o.jpg',
      trendReason: 'Непоколебимое спорное утверждение за столом',
      source: 'Reddit Discussion',
      defaultTopText: 'ПЯТНИЦА ЛУЧШЕ СУББОТЫ',
      defaultBottomText: 'ПЕРЕУБЕДИ МЕНЯ',
      tags: ['стол', 'кофе', 'дискуссия', 'мнение'],
    },
    {
      id: 'web-anakin-padme',
      name: 'Анакин и Падме («Ведь так?..»)',
      url: 'https://i.imgflip.com/5c7lwq.jpg',
      trendReason: 'Растущая тревога от неоднозначного ответа',
      source: 'Star Wars Memes',
      defaultTopText: 'МЫ ЖЕ ПРОСТО ПОШУТИЛИ, ДА?',
      defaultBottomText: 'ТЫ ЖЕ НЕ СДЕЛАЛ ЭТО НА САМОМ ДЕЛЕ?..',
      tags: ['анакин', 'падме', 'тревога', 'взгляд'],
    },
    {
      id: 'web-trade-offer',
      name: 'Выгодная сделка (Trade Offer)',
      url: 'https://i.imgflip.com/3si4be.jpg',
      trendReason: 'Абсурдно неравноценный обмен в жизни',
      source: 'TikTok Viral',
      defaultTopText: 'Я ПОЛУЧАЮ: ТВОЮ ЗАРПЛАТУ',
      defaultBottomText: 'ТЫ ПОЛУЧАЕШЬ: КОФЕ И КРУАССАН',
      tags: ['сделка', 'костюм', 'обмен', 'бизнес'],
    },
    {
      id: 'web-clown',
      name: 'Превращение в клоуна',
      url: 'https://i.imgflip.com/2ybua0.jpg',
      trendReason: 'Пошаговое осознание собственной наивности',
      source: 'Reddit Stages',
      defaultTopText: '«ОН ОБЯЗАТЕЛЬНО ИСПРАВИТСЯ»',
      defaultBottomText: 'ПОЛНЫЙ КЛОУНСКИЙ ГРИМ',
      tags: ['клоун', 'наивность', 'разочарование'],
    },
    {
      id: 'web-spiderman',
      name: 'Человек-паук указывает на Человека-паука',
      url: 'https://i.imgflip.com/1ihzfe.jpg',
      trendReason: 'Взаимные обвинения людей с одинаковыми грехами',
      source: 'Marvel Memes',
      defaultTopText: 'Я В 2 ЧАСА НОЧИ',
      defaultBottomText: 'Я УТРОМ НА РАБОТЕ',
      tags: ['человек-паук', 'стрелка', 'обвинение'],
    },
    {
      id: 'web-pikachu',
      name: 'Шокированный Пикачу',
      url: 'https://i.imgflip.com/26jxvz.jpg',
      trendReason: 'Искренний шок от абсолютно предсказуемого исхода',
      source: 'Anime & Gaming',
      defaultTopText: 'ТРАЧУ ВСЕ ДЕНЬГИ В ПЕРВЫЙ ДЕНЬ',
      defaultBottomText: 'Я ВЕСЬ ОСТАВШИЙСЯ МЕСЯЦ:',
      tags: ['пикачу', 'шок', 'удивление', 'рот'],
    },
  ];

  // Universal Multi-Source Web Memes Feed Endpoint (Meme_Api, Imgflip, Reddit, Curated Fallback)
  app.get('/api/feed/web-memes', async (req, res) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
      const limit = parseInt(req.query.limit as string) || 3;

      let excludeIds: string[] = [];
      if (typeof req.query.excludeIds === 'string' && req.query.excludeIds.trim()) {
        excludeIds = req.query.excludeIds.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.excludeIds)) {
        excludeIds = (req.query.excludeIds as string[]).map((s) => String(s).trim()).filter(Boolean);
      }

      let excludeHashes: string[] = [];
      if (typeof req.query.excludeHashes === 'string' && req.query.excludeHashes.trim()) {
        excludeHashes = req.query.excludeHashes.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.excludeHashes)) {
        excludeHashes = (req.query.excludeHashes as string[]).map((s) => String(s).trim()).filter(Boolean);
      }

      const feed = await getAggregatedWebMemes({
        query,
        limit,
        excludeIds,
        excludeHashes,
      });

      return res.json(feed);
    } catch (err: any) {
      console.warn('Web meme aggregator error:', err);
      return res.json({
        items: [],
        totalPoolSize: 0,
        sourcesUsed: [],
        isFallback: true,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Backward-compatible Live Trending Web Meme Templates endpoint
  app.get('/api/templates/trending-feed', async (req, res) => {
    try {
      const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
      const limit = parseInt(req.query.limit as string) || 3;
      const feed = await getAggregatedWebMemes({ query, limit });

      const mapped = feed.items.map((item) => ({
        id: item.id,
        name: item.title,
        url: item.imageUrl,
        trendReason: item.provider === 'reddit' ? 'Свежий вирусный пост из Reddit' : item.provider === 'imgflip' ? 'Трендовый шаблон Imgflip' : 'Вирусный интернет-мем',
        source: item.provider.toUpperCase(),
        defaultTopText: item.defaultTopText || '',
        defaultBottomText: item.defaultBottomText || '',
        tags: item.tags || ['мем'],
      }));

      return res.json({
        templates: mapped,
        totalAvailable: feed.totalPoolSize,
        timestamp: feed.timestamp,
        sourcesUsed: feed.sourcesUsed,
      });
    } catch (_err) {
      return res.json({
        templates: INTERNET_TRENDING_TEMPLATES.slice(0, 3),
        totalAvailable: INTERNET_TRENDING_TEMPLATES.length,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Magic Caption API endpoint: Analyzes image, finds contradictions, details and mood
  app.post('/api/magic-caption', async (req, res) => {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      style = 'trending',
      customContext = '',
      compositionContext,
    } = req.body;
    const safeStyle = typeof style === 'string' && style.trim() ? style.trim() : 'trending';

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    try {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const ai = getGeminiClient();

      // Style-specific profile definitions
      let styleInstruction = '';
      let styleNameRu = 'Тренды';

      if (safeStyle === 'roast') {
        styleNameRu = 'Подкол / Прожарка';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ПОДКОЛ / ПРОЖАРКА» (ROAST):
- ЦЕЛЬ ПРОЖАРКИ — ИМЕННО ТО, ЧТО В КАДРЕ! Не придумывай абстрактные сюжеты со стороны.
- Безжалостно, едко и смешно обыграй:
  * нелепое, пафосное, глуповатое или напуганное выражение лица;
  * позу, напряжение тела, странный жест или неестественную осанку;
  * одежду, униформу, головной убор или нелепые аксессуары;
  * роль/профессию (если на фото полицейский — про протоколы, проверку прав, засаду в кустах; если кот — про пузо, наглость и тыгыдык; если ребенок — про истерику из-за конфеты);
  * попытку персонажа выглядеть крутым или опасным при очевидном визуальном фиаско.
- СТРОГИЙ ЗАПРЕТ: не переводи шутку на HR, Jira, Zoom или абстрактный офис, если в кадре их нет!`;
      } else if (safeStyle === 'relatable') {
        styleNameRu = 'Жиза / Быт';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ЖИЗА / БЫТ» (RELATABLE):
- ЖИЗА ДОЛЖНА БЫТЬ ОРГАНИЧЕСКИМ ПРОДОЛЖЕНИЕМ ФОТОГРАФИИ, а не случайным анекдотом!
- Внимательно изучи позу, физическое напряжение и эмоцию на фото: какую РЕАЛЬНУЮ БЫТОВУЮ СИТУАЦИЮ этот персонаж сейчас проживает?
  * Неловкость при встрече знакомого, чье имя вылетело из головы;
  * Паническое похлопывание по карманам в поисках телефона или ключей;
  * Мучительный выбор блюда в меню или зависание посреди комнаты с вопросом «зачем я сюда пришел?»;
  * Реакция на странный звук ночью, попытка тихо открыть пакет или холодильник;
  * Неловкое молчание на кассе, когда терминал завис на оплате.
- СТРОГИЙ ЗАПРЕТ НА КЛИШЕ: не вставляй дежурный «пакет с пакетами» или «перфоратор в субботу», если они не связаны с кадром! Жиза должна быть свежей, психологически точной и отталкиваться от физической реакции героя.`;
      } else if (safeStyle === 'work') {
        styleNameRu = 'Work (Профессия и работа)';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «WORK» (ПРОФЕССИЯ, СЛУЖБА, ДЕЛО):
- ОБЫГРЫВАЙ ПРОФЕССИЮ ИЛИ ЗАНЯТИЕ, КОТОРОЕ ВИДНО НА ФОТО:
  * Человек в форме (полиция, охрана, врач, спасатель) -> специфика службы: дежурство, смены, проверки, устав, отчеты, субординация;
  * Человек в фартуке / повар -> ресторанные будни, запарка, крики шефа, сгоревший заказ;
  * Водитель / в автомобиле -> пробки, навигатор, пассажиры, автомеханики;
  * Строитель / мастер -> инструмент, чертежи, «и так сойдет»;
  * Животное (кот, собака) -> кошачья «работа» (спать 16 часов, инспектировать пакеты, шерстить ковер);
  * И ТОЛЬКО ЕСЛИ в кадре реальный офисный стол, ноутбук или переговорка -> тогда уместны корпоративные таски, созвоны и дедлайны. Не превращай всех подряд в айтишников!`;
      } else if (safeStyle === 'millennials') {
        styleNameRu = 'Миллениалы (28-42 года)';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «МИЛЛЕНИАЛЫ» (ПОКОЛЕНИЕ 90-х И 00-х):
- Связывай происходящее на фото с узнаваемым опытом поколения миллениалов:
  1) Дворовая память: игра в фишки (сотки/кэпсы) на подоконниках, огород и сбор колорадского жука («пока не соберешь — гулять не пойдешь»), подорожник на разбитую коленку, карбид в бутылке, перемотка кассет граненым карандашом, страх зайти домой попить воды («ведь мама обратно не выпустит»), Dendy, Sega, чайный гриб.
  2) Нынешняя взрослая жизнь (30+ лет): хруст в колене или шее после сна, искренний восторг от новой швабры, сковороды или робота-пылесоса, выбор ортопедической подушки, шок от цен на масло, усталость от взрослых решений.
- ОБЯЗАТЕЛЬНО связывай с кадром: поза, мимика или жест должны быть мостиком к этой ностальгии или взрослой боли!`;
      } else if (safeStyle === 'genz') {
        styleNameRu = 'Зумеры (16-25 лет)';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ЗУМЕРЫ» (GEN-Z / ПОСТИРОНИЯ):
- Аутентичный вайб поколения Z, кардинально отличающийся от миллениалов:
  * Постироничный абсурд, взгляд через призму соцсетей (TikTok, Telegram, Twitch).
  * Сленг и паттерны: POV, делюжен, ред флаг / грин флаг, зачиллить, не выкупает, главный герой vs NPC, словил тильт, социальная батарейка на нуле, комфортик, сигма/скуф, «сомнительно, но окэй».
  * НИКАКОЙ ностальгии по 90-м (зумеры тогда не жили!).
  * Шутка строится на том, как персонаж на фото выглядел бы в трендовом рилсе или стриме.`;
      } else if (safeStyle === 'sarcastic') {
        styleNameRu = 'Сарказм';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «САРКАЗМ»:
- Едкая, тонкая, безжалостная ирония над тем, что происходит в кадре. Буквальный или вывернутый наизнанку комментарий к позе и выражению лица персонажа.`;
      } else if (safeStyle === 'philosophy') {
        styleNameRu = 'Ночные мысли';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «НОЧНЫЕ МЫСЛИ»:
- Псевдоинтеллектуальный экзистенциальный трактат о смысле бытия, глубокомысленно примененный к мелкой или комичной детали в кадре.`;
      } else if (safeStyle === 'gaming') {
        styleNameRu = 'Гейминг';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ГЕЙМИНГ»:
- Обыграй позу, взгляд или окружение как элемент видеоигры: забагованный NPC, побочный квест, босс-файт, кривой хитбокс, выбор реплики в диалоге, нехватка стамины.`;
      } else if (safeStyle === 'dating') {
        styleNameRu = 'Отношения';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ОТНОШЕНИЯ»:
- Романтические неловкости, свидания, скрытые намеки, френдзона, переписки — если поза и взгляд персонажа выражают эту социальную динамику.`;
      } else if (safeStyle === 'cinema') {
        styleNameRu = 'Кино и драма';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «КИНО И ДРАМА»:
- Драматический голливудский пафос блокбастера или артхауса, наложенный на обыденное действие в кадре.`;
      } else if (safeStyle === 'absurd') {
        styleNameRu = 'Шитпост / Абсурд';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ШИТПОСТ / АБСУРД»:
- Непредсказуемый сюрреализм, ломающий логику, но цепляющийся за физическую сцену и конкретные детали кадра.`;
      } else if (safeStyle === 'wholesome') {
        styleNameRu = 'Добро и милота';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ДОБРО И МИЛОТА»:
- Теплый, ободряющий, светлый юмор, вызывающий добрую улыбку, исходя из взгляда или милой детали персонажа на фото.`;
      } else {
        styleNameRu = 'Тренды / Вирусный';
        styleInstruction = `
ХАРАКТЕР СТИЛЯ «ТРЕНДЫ»:
- Острый, динамичный мем формата «сетап — панчлайн». Классический мемный тайминг, опирающийся на конкретную мимику, жест и действие на фото.`;
      }

      // Re-use composition analysis context if already computed
      let compositionPromptSegment = '';
      if (compositionContext && typeof compositionContext === 'object') {
        const { focalSubjects, detectedStyle, balanceAssessment } = compositionContext;
        const subjectsInfo = Array.isArray(focalSubjects) && focalSubjects.length > 0
          ? focalSubjects.map((s: any) => `- Персонаж/объект: "${s.name}" (${s.role || 'фокус'}), взгляд: ${s.gazeDirection || 'не указан'}, описание: ${s.description || ''}`).join('\n')
          : '';
        compositionPromptSegment = `
ДАННЫЕ АНАЛИЗА КОМПОЗИЦИИ КАДРА:
- Стиль кадра: ${detectedStyle || 'стандартный'}
- Оценка композиции: ${balanceAssessment || ''}
${subjectsInfo ? `Обнаруженные ключевые субъекты:\n${subjectsInfo}` : ''}
Используй этих субъектов, их направление взгляда и роли для точной фокусировки шутки!
`;
      }

      const prompt = `Ты — элитный комедийный сценарист, топ-мемолог Рунета и мастер ситуационной комедии.
Твоя цель: создать РОВНО 5 ДЕЙСТВИТЕЛЬНО СМЕШНЫХ, ОРИГИНАЛЬНЫХ и РАЗНЫХ мемов, где ГЛАВНЫМ ИСТОЧНИКОМ ЮМОРА ЯВЛЯЕТСЯ САМО ИЗОБРАЖЕНИЕ.

ВХОДНЫЕ ДАННЫЕ:
- Выбранный стиль юмора: "${safeStyle}" (${styleNameRu})
${customContext ? `- Пользовательская тема: "${customContext}". НАЙДИ ЕСТЕСТВЕННЫЙ УГОЛ ПЕРЕСЕЧЕНИЯ между этой темой и тем, что РЕАЛЬНО изображено в кадре. Не притягивай тему насильно!` : '- Пользовательская тема не задана: черпай юмор исключительно из визуального содержания снимка.'}
${compositionPromptSegment}

=======================================================
ЭТАП 1. ПРИСТАЛЬНЫЙ АНАЛИЗ ИЗОБРАЖЕНИЯ (ОБЯЗАТЕЛЬНЫЙ ШАГ)
=======================================================
Перед формулировкой шуток внимательно изучи кадр:
1. КТО / ЧТО В КАДРЕ: человек, животное, предмет, персонаж, форма или профессия (например: сотрудник ДПС, кот, ребенок, повар, спортсмен).
2. МИМИКА И ВЗГЛЯД: точное выражение лица (подозрительность, высокомерие, скрытая паника, наглая ухмылка, отрешенность, прищур), направление взгляда.
3. ПОЗА И ЖЕСТЫ: напряжение тела, неловкое движение, застывшая поза, положение рук.
4. ДЕЙСТВИЕ: что именно происходит прямо сейчас физически в сцене.
5. ОКРУЖЕНИЕ И ПРЕДМЕТЫ: дорога, комната, кухня, улица, салон машины, предметы в руках или рядом.
6. ВИЗУАЛЬНЫЕ ПРОТИВОРЕЧИЯ И ДЕТАЛИ: несоответствие между серьезным видом и нелепой обстановкой, забавная микродеталь.

=======================================================
ЭТАП 2. ЖЕСТКИЙ КОНТРОЛЬ РЕЛЕВАНТНОСТИ И АНТИ-КЛИШЕ
=======================================================
1. КОНТРОЛЬНЫЙ ВОПРОС:
Перед выдачей каждого варианта оцени:
«Эта шутка действительно использует то, что видно на текущем изображении?»
Если эту же подпись без изменений можно поставить на десятки совершенно других картинок — ВАРИАНТ СЛИШКОМ ОБЩИЙ, ОТБРОСЬ ЕГО И ЗАМЕНИ!

2. БОРЬБА С ПОВТОРЯЕМОСТЬЮ:
КАТЕГОРИЧЕСКИ СНИЗЬ глобальную склонность генератора постоянно использовать:
HR, дедлайны, заказчиков, Jira, Zoom, Tinder, Telegram, «понедельник», баги и серверы.
Эти сюжеты разрешены ТОЛЬКО если на фото РЕАЛЬНО изображен офис/компьютер, либо выбран стиль "work" (и даже в "work" обыгрывай конкретную профессию в кадре: если на фото сотрудник ДПС — шути про радары, штрафы и проверку прав; если кот — про кошачью «работу»). Не превращай полицейского или кота в офисного работника!

=======================================================
ЭТАП 3. ПЯТЬ ВАРИАНТОВ = ПЯТЬ РАЗНЫХ ШУТОК И МЕХАНИК
=======================================================
СТРОЖАЙШЕ ЗАПРЕЩЕНО генерировать 5 перефразировок одной мысли!
Все 5 вариантов ОБЯЗАНЫ использовать РАЗНЫЕ МЕХАНИКИ ЮМОРА из списка ниже (укажи название механики в 'humorMechanic'):
1. "Наблюдение" (Observation) — меткое замечание реальной физической детали, позы или привычки в кадре.
2. "Контраст" (Contrast) — столкновение ожидания/пафоса и комичной реальности на снимке.
3. "Неожиданная интерпретация" (Unexpected Interpretation) — совершенно другой, переворачивающий смысл того, что делает персонаж.
4. "Сарказм / Подкол" (Sarcasm / Roast) — едкий, язвительный укол в адрес героя, его напыщенности или действия.
5. "Абсурд" (Absurd Escalation) — логика доведена до абсурда, но отталкивается от увиденного в кадре.
6. "Гипербола" (Hyperbole) — драматическое преувеличение эмоции или масштаба происходящего в кадре.
7. "Внутренняя мысль" (Inner Monologue) — что на самом деле думает герой с этим лицом и в этой позе прямо сейчас.
8. "Диалог" (Dialogue) — реплика персонажа и ответный контекст/реплика собеседника за кадром.
9. "Буквальное прочтение" (Literal Take) — комично-буквальное описание странной физической сцены.
10. "Смена точки зрения" (Perspective Shift) — взгляд со стороны предмета, животного или стороннего свидетеля.

Каждый из 5 вариантов должен иметь УНИКАЛЬНУЮ механику юмора и абсолютно самостоятельный сюжет!

=======================================================
ЭТАП 4. ПРАВИЛА ВЫБРАННОГО СТИЛЯ ЮМОРА
=======================================================
${styleInstruction}

ТРЕБОВАНИЯ К ФОРМАТИРОВАНИЮ:
Все поля генерируй НА РУССКОМ ЯЗЫКЕ.
- 'headline': емкое название мема (2-4 слова)
- 'topText': верхний текст-завязка / сетап (БЕЗ кавычек, емко, ритмично)
- 'bottomText': нижний панчлайн / ударная реплика (БЕЗ кавычек)
- 'style': жанр юмора ("${styleNameRu}")
- 'humorMechanic': использованная механика (все 5 вариантов ОБЯЗАНЫ иметь РАЗНЫЕ механики!)
- 'imageConnection': краткое и четкое доказательство (1 предложение), как именно эта шутка опирается на увиденное в кадре
- 'explanation': 1 короткое предложение, почему это смешно
- 'visualContradiction': обнаруженное визуальное противоречие на фото
- 'spottedDetail': подмеченная визуальная микро-деталь (взгляд, жест, предмет)
- 'detectedMood': угаданное настроение персонажа`;

      // Cascade across supported models per skill guidelines
      const modelsToTry = ['gemini-3.1-pro-preview', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      let responseText: string | null = null;
      let usedModel = 'gemini-3.1-pro-preview';

      for (const modelName of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                description: 'Список ровно из 5 концептуально разных смешных мемов, глубоко привязанных к деталям изображения',
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
              },
            },
          });

          if (resp && resp.text) {
            responseText = resp.text;
            usedModel = modelName;
            break;
          }
        } catch (_modelErr: any) {
          continue;
        }
      }

      if (responseText) {
        let captions: any[] = [];
        try {
          captions = JSON.parse(responseText);
        } catch {
          const match = responseText.match(/\[[\s\S]*\]/);
          if (match) {
            captions = JSON.parse(match[0]);
          }
        }

        if (Array.isArray(captions) && captions.length > 0) {
          return res.json({ captions, modelUsed: usedModel });
        }
      }

      const fallbackCaptions = getFallbackCaptions(safeStyle, customContext);
      return res.json({
        captions: fallbackCaptions,
        isFallback: true,
        notice: 'Loaded curated style-matched meme captions.',
      });
    } catch (_err: any) {
      const fallbackCaptions = getFallbackCaptions(safeStyle, customContext);
      return res.json({
        captions: fallbackCaptions,
        isFallback: true,
        notice: 'Loaded curated style-matched meme captions.',
      });
    }
  });

  // Feature: Intelligent Composition Analysis for Memes & Photos
  app.post('/api/analyze-composition', async (req, res) => {
    const { imageBase64, mimeType = 'image/jpeg', width = 600, height = 600 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    try {
      const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const ai = getGeminiClient();

      const prompt = `Ты — ведущий арт-директор, специалист по визуальной композиции и мастер интернет-мемов.
Твоя задача — провести детальный ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ КОМПОЗИЦИИ предоставленного изображения.

Обязательно проанализируй:
1. Ключевые фокусные объекты и персонажи (focalSubjects): определи лица, позы, направление взгляда и точные координаты в процентах (x, y, width, height от 0 до 100).
2. Безопасные зоны для текста (safeZones): найди области с чистым фоном сверху и снизу, где текст НЕ будет закрывать лица персонажей и ключевые комедийные элементы.
3. Оценку композиции (overallScore: 1-100) и баланс (balanceAssessment).
4. Метрики (metrics): visualBalance (0-100), negativeSpace (0-100), contrastReadability (0-100), comedicFocus (0-100).
5. Правило третей (ruleOfThirdsAlignment: 'strong', 'moderate' или 'centered').
6. Практические рекомендации (recommendations): 3-5 конкретных советов автору мема по размещению, размеру текста и акцентам.
7. Идеальное положение текста (suggestedTextPlacements): точные topTextY, bottomTextY (в процентах 0-100), align ('center', 'left', 'right'), suggestedFontSize и reason.
8. Стиль композиции (detectedStyle).

Все тексты должны быть на русском языке.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.INTEGER, description: 'Оценка композиции от 1 до 100' },
          balanceAssessment: { type: Type.STRING, description: 'Вербальная оценка баланса' },
          ruleOfThirdsAlignment: { type: Type.STRING, description: 'strong, moderate или centered' },
          detectedStyle: { type: Type.STRING, description: 'Тип композиции' },
          metrics: {
            type: Type.OBJECT,
            properties: {
              visualBalance: { type: Type.INTEGER },
              negativeSpace: { type: Type.INTEGER },
              contrastReadability: { type: Type.INTEGER },
              comedicFocus: { type: Type.INTEGER },
            },
            required: ['visualBalance', 'negativeSpace', 'contrastReadability', 'comedicFocus'],
          },
          focalSubjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                box: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                  },
                  required: ['x', 'y', 'width', 'height'],
                },
                role: { type: Type.STRING },
                gazeDirection: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['name', 'box', 'role', 'description'],
            },
          },
          safeZones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                area: { type: Type.STRING },
                box: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                  },
                  required: ['x', 'y', 'width', 'height'],
                },
                recommendedTopY: { type: Type.NUMBER },
                recommendedBottomY: { type: Type.NUMBER },
                contrastQuality: { type: Type.STRING },
                bgLuminance: { type: Type.STRING },
                recommendedTextColor: { type: Type.STRING },
                recommendedStrokeColor: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['area', 'box', 'contrastQuality', 'bgLuminance', 'recommendedTextColor', 'recommendedStrokeColor', 'reason'],
            },
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          suggestedTextPlacements: {
            type: Type.OBJECT,
            properties: {
              topTextY: { type: Type.NUMBER },
              bottomTextY: { type: Type.NUMBER },
              align: { type: Type.STRING },
              suggestedFontSize: { type: Type.NUMBER },
              fontRecommendation: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['topTextY', 'bottomTextY', 'align', 'suggestedFontSize', 'fontRecommendation', 'reason'],
          },
        },
        required: [
          'overallScore',
          'balanceAssessment',
          'ruleOfThirdsAlignment',
          'detectedStyle',
          'metrics',
          'focalSubjects',
          'safeZones',
          'recommendations',
          'suggestedTextPlacements',
        ],
      };

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      let responseText: string | null = null;
      let usedModel = 'gemini-3.8-flash';

      for (const modelName of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema,
            },
          });

          if (resp && resp.text) {
            responseText = resp.text;
            usedModel = modelName;
            break;
          }
        } catch (_modelErr: any) {
          continue;
        }
      }

      if (responseText) {
        try {
          const analysis = JSON.parse(responseText);
          return res.json({ analysis, modelUsed: usedModel });
        } catch {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            const analysis = JSON.parse(match[0]);
            return res.json({ analysis, modelUsed: usedModel });
          }
        }
      }

      const fallback = getFallbackCompositionAnalysis(width, height);
      return res.json({ analysis: fallback, isFallback: true });
    } catch (_err: any) {
      const fallback = getFallbackCompositionAnalysis(width, height);
      return res.json({ analysis: fallback, isFallback: true });
    }
  });

  // Feature: Create & edit images using gemini-3.1-flash-image / gemini-3.1-flash-lite-image
  app.post('/api/generate-template-image', async (req, res) => {
    const { prompt, aspectRatio = '1:1', sourceImageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
      const ai = getGeminiClient();

      let contents: any;
      if (sourceImageBase64) {
        const cleanBase64 = sourceImageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        contents = {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: `Modify this meme template image according to the request: ${prompt}. Maintain high comedic value and clear visual focal points.`,
            },
          ],
        };
      } else {
        contents = {
          parts: [
            {
              text: `A funny, expressive meme template photo or visual suitable for adding meme captions: ${prompt}. High quality, vibrant lighting, expressive faces or hilarious situation, clean composition.`,
            },
          ],
        };
      }

      let response: any;
      try {
        response = await callWithRetry(
          () =>
            ai.models.generateContent({
              model: 'gemini-3.1-flash-image',
              contents,
              config: {
                imageConfig: {
                  aspectRatio: aspectRatio as any,
                  imageSize: '1K',
                },
              },
            }),
          1,
          600
        );
      } catch (_err1: any) {
        response = await callWithRetry(
          () =>
            ai.models.generateContent({
              model: 'gemini-3.1-flash-lite-image',
              contents,
              config: {
                imageConfig: {
                  aspectRatio: aspectRatio as any,
                },
              },
            }),
          1,
          600
        );
      }

      let imageUrl: string | null = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const partMime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${partMime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error('No image was returned by the AI model.');
      }

      return res.json({ imageUrl });
    } catch (_err: any) {
      // If quota is 0 on free tier or model is unavailable, generate a stylized graphic meme template
      // so the user always receives a working, usable meme template without a blocking error!
      const fallbackSvg = generateStylizedMemeSvg(prompt, aspectRatio);
      return res.json({
        imageUrl: fallbackSvg,
        isFallback: true,
        note: 'Created stylized comic meme template! (Note: Photorealistic image model requires a paid Gemini key in Settings > Secrets).',
      });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
