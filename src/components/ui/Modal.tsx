import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="brisa-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brisa-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`brisa-modal brisa-modal--${size}`}>
        <header className="brisa-modal__header">
          <div>
            <h2 id="brisa-modal-title" className="brisa-modal__title">
              {title}
            </h2>
            {description && (
              <p className="brisa-modal__description">{description}</p>
            )}
          </div>
          <button
            type="button"
            className="brisa-modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="brisa-modal__body">{children}</div>
        {footer && <footer className="brisa-modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
