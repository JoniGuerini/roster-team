import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { listarHorariosAgrupados } from '../../utils/opcoesHorario';
import { Icon } from './Icon';
import './TimeRange.css';

interface TimeRangeProps {
  inicio: string;
  fim: string;
  onInicioChange: (valor: string) => void;
  onFimChange: (valor: string) => void;
  invalid?: boolean;
}

type PickerAlvo = 'inicio' | 'fim';

interface TimePickerProps {
  alvo: PickerAlvo;
  value: string;
  aberto: boolean;
  invalid?: boolean;
  placeholder?: string;
  ariaLabel: string;
  grupos: ReturnType<typeof listarHorariosAgrupados>;
  onAbrir: () => void;
  onFechar: () => void;
  onChange: (valor: string) => void;
}

function posicaoMenu(trigger: DOMRect): CSSProperties {
  const gap = 6;
  const padding = 8;
  const width = Math.max(trigger.width, 220);
  const left = Math.min(
    Math.max(padding, trigger.left),
    window.innerWidth - width - padding,
  );

  return {
    position: 'fixed',
    left,
    width,
    top: trigger.bottom + gap,
  };
}

function TimePicker({
  alvo,
  value,
  aberto,
  invalid,
  placeholder = '--:--',
  ariaLabel,
  grupos,
  onAbrir,
  onFechar,
  onChange,
}: TimePickerProps) {
  const [highlighted, setHighlighted] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const opcoes = useMemo(
    () => grupos.flatMap((grupo) => grupo.horarios),
    [grupos],
  );

  useEffect(() => {
    if (!aberto) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !wrapperRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        onFechar();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [aberto, onFechar]);

  useLayoutEffect(() => {
    if (!aberto || !buttonRef.current) return;

    const atualizarPosicao = () => {
      if (!buttonRef.current) return;
      setMenuStyle(posicaoMenu(buttonRef.current.getBoundingClientRect()));
    };

    atualizarPosicao();
    window.addEventListener('resize', atualizarPosicao);
    window.addEventListener('scroll', atualizarPosicao, true);
    return () => {
      window.removeEventListener('resize', atualizarPosicao);
      window.removeEventListener('scroll', atualizarPosicao, true);
    };
  }, [aberto, grupos.length]);

  useEffect(() => {
    if (!aberto) return;
    const idx = opcoes.findIndex((hora) => hora === value);
    setHighlighted(idx >= 0 ? idx : 0);
  }, [aberto, opcoes, value]);

  useEffect(() => {
    if (!aberto || highlighted < 0 || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlighted}"]`,
    );
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted, aberto]);

  function selecionar(hora: string) {
    onChange(hora);
    onFechar();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!aberto) {
        onAbrir();
        return;
      }
      setHighlighted((prev) => {
        const total = opcoes.length;
        if (total === 0) return -1;
        if (event.key === 'ArrowDown') return (prev + 1) % total;
        return (prev - 1 + total) % total;
      });
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!aberto) {
        onAbrir();
        return;
      }
      const hora = opcoes[highlighted];
      if (hora) selecionar(hora);
      return;
    }

    if (event.key === 'Escape' && aberto) {
      event.preventDefault();
      onFechar();
      return;
    }

    if (event.key === 'Tab' && aberto) {
      onFechar();
    }
  }

  let indiceGlobal = -1;

  const menu = aberto ? (
    <div
      ref={popoverRef}
      className="brisa-timepicker__popover"
      style={menuStyle}
      role="presentation"
    >
      <div
        className="brisa-timepicker__options-scroll"
        ref={listRef}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {opcoes.length === 0 ? (
          <div className="brisa-timepicker__empty">Nenhum horário disponível</div>
        ) : (
          grupos.map((grupo) => (
            <div key={`${alvo}-${grupo.titulo}`} className="brisa-timepicker__group">
              <div className="brisa-timepicker__group-label">{grupo.titulo}</div>
              {grupo.horarios.map((hora) => {
                indiceGlobal += 1;
                const indice = indiceGlobal;
                const ativo = hora === value;
                const destacado = indice === highlighted;
                return (
                  <button
                    key={hora}
                    type="button"
                    role="option"
                    aria-selected={ativo}
                    data-index={indice}
                    className={[
                      'brisa-timepicker__option',
                      ativo ? 'brisa-timepicker__option--active' : '',
                      destacado ? 'brisa-timepicker__option--highlighted' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseEnter={() => setHighlighted(indice)}
                    onClick={() => selecionar(hora)}
                  >
                    <span className="brisa-timepicker__option-time">{hora}</span>
                    {ativo && <Icon name="check" size={14} />}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  ) : null;

  const classes = [
    'brisa-timepicker',
    aberto ? 'brisa-timepicker--open' : '',
    invalid ? 'brisa-timepicker--invalid' : '',
    !value ? 'brisa-timepicker--empty' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="brisa-timepicker-wrapper" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        className={classes}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        onClick={() => (aberto ? onFechar() : onAbrir())}
        onKeyDown={handleKeyDown}
      >
        <Icon name="clock" size={15} className="brisa-timepicker__icon" />
        <span className="brisa-timepicker__value">{value || placeholder}</span>
        <Icon name="chevron-down" size={14} className="brisa-timepicker__chevron" />
      </button>
      {menu && createPortal(menu, document.body)}
    </div>
  );
}

export function TimeRange({
  inicio,
  fim,
  onInicioChange,
  onFimChange,
  invalid,
}: TimeRangeProps) {
  const [aberto, setAberto] = useState<PickerAlvo | null>(null);

  const gruposInicio = useMemo(
    () => listarHorariosAgrupados([inicio, fim]),
    [inicio, fim],
  );

  const gruposFim = useMemo(
    () => listarHorariosAgrupados([inicio, fim], inicio ? [inicio] : []),
    [inicio, fim],
  );

  return (
    <div
      className={`brisa-timerange ${invalid ? 'brisa-timerange--invalid' : ''} ${aberto ? 'brisa-timerange--open' : ''}`}
    >
      <TimePicker
        alvo="inicio"
        value={inicio}
        aberto={aberto === 'inicio'}
        invalid={invalid}
        ariaLabel="Horário de início"
        grupos={gruposInicio}
        onAbrir={() => setAberto('inicio')}
        onFechar={() => setAberto(null)}
        onChange={onInicioChange}
      />
      <span className="brisa-timerange__sep" aria-hidden="true">
        <Icon name="arrow-right" size={16} />
      </span>
      <TimePicker
        alvo="fim"
        value={fim}
        aberto={aberto === 'fim'}
        invalid={invalid}
        ariaLabel="Horário de fim"
        grupos={gruposFim}
        onAbrir={() => setAberto('fim')}
        onFechar={() => setAberto(null)}
        onChange={onFimChange}
      />
    </div>
  );
}
