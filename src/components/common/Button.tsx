import React from 'react';
import { motion } from 'motion/react';
import { triggerHaptic } from '../../telegram/webapp';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  isLoading = false,
  fullWidth = false,
  className = '',
  icon
}) => {
  const handleClick = () => {
    if (disabled || isLoading) return;
    triggerHaptic('impact', 'light');
    if (onClick) onClick();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/30 hover:brightness-110';
      case 'secondary':
        return 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700';
      case 'danger':
        return 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 border border-rose-400/30 hover:bg-rose-500';
      case 'ghost':
        return 'bg-transparent text-slate-300 hover:bg-slate-800/40 border border-transparent';
      default:
        return '';
    }
  };

  return (
    <motion.button
      type={type}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`rounded-2xl py-3.5 px-6 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${getVariantStyles()} ${
        fullWidth ? 'w-full' : ''
      } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Memproses...</span>
        </div>
      ) : (
        <>
          {icon && <span className="text-lg">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};
