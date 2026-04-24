import type { ReactNode } from 'react';
import './Field.css';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: FieldProps) {
  return (
    <div className={`brisa-field ${error ? 'brisa-field--error' : ''}`}>
      <label className="brisa-field__label" htmlFor={htmlFor}>
        {label}
        {required && <span className="brisa-field__required">*</span>}
      </label>
      {children}
      {error ? (
        <span className="brisa-field__message brisa-field__message--error">
          {error}
        </span>
      ) : hint ? (
        <span className="brisa-field__message">{hint}</span>
      ) : null}
    </div>
  );
}
