import { Icon } from './Icon';
import './TimeRange.css';

interface TimeRangeProps {
  inicio: string;
  fim: string;
  onInicioChange: (valor: string) => void;
  onFimChange: (valor: string) => void;
  invalid?: boolean;
}

export function TimeRange({
  inicio,
  fim,
  onInicioChange,
  onFimChange,
  invalid,
}: TimeRangeProps) {
  return (
    <div
      className={`brisa-timerange ${invalid ? 'brisa-timerange--invalid' : ''}`}
    >
      <input
        type="time"
        value={inicio}
        onChange={(e) => onInicioChange(e.target.value)}
        className="brisa-timerange__input"
        aria-label="Horário de início"
      />
      <span className="brisa-timerange__sep" aria-hidden="true">
        <Icon name="arrow-right" size={16} />
      </span>
      <input
        type="time"
        value={fim}
        onChange={(e) => onFimChange(e.target.value)}
        className="brisa-timerange__input"
        aria-label="Horário de fim"
      />
    </div>
  );
}
