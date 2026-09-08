export interface StickerDefinition {
  id: string;
  label: string;
  category: 'mascot' | 'accessories' | 'badges' | 'reactions' | 'characters';
  type: 'emoji' | 'sunglasses' | 'laser-eyes' | 'custom' | 'badge' | 'sticker-art' | 'stamp';
  emoji?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeStyle?: 'stamp' | 'ribbon' | 'plate' | 'pill';
  previewSvg?: string;
}

export const STICKER_COLLECTION: StickerDefinition[] = [
  // 1. MASCOT & WATERMELON
  {
    id: 'watermelon-boss',
    label: 'Арбуз Босс',
    category: 'mascot',
    type: 'sticker-art',
    emoji: '🍉',
  },

  // 2. MEME ACCESSORIES
  {
    id: 'thug-sunglasses',
    label: 'Thug Очки',
    category: 'accessories',
    type: 'sunglasses',
    emoji: '🕶️',
  },
  {
    id: 'laser-eyes-red',
    label: 'Лазер (Красный)',
    category: 'accessories',
    type: 'laser-eyes',
    emoji: '🔴',
  },
  {
    id: 'laser-eyes-cyan',
    label: 'Лазер (Неон)',
    category: 'accessories',
    type: 'laser-eyes',
    emoji: '⚡',
  },
  {
    id: 'gold-chain',
    label: 'Золотая цепь $',
    category: 'accessories',
    type: 'sticker-art',
    emoji: '💰',
  },
  {
    id: 'king-crown',
    label: 'Корона',
    category: 'accessories',
    type: 'sticker-art',
    emoji: '👑',
  },
  {
    id: 'thug-joint',
    label: 'Косяк Thug',
    category: 'accessories',
    type: 'sticker-art',
    emoji: '🚬',
  },
  {
    id: 'devil-horns',
    label: 'Рога демона',
    category: 'accessories',
    type: 'sticker-art',
    emoji: '😈',
  },
  {
    id: 'angel-halo',
    label: 'Нимб ангела',
    category: 'accessories',
    type: 'sticker-art',
    emoji: '😇',
  },

  // 3. BADGES & STAMPS (Штампы и наклейки)
  {
    id: 'badge-approved',
    label: 'APPROVED',
    category: 'badges',
    type: 'stamp',
    badgeText: 'APPROVED',
    badgeColor: '#10b981',
    badgeStyle: 'stamp',
  },
  {
    id: 'badge-top-secret',
    label: 'СЕКРЕТНО',
    category: 'badges',
    type: 'stamp',
    badgeText: 'TOP SECRET',
    badgeColor: '#ef4444',
    badgeStyle: 'stamp',
  },
  {
    id: 'badge-base',
    label: 'БАЗА',
    category: 'badges',
    type: 'badge',
    badgeText: 'БАЗА',
    badgeColor: '#059669',
    badgeStyle: 'plate',
  },
  {
    id: 'badge-cringe',
    label: 'КРИНЖ',
    category: 'badges',
    type: 'badge',
    badgeText: 'КРИНЖ',
    badgeColor: '#9333ea',
    badgeStyle: 'ribbon',
  },
  {
    id: 'badge-censored',
    label: 'CENSORED',
    category: 'badges',
    type: 'badge',
    badgeText: 'CENSORED',
    badgeColor: '#000000',
    badgeStyle: 'plate',
  },
  {
    id: 'badge-100',
    label: '100% ФАКТ',
    category: 'badges',
    type: 'stamp',
    badgeText: '100% REAL',
    badgeColor: '#dc2626',
    badgeStyle: 'stamp',
  },
  {
    id: 'badge-press-f',
    label: 'PRESS F',
    category: 'badges',
    type: 'badge',
    badgeText: '[ F ]',
    badgeColor: '#2563eb',
    badgeStyle: 'plate',
  },
  {
    id: 'badge-bruh',
    label: 'BRUH',
    category: 'badges',
    type: 'badge',
    badgeText: 'BRUH',
    badgeColor: '#e11d48',
    badgeStyle: 'plate',
  },
  {
    id: 'badge-scam',
    label: 'СКАМ ⚠️',
    category: 'badges',
    type: 'badge',
    badgeText: 'SCAM ⚠️',
    badgeColor: '#d97706',
    badgeStyle: 'ribbon',
  },
  {
    id: 'badge-w',
    label: 'BIG W',
    category: 'badges',
    type: 'stamp',
    badgeText: 'MASSIVE W',
    badgeColor: '#16a34a',
    badgeStyle: 'stamp',
  },

  // 4. MEME CHARACTERS
  {
    id: 'char-pepe',
    label: 'Пепе',
    category: 'characters',
    type: 'sticker-art',
    emoji: '🐸',
  },
  {
    id: 'char-doge',
    label: 'Доге',
    category: 'characters',
    type: 'sticker-art',
    emoji: '🐕',
  },
  {
    id: 'char-chad',
    label: 'Гигачад',
    category: 'characters',
    type: 'sticker-art',
    emoji: '🗿',
  },
  {
    id: 'char-cat',
    label: 'Кот "Шо?"',
    category: 'characters',
    type: 'sticker-art',
    emoji: '🐱',
  },
  {
    id: 'char-clown',
    label: 'Клоун',
    category: 'characters',
    type: 'sticker-art',
    emoji: '🤡',
  },

  // 5. STICKER-EMOJIS (Наклейки с белым кантом)
  {
    id: 'emoji-skull',
    label: 'Череп',
    category: 'reactions',
    type: 'emoji',
    emoji: '💀',
  },
  {
    id: 'emoji-fire',
    label: 'Огонь',
    category: 'reactions',
    type: 'emoji',
    emoji: '🔥',
  },
  {
    id: 'emoji-joy',
    label: 'До слёз',
    category: 'reactions',
    type: 'emoji',
    emoji: '😂',
  },
  {
    id: 'emoji-exploding',
    label: 'Взрыв мозга',
    category: 'reactions',
    type: 'emoji',
    emoji: '🤯',
  },
  {
    id: 'emoji-eyes',
    label: 'Взгляд',
    category: 'reactions',
    type: 'emoji',
    emoji: '👀',
  },
  {
    id: 'emoji-crying',
    label: 'Рыдает',
    category: 'reactions',
    type: 'emoji',
    emoji: '😭',
  },
  {
    id: 'emoji-thinking',
    label: 'Думает',
    category: 'reactions',
    type: 'emoji',
    emoji: '🤔',
  },
  {
    id: 'emoji-money',
    label: 'Деньги',
    category: 'reactions',
    type: 'emoji',
    emoji: '💸',
  },
  {
    id: 'emoji-poop',
    label: 'Какашка',
    category: 'reactions',
    type: 'emoji',
    emoji: '💩',
  },
  {
    id: 'emoji-sweat',
    label: 'Пот / Стресс',
    category: 'reactions',
    type: 'emoji',
    emoji: '😰',
  },
];
