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

/**
 * MEMENATOR was originally authored in Russian, so legacy components still
 * contain Russian UI literals. This compatibility dictionary translates those
 * literals without touching user-authored meme text or canvas content.
 * New product-facing code should prefer useUiPreferences().tr().
 */
const EXACT_TRANSLATIONS: Record<string, string> = {
  // App shell / common actions
  'Автосохранение активно': 'Autosave active',
  'Холст в центре • ИИ справа': 'Canvas centered • AI on the right',
  'Готово! Варианты мема предложены': 'Done! Meme ideas are ready',
  'Черновик успешно восстановлен из памяти': 'Draft restored from local storage',
  'Действие отменено (Undo)': 'Action undone',
  'Действие повторено (Redo)': 'Action redone',
  'Черновик сохранен': 'Draft saved',
  'Активно': 'Active',
  'Сбросить': 'Reset',
  'Сброс': 'Reset',
  'Очистить': 'Clear',
  'Очистить все': 'Clear all',
  'Закрыть': 'Close',
  'Отмена': 'Cancel',
  'Удалить': 'Delete',
  'Открыть': 'Open',
  'Скачать': 'Download',
  'Копировать': 'Copy',
  'Скопировано!': 'Copied!',
  'Выбрать': 'Choose',
  'Выбран ✓': 'Selected ✓',
  'Найти': 'Search',
  'Только что': 'Just now',
  'Мем без названия': 'Untitled meme',
  'Готово к использованию': 'Ready to use',
  'На холст': 'To canvas',
  'На холсте!': 'On canvas!',
  'Поместить на холст': 'Place on canvas',

  // Random memes
  'СЛУЧАЙНЫЕ МЕМЫ': 'RANDOM MEMES',
  'Случайные мемы': 'Random memes',
  'Случайные': 'Random',
  'Бросок...': 'Rolling...',
  '🎲 Бросить кости снова': '🎲 Roll again',
  '⭐ Шаблон добавлен в избранное': '⭐ Template added to favorites',
  'Удалено из избранного': 'Removed from favorites',
  'Не удалось загрузить мемы': 'Could not load memes',
  'Ошибка загрузки мемов': 'Could not load memes',

  // History / favorites
  'История': 'History',
  'Избранное': 'Favorites',
  'История пуста': 'History is empty',
  'Создавайте мемы — они сохранятся здесь!': 'Create memes — they will be saved here!',
  'В избранном пусто': 'No favorites yet',
  'Нажимайте ⭐ на мемах из истории или случайных мемах!': 'Tap ⭐ on history items or random memes to save them here!',
  'Очистить историю': 'Clear history',
  'Восстановить мем': 'Restore meme',
  'В избранное': 'Add to favorites',
  'Добавить в избранное': 'Add to favorites',
  'Удалить из избранного': 'Remove from favorites',
  'МОЙ': 'MINE',
  'ШАБЛОН': 'TEMPLATE',
  'Мем удален из истории': 'Meme removed from history',
  'Очистить всю историю мемов?': 'Clear the entire meme history?',
  'История мемов очищена': 'Meme history cleared',
  '⭐ Добавлено в избранное': '⭐ Added to favorites',
  'Подготовка к скачиванию...': 'Preparing download...',
  'Мем скачан!': 'Meme downloaded!',
  'Ошибка при скачивании': 'Download failed',
  'Не удалось восстановить исходное изображение мема': 'Could not restore the original meme image',

  // Image upload
  'Загрузить свое фото': 'Upload your photo',
  'Выбрать файл': 'Choose file',

  // Meme text input
  'ТЕКСТ МЕМА': 'MEME TEXT',
  'Текст мема': 'Meme text',
  '(введите реплики или перетаскивайте на холсте)': '(enter captions or drag them on the canvas)',
  'ВЕРХНИЙ': 'TOP',
  'НИЖНИЙ': 'BOTTOM',
  'Верхний': 'Top',
  'Нижний': 'Bottom',
  'АКТИВЕН': 'ACTIVE',
  'Активен': 'Active',
  '+ Строка': '+ Line',
  'Добавлен новый текстовый блок': 'New text box added',
  'Позиции текста сброшены (верх и низ)': 'Text positions reset',

  // Canvas / toolbar
  'Зум / Обрезка': 'Crop / Zoom',
  'Композиция': 'Composition',
  'Сетка': 'Grid',
  'Трети': 'Thirds',
  'Спираль': 'Spiral',
  'Объекты': 'Subjects',
  'Зоны': 'Zones',
  '💡 Нажмите на текст или стикер для изменения размера и позиции • Привязка к центру работает автоматически':
    '💡 Click text or a sticker to resize and reposition it • Center snapping works automatically',

  // Text style editor
  'СТИЛЬ:': 'STYLE:',
  'Стиль:': 'Style:',
  'Классика': 'Classic',
  'Impact Мем': 'Impact Meme',
  'Неон': 'Neon',
  'Огонь': 'Fire',
  'Золото': 'Gold',
  'Субтитры': 'Subtitles',
  'Ко всем строкам': 'All lines',
  '✓ Ко всем строкам': '✓ All lines',
  'Шрифт:': 'Font:',
  'Кегль:': 'Size:',
  'Цвет:': 'Color:',
  'ОБВОДКА:': 'STROKE:',
  'Обводка:': 'Stroke:',
  'Внешняя': 'Outer',
  'Внутренняя': 'Inner',
  'Выкл': 'Off',
  'Плашка': 'Plate',
  'Тень: ВКЛ': 'Shadow: ON',
  'Тень: ВЫКЛ': 'Shadow: OFF',
  'Мягк': 'Soft',
  'Сочн': 'Bold',
  'Белый': 'White',
  'Желтый': 'Yellow',
  'Циан': 'Cyan',
  'Красный': 'Red',
  'Салатовый': 'Lime',
  'Оранжевый': 'Orange',
  'Фиолетовый': 'Purple',
  'Черный': 'Black',
  'Изумруд': 'Emerald',
  'Пурпур': 'Purple',
  'Черная': 'Black',

  // AI caption panel
  'ЗАМЕНИТЬ С ИИ': 'REPLACE WITH AI',
  'Замемить с ИИ': 'MEME WITH AI',
  'СТИЛЬ ЮМОРА:': 'HUMOR STYLE:',
  'Стиль юмора:': 'Humor style:',
  'Еще 3 варианта': '3 more ideas',
  'Еще 5 вариантов': '3 more ideas',
  'Анализ...': 'Analyzing...',
  'Картинка': 'Image',
  'ИИ изучает детали, настроение и противоречия на фото...': 'AI is studying details, mood, and visual contradictions...',
  'Отбираем 3 наиболее сильных и непохожих варианта': 'Selecting 3 strong and distinct ideas',
  'ГЕНЕРАТОР МЕМОВ GEMINI': 'GEMINI MEME GENERATOR',
  'Генератор мемов Gemini': 'Gemini meme generator',
  'Нажмите «Еще 3 варианта». MEMENATOR отберет самые релевантные и наименее похожие друг на друга идеи.':
    'Click “3 more ideas”. MEMENATOR will select the most relevant and least repetitive options.',
  'БЫСТРЫЕ ТЕМЫ:': 'QUICK TOPICS:',
  'Быстрые темы:': 'Quick topics:',
  'Сгенерировать 3 идеи': 'Generate 3 ideas',
  'Клик для применения': 'Click to apply',
  'Панчлайн': 'Punchline',
  'Наложено!': 'Applied!',
  'ВЕРХ:': 'TOP:',
  'НИЗ:': 'BOTTOM:',
  'Верх:': 'Top:',
  'Низ:': 'Bottom:',
  'Механика': 'Mechanic',
  'Наблюдение': 'Observation',
  'Контраст': 'Contrast',
  'Неожиданная интерпретация': 'Unexpected interpretation',
  'Смена точки зрения': 'Point-of-view shift',
  'Противоречие:': 'Contradiction:',
  'Деталь:': 'Detail:',
  'Настроение:': 'Mood:',
  'Привязка к кадру:': 'Image connection:',
  'Выберите стиль юмора': 'Choose a humor style',
  'ИИ анализирует изображение и генерирует вирусные панчи • Кликните для применения':
    'AI analyzes the image and generates punchlines • Click one to apply it',
  'Замемить!': 'Generate!',
  'Анализ изображения...': 'Analyzing image...',
  'Анализ выражений лиц и позы на изображении...': 'Analyzing expressions and poses...',
  'Сканирование картинки на уровень комической иронии...': 'Scanning the image for comic irony...',
  'Совет мемологов ИИ подбирает лучшие панчи...': 'The AI meme desk is picking the strongest punchlines...',
  'Расчет тайминга шутки и остроумия...': 'Tuning joke timing and wit...',
  'Полировка 5 отборных вариантов подписи...': 'Polishing the 3 finalists...',
  '5 вариантов подписей от ИИ (нажмите, чтобы применить)': '3 AI caption ideas (click to apply)',
  'Готово к созданию мема': 'Ready to make a meme',
  'Нажмите кнопку ниже, чтобы Gemini проанализировал визуальные детали этого изображения и предложил 5 остроумных подписей.':
    'Click below to let Gemini analyze the visual details and propose 3 strong captions.',
  '✨ Анализировать фото и создать 5 подписей': '✨ Analyze photo and create 3 captions',
  'Нажатие на подпись сразу накладывает ее на мем.': 'Clicking a caption applies it to the meme immediately.',
  'Применено!': 'Applied!',

  // Humor styles
  'Тренды': 'Trends',
  'Тренды / Вирусный': 'Trends / Viral',
  'Подкол / Прожарка': 'Roast',
  'Жиза / Бытовуха': 'Relatable',
  'Work (Офис/IT)': 'Work (Office/IT)',
  'Work (Офис и IT)': 'Work (Office & IT)',
  'Миллениалы': 'Millennials',
  'Миллениалы (Дети 90-х)': 'Millennials (90s/00s kids)',
  'Зумеры': 'Gen Z',
  'Зумеры / Пост-ирония': 'Gen Z / Post-irony',
  'Сарказм': 'Sarcasm',
  'Сарказм / Ирония': 'Sarcasm / Irony',
  'Добро и милота': 'Wholesome',
  'Ночные мысли': 'Late-night thoughts',
  'Игры и гейминг': 'Gaming',
  'Гейминг': 'Gaming',
  'Отношения': 'Relationships',
  'Кино и драма': 'Cinema / Drama',
  'Кино': 'Cinema',
  'Абсурд / Шитпостинг': 'Absurd / Shitposting',
  'Шитпост': 'Shitpost',

  // Style descriptions
  'Острый интернет-юмор и актуальные ситуации': 'Fast internet humor and current situations',
  'Язвительный, резкий юмор, привязанный к тому, что реально видно на изображении':
    'Sharp roast humor grounded in what is actually visible in the image',
  'Повседневные ситуации, знакомые почти каждому': 'Everyday situations almost everyone recognizes',
  'Работа, дедлайны, созвоны, баги и офисная жизнь — только когда это уместно по кадру':
    'Work, deadlines, calls, bugs and office life — only when the image supports it',
  'Карбид, заброшки, огород, картонка на горке, фишки, кассеты и другая узнаваемая ностальгия':
    '90s/00s nostalgia: yards, school, early PCs, consoles, CDs, dial-up and everyday artifacts',
  'Постирония, абсурд и современный интернет-язык': 'Post-irony, absurdity and modern internet language',
  'Едкая ирония и беспощадная правда': 'Dry irony and merciless truth',
  'Теплый, поддерживающий и добрый юмор': 'Warm, supportive and wholesome humor',
  'Экзистенциальные мысли в три часа ночи': 'Existential thoughts at 3 a.m.',
  'Рейтинг, лаги, сайд-квесты и тиммейты': 'Ranks, lag, side quests and teammates',
  'Ред-флаги, переписки, намеки и неловкие свидания': 'Red flags, messages, hints and awkward dates',
  'Кинематографичный пафос и эпичные повороты': 'Cinematic drama and epic twists',
  'Сюрреалистичный юмор и непредсказуемый панч': 'Surreal humor and unpredictable punchlines',

  // Quick topics
  'Понедельник': 'Monday',
  'Сессия': 'Exams',
  'Работа / IT': 'Work / IT',
  'Зарплата': 'Payday',
  'Кот': 'Cat',

  // Image generation panel / modal (UI only; generation API behavior is unchanged)
  'СГЕНЕРИРОВАТЬ МЕМ': 'GENERATE MEME',
  'Сгенерировать мем': 'Generate meme',
  'Генератор мем-картинок': 'Meme image generator',
  'Создавайте визуальные шаблоны по текстовому описанию или готовым фразам из ИИ':
    'Create visual meme templates from a text description or AI caption ideas',
  'Новая картинка': 'New image',
  'Изменить текущую': 'Edit current',
  'Создать новую картинку': 'Create new image',
  'Изменить текущее фото': 'Edit current photo',
  'Описание': 'Prompt',
  'Готовые фразы ИИ': 'AI caption ideas',
  'Галерея': 'Gallery',
  'Формат:': 'Format:',
  'Формат кадра:': 'Aspect ratio:',
  'Генерация через Gemini 3.1...': 'Generating with Gemini 3.1...',
  'Генерируем через Gemini 3.1 Flash Image...': 'Generating with Gemini 3.1 Flash Image...',
  'Сгенерировать картинку': 'Generate image',
  'Сгенерировать мем-картинку': 'Generate meme image',
  'Применить изменения к фото': 'Apply edits to photo',
  '⚡ Из «Замемить с ИИ»': '⚡ From “Meme with AI”',
  '⚡ Из «Замемить с ИИ»:': '⚡ From “Meme with AI”:',
  'Клик для генерации': 'Click to generate',
  'В секции «Замемить с ИИ» пока нет вариантов. Нажмите «Еще 3 варианта» справа или выберите готовый стиль ниже.':
    'There are no AI caption ideas yet. Click “3 more ideas” on the right or choose a preset below.',
  'Сгенерировать': 'Generate',
  '💬 Текст с вашего холста:': '💬 Text from your canvas:',
  '💬 Текст с холста:': '💬 Canvas text:',
  'Создать визуал': 'Create visual',
  'Идеи в стиле:': 'Ideas in style:',
  'Сохраненные генерации': 'Saved generations',
  'Галерея очищена': 'Gallery cleared',
  'Пока нет сгенерированных изображений. Сгенерируйте первую картинку во вкладке «Описание»!':
    'No generated images yet. Create your first image from the Prompt tab!',
  'Последняя генерация': 'Latest generation',
  'Описание для визуала:': 'Image prompt:',
  'Инструкция для редактирования:': 'Edit instructions:',
  'Случайная идея': 'Random idea',
  'Быстрые фразы для генерации:': 'Quick generation ideas:',
  'Здесь появится сгенерированная картинка': 'Your generated image will appear here',
  'Опишите сцену слева или нажмите на любую готовую фразу из ИИ для старта':
    'Describe a scene on the left or click an AI caption idea to start',
  'История генераций': 'Generation history',
  'Скачать изображение': 'Download image',
  'Картинка перенесена на холст!': 'Image placed on the canvas!',
  'Картинка скачивается': 'Downloading image',
  'Не удалось скачать изображение': 'Could not download image',
  'Введите описание или выберите готовую фразу': 'Enter a prompt or choose a preset',
  'Шаблон создан (локальный fallback)': 'Template created (local fallback)',
  'Мем-картинка успешно сгенерирована через Gemini 3.1!': 'Meme image generated with Gemini 3.1!',
  'Готово к использованию': 'Ready to use',

  // Image-generation preset labels
  'Кот в шоке': 'Shocked cat',
  'Капибара дзен': 'Zen capybara',
  'Драматичный хомяк': 'Dramatic hamster',
  'Саркастичный взгляд': 'Sarcastic look',
  'Кот-судья': 'Judge cat',
  'Фейспалм века': 'Epic facepalm',
  'Холодильник в 3:00': '3 a.m. fridge',
  'Утренний кофе': 'Morning coffee',
  'Ожидание зарплаты': 'Waiting for payday',
  'Горящий дедлайн': 'Deadline on fire',
  'Созвон без камеры': 'Camera-off meeting',
  'Баг на проде': 'Production bug',
  'Пингвин в скафандре': 'Space-suit penguin',
  'Голубь-босс': 'Boss pigeon',
  'Тостер-философ': 'Philosopher toaster',
  'Мыслитель в пледе': 'Blanket philosopher',
  'Собака познала мир': 'Enlightened dog',
  'Чашка чая': 'Cup of tea',
  'Все под контролем': 'Everything is under control',
  'Успешный успех': 'Maximum success',
  'План был надежен': 'The plan was solid',

  // Crop / zoom
  'Обрезка и зум фрагмента': 'Crop and zoom',
  'Вырежьте смешное лицо, увеличьте деталь или измените пропорции':
    'Crop a funny face, zoom into a detail, or change the aspect ratio',
  'Пропорции:': 'Aspect ratio:',
  'Свободно': 'Free',
  'Зум детали:': 'Detail zoom:',
  'Переместить область': 'Move selection',
  '💡 Перетаскивайте рамку мышью, пальцем или стилусом; угловые маркеры меняют размер выбранного фрагмента.':
    '💡 Drag the frame with a mouse, finger, or stylus; corner handles resize the selected area.',
  'Вернуть исходное фото': 'Restore original photo',
  'Применить обрезку': 'Apply crop',

  // Composition analysis
  'Интеллектуальный анализ композиции': 'Smart composition analysis',
  'Эвристика': 'Heuristic',
  'Приблизительная локальная оценка без фактического распознавания содержимого кадра':
    'Approximate local estimate without actual image-content recognition',
  'Оценка баланса, фокусных точек, безопасных зон и читаемости мема':
    'Evaluates balance, focal points, safe zones, and meme readability',
  'Анализируем композицию кадра...': 'Analyzing composition...',
  'Нейросеть определяет ключевые объекты, направление взглядов, зоны контраста и баланс по правилу третей.':
    'AI is evaluating focal subjects, gaze direction, contrast zones, and rule-of-thirds balance.',
  'Режим без AI Vision.': 'AI Vision is unavailable.',
  'Сервис анализа сейчас недоступен или ограничен по квоте, поэтому значения ниже рассчитаны по общим правилам композиции и размерам кадра. Они не означают, что приложение действительно обнаружило лицо, взгляд или конкретный объект.':
    'The vision service is unavailable or quota-limited, so the values below are heuristic estimates based on composition rules and frame dimensions. They do not mean the app actually detected a face, gaze, or specific object.',
  'Приблизительная оценка композиции': 'Approximate composition score',
  'Оценка композиции': 'Composition score',
  'Правило третей: Отлично': 'Rule of thirds: Strong',
  'Правило третей: Умеренно': 'Rule of thirds: Moderate',
  'Правило третей: Центрировано': 'Rule of thirds: Centered',
  'Стиль кадра:': 'Frame style:',
  'Ориентировочно': 'Approximate',
  'Высокий потенциал': 'High potential',
  'Хороший баланс': 'Good balance',
  'Метрики гармонии и читаемости': 'Balance and readability metrics',
  'Баланс веса': 'Visual balance',
  'Чистое место': 'Negative space',
  'Фокус мема': 'Meme focus',
  'Отобразить сетку композиции на холсте:': 'Show composition guides on canvas:',
  'Интерактивные направляющие': 'Interactive guides',
  'Скрыть сетку': 'Hide guides',
  '📐 1/3 Трети': '📐 Rule of thirds',
  '🌀 Золотое сеч.': '🌀 Golden ratio',
  '🎯 Объекты': '🎯 Subjects',
  '🟩 Зоны текста': '🟩 Text zones',
  'Предполагаемая фокусная область': 'Estimated focal area',
  'Обнаруженные ключевые объекты': 'Detected focal subjects',
  'Ключевые фокусные фигуры': 'Key focal subjects',
  'Безопасные зоны для текста': 'Safe text zones',

  // Legacy filters/stickers kept for saved-project compatibility
  'Фильтры': 'Filters',
  'Наклейки': 'Stickers',
  'Водяной знак': 'Watermark',
  'Оригинал': 'Original',
  'Винтаж': 'Vintage',
  'Теплый': 'Warm',
  'Драма': 'Drama',
  'Виньетка': 'Vignette',
  'На холсте:': 'On canvas:',
};

const ATTRIBUTE_TRANSLATIONS: Record<string, string> = {
  'Поиск мемов по названию...': 'Search memes by title...',
  'Поиск по Reddit, Imgflip, Meme_Api...': 'Search Reddit, Imgflip, Meme_Api...',
  'Введите реплики или перетаскивайте на холсте': 'Enter captions or drag them on the canvas',
  'Верхний текст мема...': 'Top meme text...',
  'Нижний текст мема...': 'Bottom meme text...',
  'Дополнительный текст...': 'Additional text...',
  'Укажите тему (например, “понедельник”, “сессия”, “дедлайн”)...': 'Specify a topic (for example, “Monday”, “exam”, “deadline”)...',
  'Укажите тему, если она действительно нужна...': 'Add a topic only if it is actually useful...',
  "По желанию: укажите тему (например, 'утро понедельника', 'сессия', 'крипта')...":
    "Optional: add a topic (for example, 'Monday morning', 'exams', 'crypto')...",
  'Обрезать или увеличить фрагмент': 'Crop or zoom into a detail',
  'Интеллектуальный анализ композиции и безопасных зон': 'Smart composition and safe-zone analysis',
  'Скачать готовый мем в высоком качестве': 'Download the finished meme in high quality',
  'Скопировать картинку в буфер обмена': 'Copy the image to clipboard',
  'Сбросить к исходному шаблону': 'Reset to the original template',
  'Добавить дополнительную строку текста': 'Add another text line',
  'Сбросить позиции текста по умолчанию (верх и низ)': 'Reset text positions to top and bottom',
  'Удалить строку': 'Delete line',
  'Очистить': 'Clear',
  'Открыть во весь экран': 'Open full screen',
  'Сгенерировать мем-картинку в этом стиле юмора': 'Generate a meme image in this humor style',
  'Сгенерировать мем-картинку под эту фразу': 'Generate a meme image for this caption',
  'Бросить кости: получить новую подборку': 'Roll the dice for a new set',
  'Очистить историю': 'Clear history',
  'Нажмите, чтобы восстановить мем': 'Click to restore meme',
  'Восстановить мем': 'Restore meme',
  'Открыть мем': 'Open meme',
  'Уменьшить кегль': 'Decrease font size',
  'Увеличить кегль': 'Increase font size',
  'Удалить этот текст': 'Delete this text',
  'Потяните для изменения размера текста': 'Drag to resize text',
  'Кликните для выбора, перетащите по холсту': 'Click to select, drag across the canvas',
  'Удалить этот стикер': 'Delete this sticker',
  'Потяните для изменения масштаба': 'Drag to resize',
  'Уменьшить': 'Decrease',
  'Увеличить': 'Increase',
  'Сетка композиции (Трети, Золотое сечение, Объекты, Зоны)': 'Composition guides (thirds, golden ratio, subjects, zones)',
  'Отменить (Ctrl+Z)': 'Undo (Ctrl+Z)',
  'Повторить (Ctrl+Y / Ctrl+Shift+Z)': 'Redo (Ctrl+Y / Ctrl+Shift+Z)',
  'Произвольный цвет': 'Custom color',
  'По левому краю': 'Align left',
  'По центру': 'Align center',
  'По правому краю': 'Align right',
  'ЗАГЛАВНЫЕ БУКВЫ': 'UPPERCASE',
  'Контрастная фоновая плашка': 'Contrast background plate',
  'Внешняя обводка вокруг букв (классический мемный стиль)': 'Outer stroke around letters (classic meme style)',
  'Внутренняя обводка по внутреннему контуру текста': 'Inner text stroke',
  'Без обводки': 'No stroke',
  'Свой цвет обводки': 'Custom stroke color',
  'Переключить цветную тень': 'Toggle colored shadow',
  'Развернуть на весь экран': 'Open full screen',
  'Скачать изображение': 'Download image',
  'Оригинал 100%': 'Original 100%',
  'Приблизить 150%': 'Zoom to 150%',
  'Крупный план 200%': 'Close-up 200%',
  'Максимальный фокус': 'Maximum zoom',
  'Изменить размер области обрезки от верхнего левого угла': 'Resize crop area from the top-left corner',
  'Изменить размер области обрезки от нижнего правого угла': 'Resize crop area from the bottom-right corner',
  'Опишите мем-картинку (например: удивленный кот перед монитором в стиле офисной комедии)...':
    'Describe a meme image (for example: a shocked cat in front of a monitor, office-comedy style)...',
  'Опишите изменения для текущего фото (например: добавь солнечные очки и неоновые лучи)...':
    'Describe edits for the current photo (for example: add sunglasses and neon beams)...',
  'Опишите сцену мема: персонажи, выражение лица, окружение и комичность...':
    'Describe the meme scene: characters, facial expression, setting, and comedic angle...',
  'Опишите что добавить или изменить на текущей картинке...': 'Describe what to add or change in the current image...',
};

/** System-generated form values used by the image-generator presets. */
const SYSTEM_FORM_TRANSLATIONS: Record<string, string> = {
  'Понедельник': 'Monday',
  'Сессия': 'Exams',
  'Работа / IT': 'Work / IT',
  'Зарплата': 'Payday',
  'Отношения': 'Relationships',
  'Кот': 'Cat',

  'Пушистый кот смотрит в камеру с широко раскрытыми глазами от шока': 'A fluffy cat stares into the camera with huge shocked eyes',
  'Спокойная капибара сидит в теплой воде с апельсином на голове': 'A calm capybara sits in warm water with an orange on its head',
  'Хомяк в деловом костюме с драматичным освещением в стиле нуар': 'A hamster in a business suit under dramatic noir lighting',
  'Человек с легкой ухмылкой и скептическим взглядом смотрит поверх очков': 'A person with a slight smirk gives a skeptical look over their glasses',
  'Кот сидит на возвышении и надменно оценивает окружающих': 'A cat sits on a raised platform and judges everyone around it',
  'Выразительный кинематографичный жест рукалицо на фоне неонового офиса': 'A cinematic facepalm in a neon-lit office',
  'Сонный человек в пижаме стоит перед открытым светящимся холодильником ночью': 'A sleepy person in pajamas stands before an open glowing fridge at night',
  'Человек держит гигантскую кружку кофе с пустым взглядом перед будильником': 'A person holds an enormous coffee mug and stares blankly at an alarm clock',
  'Грустная копилка-свинка смотрит на пустой кошелек': 'A sad piggy bank looks at an empty wallet',
  'Офисный работник печатает на клавиатуре, пока вокруг летают стикеры с задачами': 'An office worker types while task notes fly around the desk',
  'Кот в наушниках сидит за ноутбуком с чашкой чая': 'A cat in headphones sits at a laptop with a cup of tea',
  'Программист в ужасе смотрит на красный экран монитора с падающими графиками': 'A programmer stares in horror at a red monitor full of crashing charts',
  'Серьезный пингвин в космическом скафандре держит банан на Луне': 'A serious penguin in a space suit holds a banana on the Moon',
  'Огромный упитанный голубь сидит за столом переговоров в небоскребе': 'A huge chubby pigeon chairs a board meeting in a skyscraper',
  'Тостер с глазами смотрит в ночное звездное небо': 'A toaster with eyes gazes into the starry night sky',
  'Человек задумчиво смотрит в окно с дождем, завернувшись в теплый плед': 'A person wrapped in a warm blanket looks thoughtfully through a rainy window',
  'Собака сидит на вершине холма на закате и философски смотрит вдаль': 'A dog sits on a hill at sunset and looks philosophically into the distance',
  'Пар от горячего чая складывается в знак вопроса над книгой': 'Steam from hot tea forms a question mark above a book',
  'Пес в шляпе сидит за чашкой кофе, пока вокруг легкий хаос': 'A dog in a hat calmly drinks coffee while mild chaos unfolds around it',
  'Мультяшный персонаж гордо стоит на детском велосипеде в смокинге': 'A cartoon character proudly poses on a tiny bicycle while wearing a tuxedo',
  'Инженер смотрит на сломанную шестеренку со схемой в руках': 'An engineer studies a broken gear while holding the original blueprint',

  'Кот в солнечных очках сидит за рулем детской машинки с важным видом': 'A cat in sunglasses drives a toy car with absurd confidence',
  'Панда пытается заниматься йогой, но заснула в нелепой позе': 'A panda tries to do yoga but falls asleep in an awkward pose',
  'Офисный клерк с тремя чашками кофе пытается поймать улетающий лист бумаги': 'An office worker with three coffees tries to catch a sheet of paper flying away',
  'Капибара в деловом галстуке проводит совещание среди уток': 'A capybara in a business tie runs a meeting surrounded by ducks',
  'Человек удивленно сравнивает ожидание и реальность онлайн-покупки': 'A person compares the expectation and reality of an online purchase in disbelief',
  'Енот пытается украсть арбуз, пойманный с поличным врасплох': 'A raccoon is caught red-handed trying to steal a watermelon',
  'Робот с грустным смайликом на экране пытается понять шутку человека': 'A robot with a sad face on its screen tries to understand a human joke',
  'Кот на задних лапах удивленно смотрит в микроволновку': 'A cat standing on its hind legs stares into a microwave in surprise',
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedSystemFormValues = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>();

function translateStyleName(value: string): string {
  return EXACT_TRANSLATIONS[value] || value;
}

const translateDynamicText = (value: string): string => {
  const trimmed = value.trim();
  const exact = EXACT_TRANSLATIONS[trimmed];
  if (exact) return value.replace(trimmed, exact);

  const variant = trimmed.match(/^ВАРИАНТ #(\d+)$/i);
  if (variant) return value.replace(trimmed, `VARIANT #${variant[1]}`);

  const suggestions = trimmed.match(/^(\d+) предложени(?:е|я|й)$/i);
  if (suggestions) return value.replace(trimmed, `${suggestions[1]} suggestions`);

  const curated = trimmed.match(/^(\d+) отобранных варианта? от ИИ:$/i);
  if (curated) return value.replace(trimmed, `${curated[1]} curated AI ideas:`);

  const gallery = trimmed.match(/^Галерея \((\d+)\)$/i);
  if (gallery) return value.replace(trimmed, `Gallery (${gallery[1]})`);

  const savedGenerations = trimmed.match(/^Сохраненные генерации \((\d+)\):$/i);
  if (savedGenerations) return value.replace(trimmed, `Saved generations (${savedGenerations[1]}):`);

  const generationHistory = trimmed.match(/^История генераций \((\d+)\):$/i);
  if (generationHistory) return value.replace(trimmed, `Generation history (${generationHistory[1]}):`);

  const minutes = trimmed.match(/^(\d+) мин$/i);
  if (minutes) return value.replace(trimmed, `${minutes[1]}m`);
  const hours = trimmed.match(/^(\d+) ч$/i);
  if (hours) return value.replace(trimmed, `${hours[1]}h`);
  const days = trimmed.match(/^(\d+) д$/i);
  if (days) return value.replace(trimmed, `${days[1]}d`);

  const loaded = trimmed.match(/^Мем «(.+)» загружен!$/i);
  if (loaded) return value.replace(trimmed, `Meme “${loaded[1]}” loaded!`);
  const restored = trimmed.match(/^Мем «(.+)» восстановлен!$/i);
  if (restored) return value.replace(trimmed, `Meme “${restored[1]}” restored!`);
  const applied = trimmed.match(/^Применен мем: "(.+)"$/i);
  if (applied) return value.replace(trimmed, `Applied meme: “${applied[1]}”`);

  const randomLoaded = trimmed.match(/^🎲 Загружено (\d+) мемов — повторы иногда разрешены$/i);
  if (randomLoaded) return value.replace(trimmed, `🎲 Loaded ${randomLoaded[1]} memes — occasional repeats are allowed`);
  if (trimmed === '🎲 Новая случайная подборка загружена!') {
    return value.replace(trimmed, '🎲 New random set loaded!');
  }

  const imageStyle = trimmed.match(/^В стиле «(.+)»:$/i);
  if (imageStyle) return value.replace(trimmed, `In “${translateStyleName(imageStyle[1])}” style:`);
  const ideasStyle = trimmed.match(/^Идеи в стиле: (.+)$/i);
  if (ideasStyle) return value.replace(trimmed, `Ideas in style: ${translateStyleName(ideasStyle[1])}`);

  const strokeColor = trimmed.match(/^Цвет обводки: (.+)$/i);
  if (strokeColor) return value.replace(trimmed, `Stroke color: ${translateStyleName(strokeColor[1])}`);
  const shadowColor = trimmed.match(/^Тень: (Черная|Огонь|Золото|Неон|Пурпур|Изумруд)$/i);
  if (shadowColor) return value.replace(trimmed, `Shadow: ${translateStyleName(shadowColor[1])}`);

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
      const savedTranslation = ATTRIBUTE_TRANSLATIONS[saved] || translateDynamicText(saved);
      if (current !== saved && current !== savedTranslation) originals.set(attr, current);
    }

    const source = originals.get(attr) || current;
    const translated = language === 'en'
      ? ATTRIBUTE_TRANSLATIONS[source] || translateDynamicText(source)
      : source;
    if (current !== translated) element.setAttribute(attr, translated);
  }
};

function translateSystemGeneratedFormValue(value: string): string | null {
  const exact = SYSTEM_FORM_TRANSLATIONS[value.trim()];
  if (exact) return exact;

  const captionPrompt = value.match(/^Комедийная мем-сцена выражающая смысл: "([\s\S]+)"\. Стиль: ([^,]+), выразительная мимика(?:, читаемая композиция)?$/i);
  if (captionPrompt) {
    return `A comedic meme scene expressing: "${captionPrompt[1]}". Style: ${translateStyleName(captionPrompt[2])}, expressive facial acting and clear composition`;
  }

  const canvasPrompt = value.match(/^Выразительный мем-визуал для текста: "([\s\S]+)"\. Ироничная кинематографичная сцена с персонажами$/i);
  if (canvasPrompt) {
    return `Expressive meme visual for the caption: "${canvasPrompt[1]}". Ironic cinematic scene with characters`;
  }

  const modalCanvasPrompt = value.match(/^Мем-визуал для текста: "([\s\S]+)"\. Ироничная кинематографичная сцена$/i);
  if (modalCanvasPrompt) {
    return `Meme visual for the caption: "${modalCanvasPrompt[1]}". Ironic cinematic scene`;
  }

  return null;
}

function setNativeFormValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (!setter) return;
  setter.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function translateKnownSystemFormValues(root: ParentNode, language: UiLanguage) {
  root.querySelectorAll?.('input, textarea').forEach((node) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return;
    if (node.closest('[data-no-i18n]')) return;
    const current = node.value;

    if (language === 'en') {
      const translated = translateSystemGeneratedFormValue(current);
      if (!translated || translated === current) return;
      if (!translatedSystemFormValues.has(node)) translatedSystemFormValues.set(node, current);
      setNativeFormValue(node, translated);
      return;
    }

    const original = translatedSystemFormValues.get(node);
    if (!original) return;
    const knownEnglish = translateSystemGeneratedFormValue(original);
    if (knownEnglish === current) setNativeFormValue(node, original);
  });
}

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
    // English is the product default. Existing explicit Russian preference is respected.
    return stored === 'ru' ? 'ru' : 'en';
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
    translateKnownSystemFormValues(document.body, language);

    let formTranslationFrame = 0;
    const scheduleFormTranslation = () => {
      window.cancelAnimationFrame(formTranslationFrame);
      formTranslationFrame = window.requestAnimationFrame(() => {
        translateKnownSystemFormValues(document.body, language);
      });
    };

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
      scheduleFormTranslation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });
    document.addEventListener('click', scheduleFormTranslation, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', scheduleFormTranslation, true);
      window.cancelAnimationFrame(formTranslationFrame);
    };
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
