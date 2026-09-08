export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  category: 'classic' | 'trending' | 'reactions' | 'animals' | 'gaming';
  defaultTopText?: string;
  defaultBottomText?: string;
  tags: string[];
}

export interface TrendingWebMeme {
  id: string;
  name: string;
  url: string;
  trendReason: string;
  source: string;
  defaultTopText?: string;
  defaultBottomText?: string;
  tags: string[];
}

export type MemeProvider = 'reddit' | 'imgflip' | 'meme_api' | 'imgur' | 'curated';

export interface WebMemeItem {
  id: string;
  provider: MemeProvider;
  sourceId?: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourcePage?: string;
  author?: string;
  createdAt?: number;
  nsfw?: boolean;
  hash?: string;
  tags?: string[];
  defaultTopText?: string;
  defaultBottomText?: string;
}

export interface SavedMemeState {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageSrc: string;
  textBoxes: TextBox[];
  stickers: MemeSticker[];
  filter: MemeFilter;
  filterIntensity?: number;
  watermark: boolean;
  timestamp: number;
  isFavorite?: boolean;
  templateId?: string | null;
}

export interface FavoriteWebTemplate {
  id: string;
  // Canonical fields used when restoring a web favorite.
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  source: string;
  provider: string;
  sourceId?: string;
  hash?: string;
  defaultTopText?: string;
  defaultBottomText?: string;
  addedAt: number;
  // Legacy aliases kept temporarily so existing localStorage entries can migrate safely.
  name?: string;
  url?: string;
}

export interface CaptionSuggestion {
  headline: string;
  topText: string;
  bottomText: string;
  style: string;
  explanation: string;
  visualContradiction?: string;
  spottedDetail?: string;
  detectedMood?: string;
  humorMechanic?: string;
  imageConnection?: string;
}

export interface TextBox {
  id: string;
  text: string;
  x: number; // percentage (0 - 100) or pixels
  y: number; // percentage (0 - 100)
  fontSize: number; // in pt/px relative to standard 600px width
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  strokeType?: 'outer' | 'inner' | 'none';
  isUppercase: boolean;
  isBold: boolean;
  textAlign: 'left' | 'center' | 'right';
  shadow: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  hasBackground: boolean;
  bgColor?: string;
}

// `vector`/`stamp`/`emoji` are the current sticker collection formats.
// Legacy values stay accepted so saved projects created by earlier MEMENATOR
// builds remain loadable instead of failing during migration.
export type MemeStickerType =
  | 'emoji'
  | 'vector'
  | 'stamp'
  | 'sunglasses'
  | 'laser-eyes'
  | 'custom'
  | 'badge'
  | 'sticker-art';

export interface MemeSticker {
  id: string;
  label: string;
  emoji?: string;
  stickerId?: string;
  type: MemeStickerType;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number;
  rotation: number;
}

export type MemeFilter =
  | 'none'
  | 'deepfry'
  | 'vhs'
  | 'vintage'
  | 'grayscale'
  | 'contrast'
  | 'warm'
  | 'dramatic'
  | 'cyberpunk'
  | 'vivid'
  | 'toxic'
  | 'vignette';

export interface FocalSubject {
  name: string;
  box: { x: number; y: number; width: number; height: number }; // percentages 0-100
  role: 'primary' | 'secondary' | 'background';
  gazeDirection?: 'left' | 'right' | 'direct' | 'up' | 'down' | 'none';
  description: string;
}

export interface TextSafeZone {
  area: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  box: { x: number; y: number; width: number; height: number }; // percentages 0-100
  recommendedTopY?: number;
  recommendedBottomY?: number;
  contrastQuality: 'excellent' | 'good' | 'medium';
  bgLuminance: 'dark' | 'light' | 'mixed';
  recommendedTextColor: string;
  recommendedStrokeColor: string;
  reason: string;
}

export interface CompositionMetrics {
  visualBalance: number; // 0-100
  negativeSpace: number; // 0-100
  contrastReadability: number; // 0-100
  comedicFocus: number; // 0-100
}

export interface SuggestedTextPlacements {
  topTextY: number; // percentage 0-100
  bottomTextY: number; // percentage 0-100
  align: 'center' | 'left' | 'right';
  suggestedFontSize: number;
  fontRecommendation: string;
  reason: string;
}

export interface CompositionAnalysis {
  overallScore: number; // 0-100
  balanceAssessment: string;
  ruleOfThirdsAlignment: 'strong' | 'moderate' | 'centered';
  detectedStyle: string;
  metrics: CompositionMetrics;
  focalSubjects: FocalSubject[];
  safeZones: TextSafeZone[];
  recommendations: string[];
  suggestedTextPlacements: SuggestedTextPlacements;
  isFallback?: boolean;
}

export type CompositionGuideType = 'none' | 'thirds' | 'golden' | 'focal' | 'zones';

export interface GeneratedMemeImage {
  id: string;
  imageUrl: string;
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  createdAt: number;
  modelUsed?: string;
  isFallback?: boolean;
  sourceMode?: 'create' | 'edit';
}
