import {
  Brain,
  Briefcase,
  Coffee,
  Dices,
  Film,
  Flame,
  Gamepad2,
  Heart,
  HeartHandshake,
  Laugh,
  Radio,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface AiStyleDefinition {
  id: string;
  label: string;
  compactLabel: string;
  desc: string;
  icon: LucideIcon;
}

/**
 * Single source of truth for humor styles used by both the compact AI panel
 * and the full-screen caption modal. Keep IDs stable because they are sent to
 * the backend prompt logic and may be referenced by saved UI state.
 */
export const AI_STYLES: AiStyleDefinition[] = [
  {
    id: 'trending',
    label: 'Тренды / Вирусный',
    compactLabel: 'Тренды',
    icon: Flame,
    desc: 'Острый интернет-юмор и актуальные ситуации',
  },
  {
    id: 'roast',
    label: 'Подкол / Прожарка',
    compactLabel: 'Подкол / Прожарка',
    icon: Target,
    desc: 'Язвительный, резкий юмор, привязанный к тому, что реально видно на изображении',
  },
  {
    id: 'relatable',
    label: 'Жиза / Бытовуха',
    compactLabel: 'Жиза / Бытовуха',
    icon: Coffee,
    desc: 'Повседневные ситуации, знакомые почти каждому',
  },
  {
    id: 'work',
    label: 'Work (Офис и IT)',
    compactLabel: 'Work (Офис/IT)',
    icon: Briefcase,
    desc: 'Работа, дедлайны, созвоны, баги и офисная жизнь — только когда это уместно по кадру',
  },
  {
    id: 'millennials',
    label: 'Миллениалы (Дети 90-х)',
    compactLabel: 'Миллениалы',
    icon: Radio,
    desc: 'Карбид, заброшки, огород, картонка на горке, фишки, кассеты и другая узнаваемая ностальгия',
  },
  {
    id: 'genz',
    label: 'Зумеры / Пост-ирония',
    compactLabel: 'Зумеры',
    icon: Laugh,
    desc: 'Постирония, абсурд и современный интернет-язык',
  },
  {
    id: 'sarcastic',
    label: 'Сарказм / Ирония',
    compactLabel: 'Сарказм',
    icon: Zap,
    desc: 'Едкая ирония и беспощадная правда',
  },
  {
    id: 'wholesome',
    label: 'Добро и милота',
    compactLabel: 'Добро и милота',
    icon: Heart,
    desc: 'Теплый, поддерживающий и добрый юмор',
  },
  {
    id: 'philosophy',
    label: 'Ночные мысли',
    compactLabel: 'Ночные мысли',
    icon: Brain,
    desc: 'Экзистенциальные мысли в три часа ночи',
  },
  {
    id: 'gaming',
    label: 'Игры и гейминг',
    compactLabel: 'Гейминг',
    icon: Gamepad2,
    desc: 'Рейтинг, лаги, сайд-квесты и тиммейты',
  },
  {
    id: 'dating',
    label: 'Отношения',
    compactLabel: 'Отношения',
    icon: HeartHandshake,
    desc: 'Ред-флаги, переписки, намеки и неловкие свидания',
  },
  {
    id: 'cinema',
    label: 'Кино и драма',
    compactLabel: 'Кино',
    icon: Film,
    desc: 'Кинематографичный пафос и эпичные повороты',
  },
  {
    id: 'absurd',
    label: 'Абсурд / Шитпостинг',
    compactLabel: 'Шитпост',
    icon: Dices,
    desc: 'Сюрреалистичный юмор и непредсказуемый панч',
  },
];

export function getAiStyle(styleId: string): AiStyleDefinition | undefined {
  return AI_STYLES.find((style) => style.id === styleId);
}
