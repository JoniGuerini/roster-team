import type { InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
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
        <Icon name="check" size={13} />
      </span>
      <span className="brisa-checkbox__label">{label}</span>
    </label>
  );
}
