import React from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
  'bg-accent text-accentfg border border-accent enabled:hover:opacity-90 enabled:active:opacity-80',
  secondary:
  'bg-surface text-fg border border-linestrong enabled:hover:bg-surface2 enabled:active:bg-accentsoft',
  tertiary:
  'bg-transparent text-fg border border-transparent enabled:hover:bg-accentsoft enabled:active:bg-accentsoft',
  destructive:
  'bg-surface text-danger border border-danger/40 enabled:hover:bg-dangersoft enabled:active:bg-dangersoft'
};

const sizeClass: Record<Size, string> = {
  small: 'text-sm px-3 py-1.5 gap-1.5',
  medium: 'text-base px-4 py-2 gap-2',
  large: 'text-lg px-6 py-3 gap-2.5'
};

const iconOnlySizeClass: Record<Size, string> = {
  small: 'p-1.5',
  medium: 'p-2',
  large: 'p-3'
};

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  iconOnly,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded font-medium transition-all duration-200 disabled:cursor-not-allowed',
        variantClass[variant],
        iconOnly ? iconOnlySizeClass[size] : sizeClass[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}>
      
      {loading ?
      <span
        role="status"
        aria-label="Loading"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" /> :
      
      <>
          {leftIcon}
          {iconOnly ?? children}
          {rightIcon}
        </>
      }
    </button>);

}
