import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { SegmentedControl } from '../ui/SegmentedControl';
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
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            className="brisa-icon-btn"
            onClick={onProximo}
            aria-label="Próximo período"
            title="Próximo"
          >
            <Icon name="chevron-right" size={16} />
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
        <SegmentedControl
          value={modo}
          options={MODOS}
          onChange={onModoChange}
          ariaLabel="Modo de visualização"
        />
      </div>
    </div>
  );
}
