import React from 'react';
import { MemeFeedPanel } from './MemeFeedPanel';
import { TrendingWebMeme, WebMemeItem, SavedMemeState } from '../types';

interface TrendingWebTemplatesProps {
  onSelectTrendingTemplate?: (template: TrendingWebMeme) => void;
  selectedUrl: string;
  onRestoreMeme?: (state: SavedMemeState) => void;
  onSelectWebTemplate?: (item: WebMemeItem) => void;
  onShowToast?: (msg: string) => void;
}

export const TrendingWebTemplates: React.FC<TrendingWebTemplatesProps> = ({
  onSelectTrendingTemplate,
  selectedUrl,
  onRestoreMeme = () => {},
  onSelectWebTemplate,
  onShowToast = () => {},
}) => {
  const handleSelectWeb = (item: WebMemeItem) => {
    if (onSelectWebTemplate) {
      onSelectWebTemplate(item);
    } else if (onSelectTrendingTemplate) {
      onSelectTrendingTemplate({
        id: item.id,
        name: item.title,
        url: item.imageUrl,
        trendReason: item.provider,
        source: item.provider.toUpperCase(),
        defaultTopText: item.defaultTopText,
        defaultBottomText: item.defaultBottomText,
        tags: item.tags || [],
      });
    }
  };

  return (
    <MemeFeedPanel
      onRestoreMeme={onRestoreMeme}
      onSelectWebTemplate={handleSelectWeb}
      selectedUrl={selectedUrl}
      onShowToast={onShowToast}
    />
  );
};
