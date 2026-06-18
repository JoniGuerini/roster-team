import type { RotaId } from '../../hooks/useHashRoute';
import type { Sessao } from '../../services/authSession';
import { podeAcessarRota } from '../../utils/rotaPermissoes';
import { SinoNotificacoes } from './SinoNotificacoes';
import './Topbar.css';

interface TopbarProps {
  sessao: Sessao;
  onNavegar: (rota: RotaId) => void;
}

export function Topbar({ sessao, onNavegar }: TopbarProps) {
  const mostrarNotificacoes =
    !sessao.isPlatformAdmin &&
    podeAcessarRota('notificacoes', sessao.permissoes);

  return (
    <div className="brisa-topbar">
      <div className="brisa-topbar__spacer" />
      {mostrarNotificacoes ? (
        <SinoNotificacoes onAbrirCentro={() => onNavegar('notificacoes')} />
      ) : null}
    </div>
  );
}
