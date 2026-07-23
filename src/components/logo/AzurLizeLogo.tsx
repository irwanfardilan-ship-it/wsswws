import React from 'react';
import { Layers } from 'lucide-react';

interface AzurLizeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const AzurLizeLogo: React.FC<AzurLizeLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { box: 'w-9 h-9', icon: 18, text: 'text-base' },
    md: { box: 'w-11 h-11', icon: 22, text: 'text-xl' },
    lg: { box: 'w-16 h-16', icon: 32, text: 'text-2xl' },
    xl: { box: 'w-24 h-24', icon: 48, text: 'text-3xl' }
  };

  const dimensions = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="shrink-0">
        <div
          className={`${dimensions.box} rounded-[10px] bg-blue-600 flex items-center justify-center border border-white/10`}
        >
          <Layers size={dimensions.icon} className="text-white" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white ${dimensions.text}`}>
              Azur<span className="text-blue-400">Lize</span>
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
              Team
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Recruitment System
          </span>
        </div>
      )}
    </div>
  );
};


