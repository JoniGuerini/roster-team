import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'brisa-btn',
    `brisa-btn--${variant}`,
    `brisa-btn--${size}`,
    fullWidth ? 'brisa-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {leftIcon && <span className="brisa-btn__icon">{leftIcon}</span>}
      <span className="brisa-btn__label">{children}</span>
      {rightIcon && <span className="brisa-btn__icon">{rightIcon}</span>}
    </button>
  );
}
