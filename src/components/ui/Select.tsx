import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import './Select.css';

export interface SelectOption {
  value: string;
  /** Texto para busca, leitores de ecrã e quando não há `optionContent`. */
  label: string;
  /** Conteúdo visual da linha (ex.: nome + pills). */
  optionContent?: ReactNode;
  disabled?: boolean;
}

interface SelectChangeEvent {
  target: { value: string };
}

interface SelectProps {
  id?: string;
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Abertura do menu em relação ao gatilho (útil junto ao fundo do ecrã). */
  menuPlacement?: 'bottom' | 'top';
  /** Campo de busca dentro da lista (útil para listas longas). */
  searchable?: boolean;
  searchPlaceholder?: string;
  onChange?: (event: SelectChangeEvent) => void;
}

function normalizarBusca(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function posicaoMenu(
  trigger: DOMRect,
  placement: 'bottom' | 'top',
): CSSProperties {
  const gap = 6;
  const padding = 8;
  const width = trigger.width;
  const left = Math.min(
    Math.max(padding, trigger.left),
    window.innerWidth - width - padding,
  );

  if (placement === 'top') {
    return {
      position: 'fixed',
      left,
      width,
      bottom: window.innerHeight - trigger.top + gap,
    };
  }

  return {
    position: 'fixed',
    left,
    width,
    top: trigger.bottom + gap,
  };
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
      menuPlacement = 'bottom',
      searchable = false,
      searchPlaceholder = 'Buscar…',
      onChange,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState<number>(-1);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const opcoesVisiveis = useMemo(() => {
      if (!searchable) return options;
      const q = normalizarBusca(query.trim());
      if (!q) return options;
      return options.filter(
        (o) => o.value === '' || normalizarBusca(o.label).includes(q),
      );
    }, [options, query, searchable]);

    const selecionada = options.find((option) => option.value === value);

    useEffect(() => {
      if (!open) return;
      const handlePointer = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          !wrapperRef.current?.contains(target) &&
          !popoverRef.current?.contains(target)
        ) {
          setOpen(false);
          setQuery('');
        }
      };
      document.addEventListener('mousedown', handlePointer);
      return () => document.removeEventListener('mousedown', handlePointer);
    }, [open]);

    useLayoutEffect(() => {
      if (!open || !buttonRef.current) return;

      const atualizarPosicao = () => {
        if (!buttonRef.current) return;
        setMenuStyle(
          posicaoMenu(buttonRef.current.getBoundingClientRect(), menuPlacement),
        );
      };

      atualizarPosicao();
      window.addEventListener('resize', atualizarPosicao);
      window.addEventListener('scroll', atualizarPosicao, true);
      return () => {
        window.removeEventListener('resize', atualizarPosicao);
        window.removeEventListener('scroll', atualizarPosicao, true);
      };
    }, [open, menuPlacement, opcoesVisiveis.length, searchable, query]);

    useEffect(() => {
      if (open && searchable) {
        const t = requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
        return () => cancelAnimationFrame(t);
      }
    }, [open, searchable]);

    useEffect(() => {
      if (!open) return;
      const idx = opcoesVisiveis.findIndex((option) => option.value === value);
      setHighlighted(idx >= 0 ? idx : 0);
    }, [open, opcoesVisiveis, value]);

    useEffect(() => {
      if (!open || highlighted < 0 || !listRef.current) return;
      const item = listRef.current.querySelector<HTMLElement>(
        `[data-index="${highlighted}"]`,
      );
      item?.scrollIntoView({ block: 'nearest' });
    }, [highlighted, open]);

    function abrir() {
      if (disabled) return;
      if (buttonRef.current) {
        setMenuStyle(
          posicaoMenu(buttonRef.current.getBoundingClientRect(), menuPlacement),
        );
      }
      setOpen(true);
    }

    function fechar() {
      setOpen(false);
      setQuery('');
      buttonRef.current?.focus();
    }

    function selecionar(opcao: SelectOption) {
      if (opcao.disabled) return;
      onChange?.({ target: { value: opcao.value } });
      fechar();
    }

    function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === 'Tab') {
        event.preventDefault();
        fechar();
        return;
      }
      const total = opcoesVisiveis.length;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (total === 0) return;
        setHighlighted((prev) => {
          if (prev < 0) return 0;
          return (prev + 1) % total;
        });
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (total === 0) return;
        setHighlighted((prev) => {
          if (prev < 0) return total - 1;
          return (prev - 1 + total) % total;
        });
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const opcao = opcoesVisiveis[highlighted];
        if (opcao) selecionar(opcao);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        fechar();
      }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (disabled) return;
      if (searchable && open) return;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open) {
          abrir();
          return;
        }
        setHighlighted((prev) => {
          const total = opcoesVisiveis.length;
          if (total === 0) return -1;
          if (event.key === 'ArrowDown') return (prev + 1) % total;
          return (prev - 1 + total) % total;
        });
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!open) {
          abrir();
          return;
        }
        const opcao = opcoesVisiveis[highlighted];
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
        setQuery('');
      }
    }

    const classes = [
      'brisa-select',
      invalid ? 'brisa-select--invalid' : '',
      open ? 'brisa-select--open' : '',
      disabled ? 'brisa-select--disabled' : '',
      !selecionada ? 'brisa-select--empty' : '',
      selecionada?.optionContent ? 'brisa-select--rich-value' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const popoverClasses = [
      'brisa-select__popover',
      menuPlacement === 'top' ? 'brisa-select__popover--top' : '',
      searchable ? 'brisa-select__popover--searchable' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const menu = open ? (
      <div
        ref={popoverRef}
        className={popoverClasses}
        style={menuStyle}
        role="presentation"
      >
        {searchable && (
          <div className="brisa-select__search">
            <input
              ref={searchInputRef}
              type="search"
              className="brisa-select__search-input"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
        )}
        <div
          className="brisa-select__options-scroll"
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          tabIndex={-1}
        >
          {opcoesVisiveis.length === 0 ? (
            <div className="brisa-select__empty">
              {searchable && query.trim()
                ? 'Nenhum resultado'
                : 'Nenhuma opção'}
            </div>
          ) : (
            opcoesVisiveis.map((opcao, indice) => {
              const ativo = opcao.value === value;
              const destacado = indice === highlighted;
              return (
                <button
                  key={opcao.value || '__empty__'}
                  type="button"
                  role="option"
                  aria-selected={ativo}
                  aria-disabled={opcao.disabled || undefined}
                  data-index={indice}
                  disabled={opcao.disabled}
                  className={[
                    'brisa-select__option',
                    ativo ? 'brisa-select__option--active' : '',
                    destacado ? 'brisa-select__option--highlighted' : '',
                    opcao.disabled ? 'brisa-select__option--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHighlighted(indice)}
                  onClick={() => selecionar(opcao)}
                >
                  <span className="brisa-select__option-label">
                    {opcao.optionContent ?? opcao.label}
                  </span>
                  {ativo && <Icon name="check" size={14} />}
                </button>
              );
            })
          )}
        </div>
      </div>
    ) : null;

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
          aria-label={
            selecionada?.optionContent ? selecionada.label : undefined
          }
          disabled={disabled}
          title={selecionada && !open ? selecionada.label : undefined}
          onClick={() => (open ? fechar() : abrir())}
          onKeyDown={handleKeyDown}
        >
          <span className="brisa-select__value">
            {selecionada
              ? (selecionada.optionContent ?? selecionada.label)
              : placeholder}
          </span>
          <Icon name="chevron-down" size={14} className="brisa-select__chevron" />
        </button>

        {menu && createPortal(menu, document.body)}
      </div>
    );
  },
);

Select.displayName = 'Select';
