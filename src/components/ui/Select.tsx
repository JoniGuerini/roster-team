import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import './Select.css';

interface Option {
  value: string;
  label: string;
}

interface SelectChangeEvent {
  target: { value: string };
}

interface SelectProps {
  id?: string;
  options: Option[];
  value?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange?: (event: SelectChangeEvent) => void;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      options,
      value,
      placeholder = 'Selecione…',
      invalid,
      disabled,
      onChange,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const selecionada = options.find((option) => option.value === value);

    useEffect(() => {
      if (!open) return;
      const handlePointer = (event: MouseEvent) => {
        if (!wrapperRef.current?.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handlePointer);
      return () => document.removeEventListener('mousedown', handlePointer);
    }, [open]);

    useEffect(() => {
      if (open) {
        const indiceAtual = options.findIndex((option) => option.value === value);
        setHighlighted(indiceAtual >= 0 ? indiceAtual : 0);
      }
    }, [open, options, value]);

    useEffect(() => {
      if (!open || highlighted < 0 || !listRef.current) return;
      const item = listRef.current.querySelector<HTMLElement>(
        `[data-index="${highlighted}"]`,
      );
      item?.scrollIntoView({ block: 'nearest' });
    }, [highlighted, open]);

    function abrir() {
      if (disabled) return;
      setOpen(true);
    }

    function fechar() {
      setOpen(false);
      buttonRef.current?.focus();
    }

    function selecionar(opcao: Option) {
      onChange?.({ target: { value: opcao.value } });
      fechar();
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        setHighlighted((prev) => {
          const total = options.length;
          if (total === 0) return -1;
          if (event.key === 'ArrowDown') return (prev + 1) % total;
          return (prev - 1 + total) % total;
        });
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const opcao = options[highlighted];
        if (opcao) selecionar(opcao);
        return;
      }

      if (event.key === 'Escape') {
        if (open) {
          event.preventDefault();
          fechar();
        }
        return;
      }

      if (event.key === 'Tab' && open) {
        setOpen(false);
      }
    }

    const classes = [
      'brisa-select',
      invalid ? 'brisa-select--invalid' : '',
      open ? 'brisa-select--open' : '',
      disabled ? 'brisa-select--disabled' : '',
      !selecionada ? 'brisa-select--empty' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="brisa-select-wrapper" ref={wrapperRef}>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          className={classes}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-disabled={disabled || undefined}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onClick={() => (open ? fechar() : abrir())}
          onKeyDown={handleKeyDown}
        >
          <span className="brisa-select__value">
            {selecionada ? selecionada.label : placeholder}
          </span>
          <svg
            className="brisa-select__chevron"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div
            className="brisa-select__popover"
            role="listbox"
            aria-labelledby={id}
            ref={listRef}
            tabIndex={-1}
          >
            {options.length === 0 ? (
              <div className="brisa-select__empty">Nenhuma opção</div>
            ) : (
              options.map((opcao, indice) => {
                const ativo = opcao.value === value;
                const destacado = indice === highlighted;
                return (
                  <button
                    key={opcao.value}
                    type="button"
                    role="option"
                    aria-selected={ativo}
                    data-index={indice}
                    className={[
                      'brisa-select__option',
                      ativo ? 'brisa-select__option--active' : '',
                      destacado ? 'brisa-select__option--highlighted' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setHighlighted(indice)}
                    onClick={() => selecionar(opcao)}
                  >
                    <span>{opcao.label}</span>
                    {ativo && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
