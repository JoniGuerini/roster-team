import type { ReactNode } from 'react';
import './SegmentedControl.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`brisa-segmented ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`brisa-segmented__btn ${active ? 'brisa-segmented__btn--active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? (
              <span className="brisa-segmented__icon">{option.icon}</span>
            ) : null}
            {option.label}
            {option.badge != null ? (
              <span className="brisa-segmented__badge">{option.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
