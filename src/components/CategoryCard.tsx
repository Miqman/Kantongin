import React from 'react';

type CategoryTheme = 'primary' | 'secondary' | 'secondary-fixed-dim';

interface CategoryCardProps {
  icon: string;
  title: string;
  budget: string;
  spentLabel: string;
  percentage: string;
  theme?: CategoryTheme;
  containerClass?: string;
  hasWarningFlare?: boolean;
}

export default function CategoryCard({
  icon,
  title,
  budget,
  spentLabel,
  percentage,
  theme = 'primary',
  containerClass = 'group hover:bg-surface-bright transition-all duration-300',
  hasWarningFlare = false,
}: CategoryCardProps) {
  
  // Theme color mappings
  const themeStyles = {
    'primary': {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      spentColor: 'text-on-surface-variant',
      percentageColor: 'text-primary',
      progressBg: 'bg-primary'
    },
    'secondary': {
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      spentColor: 'text-secondary',
      percentageColor: 'text-secondary',
      progressBg: 'bg-secondary'
    },
    'secondary-fixed-dim': {
      iconBg: 'bg-secondary-fixed-dim/10',
      iconColor: 'text-secondary-fixed-dim',
      spentColor: 'text-on-surface-variant',
      percentageColor: 'text-secondary',
      progressBg: 'bg-secondary-fixed-dim'
    }
  };

  const currentTheme = themeStyles[theme];

  return (
    <div className={`bg-surface-container-high p-6 rounded-3xl flex flex-col gap-6 ${containerClass}`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl ${currentTheme.iconBg} ${currentTheme.iconColor}`}>
          <span className="material-symbols-outlined" data-icon={icon}>{icon}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">{title}</p>
          <p className="text-lg font-bold">{budget}</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-medium">
          <span className={currentTheme.spentColor}>{spentLabel}</span>
          <span className={currentTheme.percentageColor}>{percentage}</span>
        </div>
        <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
          <div className={`${currentTheme.progressBg} h-full rounded-full transition-all duration-500`} style={{ width: percentage }}></div>
        </div>
      </div>
      
      {hasWarningFlare && (
        <div className="absolute top-0 right-0 p-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
