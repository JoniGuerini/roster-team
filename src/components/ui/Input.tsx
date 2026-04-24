import { forwardRef, type InputHTMLAttributes } from 'react';
import './Input.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', invalid, ...rest }, ref) => {
    const classes = [
      'brisa-input',
      invalid ? 'brisa-input--invalid' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return <input ref={ref} className={classes} {...rest} />;
  },
);

Input.displayName = 'Input';
