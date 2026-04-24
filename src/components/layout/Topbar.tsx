import type { RotaId } from '../../hooks/useHashRoute';
import { SinoNotificacoes } from './SinoNotificacoes';
import './Topbar.css';

interface TopbarProps {
  onNavegar: (rota: RotaId) => void;
}

export function Topbar({ onNavegar }: TopbarProps) {
  return (
    <div className="brisa-topbar">
      <div className="brisa-topbar__spacer" />
      <SinoNotificacoes onAbrirCentro={() => onNavegar('notificacoes')} />
    </div>
  );
}
