'use client';

import { THEMES } from '@/lib/templates';
import type { TemplateId, ThemeId } from '@/lib/resume-types';

// Simplified template preview for selection grids.
export function TemplateThumbnail({ templateId, themeId }: { templateId: TemplateId; themeId: ThemeId }) {
  const theme = THEMES[themeId];

  const renderPreview = () => {
    switch (templateId) {
      case 'prestige-executive':
        return (
          <div className="w-full h-full p-2 flex flex-col">
            <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: theme.primary }} />
            <div className="h-0.5 w-8 rounded mb-2" style={{ backgroundColor: theme.accent }} />
            <div className="h-1 w-20 rounded mb-1" style={{ backgroundColor: theme.muted }} />
            <div className="flex-1 space-y-1.5 mt-2">
              <div className="h-0.5 w-full rounded" style={{ backgroundColor: theme.accent }} />
              <div className="h-1 w-full rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              <div className="h-1 w-3/4 rounded" style={{ backgroundColor: `${theme.muted}40` }} />
            </div>
          </div>
        );
      case 'nordic-minimal':
        return (
          <div className="w-full h-full p-3 flex flex-col">
            <div className="h-2 w-20 rounded mb-1" style={{ backgroundColor: theme.text }} />
            <div className="h-0.5 w-6 rounded mb-3" style={{ backgroundColor: theme.accent }} />
            <div className="flex-1 space-y-2">
              <div className="h-1 w-full rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              <div className="h-1 w-2/3 rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              <div className="h-1 w-full rounded mt-3" style={{ backgroundColor: `${theme.muted}40` }} />
            </div>
          </div>
        );
      case 'metropolitan-split':
        return (
          <div className="w-full h-full flex">
            <div className="w-1/3 h-full p-1.5" style={{ backgroundColor: theme.secondary }}>
              <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: `${theme.accent}40` }} />
              <div className="h-0.5 w-full rounded mb-1" style={{ backgroundColor: '#ffffff40' }} />
              <div className="h-0.5 w-3/4 rounded mb-1" style={{ backgroundColor: '#ffffff40' }} />
              <div className="space-y-0.5 mt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1 w-full rounded" style={{ backgroundColor: '#ffffff20' }} />
                ))}
              </div>
            </div>
            <div className="flex-1 p-2">
              <div className="h-1.5 w-12 rounded mb-1" style={{ backgroundColor: theme.text }} />
              <div className="h-1 w-8 rounded mb-2" style={{ backgroundColor: theme.muted }} />
              <div className="space-y-1">
                <div className="h-1 w-full rounded" style={{ backgroundColor: `${theme.muted}40` }} />
                <div className="h-1 w-3/4 rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              </div>
            </div>
          </div>
        );
      case 'classic-professional':
        return (
          <div className="w-full h-full p-2 flex flex-col items-center">
            <div className="h-1.5 w-16 rounded mb-1" style={{ backgroundColor: theme.text }} />
            <div className="h-0.5 w-12 rounded mb-2" style={{ backgroundColor: theme.muted }} />
            <div className="w-full h-1.5 rounded mb-2" style={{ backgroundColor: theme.primary }} />
            <div className="w-full space-y-1">
              <div className="h-1 w-full rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              <div className="h-1 w-2/3 rounded" style={{ backgroundColor: `${theme.muted}40` }} />
            </div>
          </div>
        );
      case 'impact-modern':
        return (
          <div className="w-full h-full flex flex-col">
            <div className="h-10 p-2" style={{ backgroundColor: theme.secondary }}>
              <div className="h-0.5 w-1 float-left mr-1 rounded" style={{ backgroundColor: theme.accent }} />
              <div className="h-1.5 w-10 rounded mb-0.5" style={{ backgroundColor: '#ffffff' }} />
              <div className="h-0.5 w-6 rounded" style={{ backgroundColor: theme.accent }} />
            </div>
            <div className="flex-1 p-2">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 px-1 rounded" style={{ backgroundColor: theme.surface }}>
                    <div className="h-0.5 w-3 rounded" style={{ backgroundColor: theme.text }} />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="h-1 w-full rounded" style={{ backgroundColor: `${theme.muted}40` }} />
                <div className="h-1 w-3/4 rounded" style={{ backgroundColor: `${theme.muted}40` }} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded overflow-hidden shadow-inner">
      {renderPreview()}
    </div>
  );
}
