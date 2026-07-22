import React from 'react';
import iconImage from '../../assets/images/azurlize_app_icon_1784705553531.jpg';

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
    sm: { box: 'w-9 h-9', img: 'w-9 h-9', text: 'text-base' },
    md: { box: 'w-11 h-11', img: 'w-11 h-11', text: 'text-xl' },
    lg: { box: 'w-16 h-16', img: 'w-16 h-16', text: 'text-2xl' },
    xl: { box: 'w-24 h-24', img: 'w-24 h-24', text: 'text-3xl' }
  };

  const dimensions = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group shrink-0">
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
        
        <div
          className={`${dimensions.box} rounded-2xl relative overflow-hidden border border-white/25 shadow-2xl bg-slate-950 flex items-center justify-center`}
        >
          <img
            src={iconImage}
            alt="AzurLize Logo"
            referrerPolicy="no-referrer"
            className={`${dimensions.img} object-cover transform group-hover:scale-105 transition-transform duration-300`}
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight text-white ${dimensions.text}`}>
              Azur<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Lize</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-md">
              Team
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Recruitment System
          </span>
        </div>
      )}
    </div>
  );
};

