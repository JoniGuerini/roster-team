import { ITENS_LEGENDA_TURNO_STATUS } from '../../utils/turnoStatusLegend';
import './TurnoStatusLegend.css';

interface TurnoStatusLegendProps {
  inline?: boolean;
  className?: string;
}

export function TurnoStatusLegend({
  inline = false,
  className = '',
}: TurnoStatusLegendProps) {
  return (
    <div
      className={[
        'brisa-turno-legenda',
        inline ? 'brisa-turno-legenda--inline' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Legenda das cores dos turnos"
    >
      <span className="brisa-turno-legenda__titulo">Legenda</span>
      <ul className="brisa-turno-legenda__lista">
        {ITENS_LEGENDA_TURNO_STATUS.map((item) => (
          <li key={item.key} className="brisa-turno-legenda__item">
            <span
              className={`brisa-turno-legenda__swatch brisa-turno-legenda__swatch--${item.key}`}
              aria-hidden
            />
            <span className="brisa-turno-legenda__label">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
