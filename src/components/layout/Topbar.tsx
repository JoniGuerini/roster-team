import type { RotaId } from '../../hooks/useHashRoute';
import type { Sessao } from '../../services/authSession';
import { podeAcessarRota } from '../../utils/rotaPermissoes';
import { Icon } from '../ui/Icon';
import { SinoNotificacoes } from './SinoNotificacoes';
import './Topbar.css';

interface TopbarProps {
  sessao: Sessao;
  titulo: string;
  sidebarRecolhida: boolean;
  onAlternarSidebar: () => void;
  onNavegar: (rota: RotaId) => void;
}

export function Topbar({
  sessao,
  titulo,
  sidebarRecolhida,
  onAlternarSidebar,
  onNavegar,
}: TopbarProps) {
  const mostrarNotificacoes =
    !sessao.isPlatformAdmin &&
    podeAcessarRota('notificacoes', sessao.permissoes);

  return (
    <header className="brisa-topbar">
      <button
        type="button"
        className="brisa-topbar__trigger"
        onClick={onAlternarSidebar}
        aria-label={sidebarRecolhida ? 'Expandir menu' : 'Recolher menu'}
        aria-expanded={!sidebarRecolhida}
        title="Recolher menu (Ctrl+B)"
      >
        <Icon name="layout-sidebar" size={18} />
      </button>
      <div className="brisa-topbar__separator" aria-hidden="true" />
      <h1 className="brisa-topbar__title">{titulo}</h1>
      <div className="brisa-topbar__spacer" />
      {mostrarNotificacoes ? (
        <SinoNotificacoes onAbrirCentro={() => onNavegar('notificacoes')} />
      ) : null}
    </header>
  );
}
