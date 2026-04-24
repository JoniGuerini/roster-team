import type { InputHTMLAttributes } from 'react';
import './Checkbox.css';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
};

export function Checkbox({
  label,
  className = '',
  id,
  ...rest
}: CheckboxProps) {
  const inputId = id ?? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label className={`brisa-checkbox ${className}`} htmlFor={inputId}>
      <input id={inputId} type="checkbox" {...rest} />
      <span className="brisa-checkbox__box" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 8.5 6.5 12 13 4.5" />
        </svg>
      </span>
      <span className="brisa-checkbox__label">{label}</span>
    </label>
  );
}
