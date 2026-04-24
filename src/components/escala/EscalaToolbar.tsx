import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { LOCAIS_TRABALHO, type LocalTrabalho } from '../../types/funcionario';
import {
  diasDaSemana,
  rotuloDataLonga,
  rotuloIntervalo,
  rotuloMesAno,
} from '../../utils/datas';
import './EscalaToolbar.css';

export type ModoVisualizacao = 'dia' | 'semana' | 'mes';
export type FiltroLocal = LocalTrabalho | 'todos';

interface EscalaToolbarProps {
  data: string;
  modo: ModoVisualizacao;
  filtroLocal: FiltroLocal;
  onModoChange: (modo: ModoVisualizacao) => void;
  onFiltroLocalChange: (filtro: FiltroLocal) => void;
  onAnterior: () => void;
  onProximo: () => void;
  onHoje: () => void;
}

const FILTRO_LOCAL_OPTIONS = [
  { value: 'todos', label: 'Todos os locais' },
  ...LOCAIS_TRABALHO.map((l) => ({ value: l.value, label: l.label })),
];

const MODOS: { value: ModoVisualizacao; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

function rotuloPeriodo(data: string, modo: ModoVisualizacao): string {
  if (modo === 'dia') return rotuloDataLonga(data);
  if (modo === 'semana') {
    const semana = diasDaSemana(data);
    return rotuloIntervalo(semana[0], semana[6]);
  }
  return rotuloMesAno(data);
}

export function EscalaToolbar({
  data,
  modo,
  filtroLocal,
  onModoChange,
  onFiltroLocalChange,
  onAnterior,
  onProximo,
  onHoje,
}: EscalaToolbarProps) {
  return (
    <div className="brisa-escala-toolbar">
      <div className="brisa-escala-toolbar__left">
        <div className="brisa-escala-nav">
          <button
            type="button"
            className="brisa-icon-btn"
            onClick={onAnterior}
            aria-label="Período anterior"
            title="Anterior"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="brisa-icon-btn"
            onClick={onProximo}
            aria-label="Próximo período"
            title="Próximo"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <Button variant="secondary" size="sm" onClick={onHoje}>
          Hoje
        </Button>
        <span className="brisa-escala-toolbar__periodo">
          {rotuloPeriodo(data, modo)}
        </span>
      </div>

      <div className="brisa-escala-toolbar__right">
        <div className="brisa-escala-toolbar__filtro">
          <Select
            options={FILTRO_LOCAL_OPTIONS}
            value={filtroLocal}
            onChange={(e) => onFiltroLocalChange(e.target.value as FiltroLocal)}
          />
        </div>
        <div className="brisa-segmented" role="tablist" aria-label="Modo de visualização">
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={modo === m.value}
              className={`brisa-segmented__btn ${modo === m.value ? 'brisa-segmented__btn--active' : ''}`}
              onClick={() => onModoChange(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
