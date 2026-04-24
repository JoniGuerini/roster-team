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
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
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
